import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getPatchableCycleFields } from '@lib/schema/cycle';
import {
    getCaseStateWithKnownIssue,
    getCaseStateWithLastExecution,
    recomputeCycleTestValues,
} from '@lib/server_utils';
import { getCycleByID, updateCycle } from '@lib/store/cycle';
import { getKnownIssueByCycleID } from '@lib/store/known_issue';
import { getLastCaseExecutions, saveCaseExecution } from '@lib/store/case_execution';
import {
    getDoneSpecs,
    getLastSpecExecutions,
    getSpecByID,
    updateSpecsAsDone,
} from '@lib/store/spec_execution';
import auth from '@middleware/auth';
import { CaseExecution, SpecExecution } from '@types';
import { parseBuild } from '@lib/common_utils';

async function endSpecExecution(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;

    if (query.id) {
        const spec = req.body.spec as SpecExecution;
        const tests = req.body.tests as CaseExecution[];

        try {
            const specId = query.id.toString();

            // get spec by ID
            const { error: origSpecError, spec: origSpec } = await getSpecByID(specId);
            if (origSpecError || !origSpec) {
                return res.status(400).json({
                    error: true,
                    message: origSpecError || 'Error getting a spec',
                });
            }

            // get cycle by ID
            const { error: cycleError, cycle: origCycle } = await getCycleByID(origSpec.cycle_id);
            if (cycleError || !origCycle) {
                return res.status(400).json({
                    error: true,
                    message: cycleError || 'Error getting a cycle',
                });
            }

            const { repo, branch, build } = origCycle;

            // get known issue of the test cycle
            const { error: knownIssueError, knownIssue } = await getKnownIssueByCycleID(
                origCycle.id
            );
            if (knownIssueError) {
                return res.status(400).json({
                    error: true,
                    message: knownIssueError,
                });
            }

            const caseExecutions: Partial<CaseExecution>[] = [];
            for (const t of tests) {
                const caseDraft: Partial<CaseExecution> = {
                    title: t.title,
                    full_title: t.full_title,
                    key: t.key,
                    key_step: t.key_step,
                    state: t.state,
                    duration: t.duration,
                    code: t.code,
                    error_display: t.error_display,
                    error_frame: t.error_frame,
                    screenshot: t.screenshot,
                    test_start_at: t.test_start_at,
                    cycle_id: origSpec.cycle_id,
                    spec_execution_id: origSpec.id,
                };

                // get last case executions
                const { error: lastCaseError, last_case_executions } = await getLastCaseExecutions(
                    t.full_title,
                    repo,
                    parseBuild(build).buildSuffix
                );
                if (lastCaseError) {
                    // log for debugging only
                    console.log(lastCaseError);
                }

                if (last_case_executions?.length) {
                    caseDraft.last_execution = last_case_executions;
                }

                if (caseDraft.state === 'failed') {
                    // re-evaluate failed tests if indeed failed, bug, known or flaky

                    let updated = false;

                    // based from known issue -- manually identified thru json file
                    if (knownIssue?.data) {
                        const { state, ticket } = getCaseStateWithKnownIssue(
                            knownIssue.data,
                            origSpec.file,
                            t.full_title
                        );
                        if (state) {
                            if (ticket) {
                                caseDraft.known_fail_ticket = ticket;
                            }
                            caseDraft.state = state;
                            updated = true;
                        }
                    }

                    // based from historical data -- automatically identified
                    if (!updated && last_case_executions?.length) {
                        const state = getCaseStateWithLastExecution(last_case_executions);
                        if (state) {
                            caseDraft.state = state;
                        }
                    }
                }

                caseExecutions.push(caseDraft);
            }

            // save each case execution
            const cases = await Promise.all(
                caseExecutions.map((ce) => {
                    return saveCaseExecution(ce);
                })
            );

            const specPatch: Partial<SpecExecution> = {
                id: specId,
                state: 'done', // explicitly set as done
                pass: spec.pass,
                pending: spec.pending,
                skipped: spec.skipped,
                duration: spec.duration,
                test_start_at: spec.test_start_at,
                test_end_at: spec.test_end_at,
            };

            if (spec.fail > 0) {
                // recompute and regroup as failed, bug, known or flaky
                const failedCount = recomputeSpecFailedCount(caseExecutions);
                specPatch.fail = failedCount.failed;
                specPatch.bug = failedCount.bug;
                specPatch.known = failedCount.known;
                specPatch.flaky = failedCount.flaky;
            }

            // get last specs executions
            const { error: lastSpecError, last_spec_executions } = await getLastSpecExecutions(
                spec.file,
                repo,
                parseBuild(build).buildSuffix
            );
            if (lastSpecError) {
                // log for debugging only
                console.log(lastSpecError);
            }

            if (last_spec_executions?.length) {
                specPatch.last_execution = last_spec_executions;
            }

            // update spec as done
            const { error: specError, spec: updatedSpecExecution } = await updateSpecsAsDone(
                specPatch
            );
            if (specError || !updatedSpecExecution) {
                return res.status(400).json({
                    error: true,
                    message: specError || 'Error updating specs',
                });
            }

            // get specs that were done testing
            const { error: doneSpecsError, specs: doneSpecs } = await getDoneSpecs(origCycle.id);
            if (doneSpecsError || !doneSpecs) {
                return res.status(400).json({
                    error: true,
                    message: doneSpecsError || 'Error getting specs',
                });
            }

            // recompute cycle test values
            const recomputedCycle = recomputeCycleTestValues(origCycle, doneSpecs);

            // do not update this field
            delete recomputedCycle.specs_registered;

            const { error: cyclePatchError, value: cyclePatch } =
                getPatchableCycleFields(recomputedCycle);
            if (cyclePatchError) {
                return res.status(400).json({
                    error: true,
                    message: cyclePatchError,
                });
            }

            // update the cycle with recomputed values
            const { error: updateCycleError, cycle: updatedCycle } = await updateCycle({
                ...cyclePatch,
                id: origCycle.id,
            });
            if (updateCycleError || !updatedCycle) {
                return res.status(400).json({
                    error: true,
                    message: updateCycleError || 'Error updating a cycle',
                });
            }

            return res.status(201).json({
                cycle: updatedCycle,
                spec: updatedSpecExecution,
                cases,
            });
        } catch (e) {
            return res
                .status(501)
                .json({ error: true, message: 'Error while saving spec execution.' });
        }
    }

    return res.status(400).json({
        error: true,
        message: 'No ID found in request query.',
    });
}

export function recomputeSpecFailedCount(caseExecutions: Partial<CaseExecution>[] = []) {
    return caseExecutions.reduce(
        (acc: { failed: number; bug: number; known: number; flaky: number }, ce) => {
            switch (ce.state) {
                case 'failed':
                    acc.failed += 1;
                    break;
                case 'bug':
                    acc.bug += 1;
                    break;
                case 'known':
                    acc.known += 1;
                    break;
                case 'flaky':
                    acc.flaky += 1;
                    break;
            }

            return acc;
        },
        { failed: 0, bug: 0, known: 0, flaky: 0 }
    );
}

const handler = nextConnect();
handler.use(auth).post(endSpecExecution);

export default handler;
