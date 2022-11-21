import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getPatchableCycleFields } from '@lib/schema/cycle';
import { recomputeCycleTestValues } from '@lib/server_utils';
import { getCycleByID, updateCycle } from '@lib/store/cycle';
import { getKnownIssueByCycleID } from '@lib/store/known_issue';
import { saveCaseExecution } from '@lib/store/case_execution';
import { getDoneSpecs, updateSpecsAsDone } from '@lib/store/spec_execution';
import auth from '@middleware/auth';
import { CaseExecution, SpecExecution } from '@types';

async function endSpecExecution(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;

    if (query.id) {
        const spec = req.body.spec as SpecExecution;
        const tests = req.body.tests as CaseExecution[];

        try {
            const specPatch = {
                id: query.id?.toString(),
                state: 'done', // explicitly set as done
                pass: spec.pass,
                fail: spec.fail,
                pending: spec.pending,
                skipped: spec.skipped,
                duration: spec.duration,
                test_start_at: spec.test_start_at,
                test_end_at: spec.test_end_at,
            };

            // update spec as done
            const { error: specError, spec: updatedSpecExecution } = await updateSpecsAsDone(
                specPatch
            );
            if (specError || !updatedSpecExecution) {
                return res.status(400).json({
                    error: true,
                    message: specError || 'Error getting specs',
                });
            }

            const caseExecutions: Partial<CaseExecution>[] = [];
            tests.forEach((t) => {
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
                    cycle_id: updatedSpecExecution.cycle_id,
                    spec_execution_id: updatedSpecExecution.id,
                };

                caseExecutions.push(caseDraft);
            });

            // save each case execution
            const cases = await Promise.all(
                caseExecutions.map((ce) => {
                    return saveCaseExecution(ce);
                })
            );

            // get cycle by ID
            const { error: cycleError, cycle: origCycle } = await getCycleByID(
                updatedSpecExecution.cycle_id
            );
            if (cycleError || !origCycle) {
                return res.status(400).json({
                    error: true,
                    message: cycleError || 'Error getting a cycle',
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

            // recompute cycle test values
            const recomputedCycle = recomputeCycleTestValues(
                origCycle,
                doneSpecs,
                knownIssue?.data
            );
            console.log('end recomputedCycle', recomputedCycle);

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

const handler = nextConnect();
handler.use(auth).post(endSpecExecution);

export default handler;
