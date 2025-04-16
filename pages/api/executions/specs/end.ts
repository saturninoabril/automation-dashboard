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
import { CaseExecution, SpecExecution, Screenshot, CaseState } from '@types'; // Added CaseState
import { parseBuild } from '@lib/common_utils';

// Define interfaces for Playwright report structure (simplified)
interface PlaywrightError {
    message?: string;
    stack?: string;
    snippet?: string;
    location?: { file: string; line: number; column: number };
}

interface PlaywrightAttachment {
    name: string;
    contentType: string;
    path?: string;
    body?: string; // base64
}

interface PlaywrightResult {
    workerIndex: number;
    status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
    duration: number;
    errors: PlaywrightError[];
    attachments: PlaywrightAttachment[];
    startTime: string;
    retry: number;
}

interface PlaywrightTest {
    timeout: number;
    annotations: { type: string; description?: string }[];
    expectedStatus: string;
    projectId: string;
    projectName: string;
    results: PlaywrightResult[];
    status: string; // Final status after retries
}

interface PlaywrightSpec {
    title: string;
    ok: boolean;
    tags: string[];
    tests: PlaywrightTest[];
    id: string;
    file: string;
    line: number;
    column: number;
}

interface PlaywrightSuite {
    title: string; // Often the file path
    file: string;
    column: number;
    line: number;
    specs: PlaywrightSpec[];
}

interface PlaywrightPayload {
    // Assuming payload contains the structure for a single suite/spec file
    suite: PlaywrightSuite;
    // Add other relevant top-level info if needed, e.g., stats for this suite
}

// --- Helper function to map Playwright status ---
function mapPlaywrightStatus(pwStatus: PlaywrightResult['status']): CaseState {
    switch (pwStatus) {
        case 'passed':
            return 'passed';
        case 'failed':
        case 'timedOut':
        case 'interrupted':
            return 'failed'; // Initial state, might be updated later
        case 'skipped':
            return 'skipped';
        default:
            return 'failed'; // Default to failed for unexpected statuses
    }
}

// --- Helper function to extract screenshot ---
function extractPlaywrightScreenshot(attachments: PlaywrightAttachment[]): Screenshot | undefined {
    const screenshotAttachment = attachments.find(att => att.name === 'screenshot');
    if (screenshotAttachment) {
        return {
            name: screenshotAttachment.name,
            contentType: screenshotAttachment.contentType,
            path: screenshotAttachment.path,
            body: screenshotAttachment.body,
        };
    }
    return undefined;
}

// --- Helper function to extract error details ---
function extractPlaywrightErrorDetails(errors: PlaywrightError[]): { display: string | undefined, frame: any | undefined, stack: string | undefined, snippet: string | undefined } {
    if (!errors || errors.length === 0) {
        return { display: undefined, frame: undefined, stack: undefined, snippet: undefined };
    }
    // Use the first error
    const error = errors[0];
    return {
        display: error.message, // Use message for display
        frame: error, // Store the whole first error object in frame (since it's JSONB now)
        stack: error.stack,
        snippet: error.snippet,
    };
}


async function endSpecExecution(req: NextApiRequest, res: NextApiResponse) {
    const { query, body } = req;
    const specId = query.id?.toString();
    const runner = body.runner as 'cypress' | 'playwright';
    const payload = body.payload; // Contains either {spec, tests} for Cypress or PlaywrightSuite for Playwright

    if (specId && runner && payload) {
        try {
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

            let specPatchData: Partial<SpecExecution>;
            let caseExecutionsData: Partial<CaseExecution>[] = [];

            // --- Runner Specific Parsing ---
            if (runner === 'cypress') {
                // Existing Cypress Logic
                const cypressSpec = payload.spec as SpecExecution;
                const cypressTests = payload.tests as CaseExecution[];

                specPatchData = { // Data needed for specPatch later
                    id: specId,
                    pass: cypressSpec.pass,
                    pending: cypressSpec.pending,
                    skipped: cypressSpec.skipped,
                    duration: cypressSpec.duration,
                    test_start_at: cypressSpec.test_start_at,
                    test_end_at: cypressSpec.test_end_at,
                    file: cypressSpec.file, // Needed for last execution lookup
                    runner: 'cypress',
                };

                for (const t of cypressTests) {
                    const caseDraft: Partial<CaseExecution> = {
                        title: t.title,
                        full_title: t.full_title,
                        key: t.key,
                        key_step: t.key_step,
                        state: t.state,
                        duration: t.duration,
                        code: t.code,
                        error_display: t.error_display,
                        error_frame: t.error_frame, // Keep as is for Cypress
                        screenshot: t.screenshot,
                        test_start_at: t.test_start_at,
                        cycle_id: origSpec.cycle_id,
                        spec_execution_id: origSpec.id,
                        runner: 'cypress',
                    };
                    caseExecutionsData.push(caseDraft);
                }

            } else if (runner === 'playwright') {
                // New Playwright Logic
                const pwSuite = payload.suite as PlaywrightSuite;

                // Aggregate stats for the SpecExecution patch
                let specDuration = 0;
                let specPass = 0;
                let specFail = 0; // Includes failed, timedOut, interrupted
                let specSkipped = 0;
                let specStartTime: string | undefined;
                let specEndTime: string | undefined; // Harder to get precise end time for spec

                for (const pwSpec of pwSuite.specs) {
                    for (const pwTest of pwSpec.tests) {
                        // Use the final result after retries (last item in results array)
                        const finalResult = pwTest.results[pwTest.results.length - 1];
                        if (!finalResult) continue;

                        specDuration += finalResult.duration;
                        if (!specStartTime || new Date(finalResult.startTime) < new Date(specStartTime)) {
                            specStartTime = finalResult.startTime;
                        }
                        // specEndTime could be approximated by last test's start + duration

                        const mappedState = mapPlaywrightStatus(finalResult.status);
                        switch(mappedState) {
                            case 'passed': specPass++; break;
                            case 'failed': specFail++; break; // Aggregate all non-passed/skipped as fail for spec counts
                            case 'skipped': specSkipped++; break;
                        }

                        // Create CaseExecution draft
                        const { display, frame, stack, snippet } = extractPlaywrightErrorDetails(finalResult.errors);
                        const screenshot = extractPlaywrightScreenshot(finalResult.attachments);

                        const caseDraft: Partial<CaseExecution> = {
                            // title: ??? // Need to generate from pwSuite.title / pwSpec.title?
                            full_title: pwSpec.title, // Use Playwright spec title as full_title
                            // key: ??? // Playwright doesn't seem to have this concept directly
                            // key_step: ???
                            state: mappedState,
                            duration: finalResult.duration,
                            // code: ??? // Playwright doesn't provide this like Cypress
                            error_display: display,
                            error_frame: frame, // Store full Playwright error object
                            error_stack: stack,
                            error_snippet: snippet,
                            screenshot: screenshot,
                            test_start_at: finalResult.startTime,
                            cycle_id: origSpec.cycle_id,
                            spec_execution_id: origSpec.id,
                            runner: 'playwright',
                        };
                        caseExecutionsData.push(caseDraft);
                    }
                }

                specPatchData = {
                    id: specId,
                    pass: specPass,
                    fail: specFail, // Note: This doesn't map directly to bug/known/flaky yet
                    pending: 0, // Playwright doesn't have a direct 'pending' state in results
                    skipped: specSkipped,
                    duration: specDuration,
                    test_start_at: specStartTime,
                    // test_end_at: ??? // Approximate if needed
                    file: pwSuite.file, // Use file from Playwright suite
                    runner: 'playwright',
                };

            } else {
                 return res.status(400).json({ error: true, message: `Unsupported runner: ${runner}` });
            }


            // --- Common Logic (Post-Parsing) ---
            const processedCaseExecutions: Partial<CaseExecution>[] = [];
            for (const caseDraft of caseExecutionsData) {
                 // get last case executions (ensure full_title is present)
                 if (!caseDraft.full_title) {
                    console.warn('Skipping case execution due to missing full_title:', caseDraft);
                    continue;
                 }
                 const { error: lastCaseError, last_case_executions } = await getLastCaseExecutions(
                    caseDraft.full_title,
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
                    if (knownIssue?.data && origSpec.file) { // Ensure origSpec.file is available
                        const { state, ticket } = getCaseStateWithKnownIssue(
                            knownIssue.data,
                            origSpec.file, // Use file from original spec record
                            caseDraft.full_title
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
                 processedCaseExecutions.push(caseDraft);
            }

            // save each case execution
            const cases = await Promise.all(
                processedCaseExecutions.map((ce) => { // Use processed executions
                    return saveCaseExecution(ce);
                })
            );

            // --- Prepare Spec Patch ---
            const specPatch: Partial<SpecExecution> = {
                ...specPatchData, // Use runner-specific parsed data
                state: 'done', // explicitly set as done
            };

            // Recompute fail/bug/known/flaky counts based on final case states
            if (specPatch.fail !== undefined && specPatch.fail > 0) {
                const failedCount = recomputeSpecFailedCount(processedCaseExecutions); // Use processed executions
                specPatch.fail = failedCount.failed;
                specPatch.bug = failedCount.bug;
                specPatch.known = failedCount.known;
                specPatch.flaky = failedCount.flaky;
            }

            // get last specs executions
            if (specPatch.file) { // Ensure file is present
                const { error: lastSpecError, last_spec_executions } = await getLastSpecExecutions(
                    specPatch.file,
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
            } else {
                 console.warn('Skipping last spec execution lookup due to missing file in specPatch:', specPatch);
            }

            // update spec as done
            const { error: specError, spec: updatedSpecExecution } = await updateSpecsAsDone(
                specPatch // Use the prepared specPatch object
            );
            if (specError || !updatedSpecExecution) {
                return res.status(400).json({
                    error: true,
                    message: specError || 'Error updating specs',
                });
            }

            // get specs that were done testing
            // Fetch all done specs *including* the one just updated to recompute cycle accurately
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
                runner: origCycle.runner || runner, // Persist runner type on cycle if not already set
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
                cases, // Return the saved case executions
            });
        } catch (e) {
            console.error("Error in endSpecExecution:", e); // Log the actual error
            return res
                .status(501)
                .json({ error: true, message: 'Error while saving spec execution.' });
        }
    }

    return res.status(400).json({
        error: true,
        message: 'Invalid request: Missing spec ID, runner, or payload.', // Updated error message
    });
}

// --- Helper function to recompute spec failed counts based on final case states ---
// Note: This function was duplicated in the provided file. Keeping one instance.
// Consider moving this to lib/server_utils.ts if used elsewhere.
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

/* --- Remove duplicated/old logic block --- */
/*
                    key: t.key,
                    key_step: t.key_step,
                    state: t.state,
*/
/* --- End of removed block --- */

const handler = nextConnect();
handler.use(auth).post(endSpecExecution);
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
