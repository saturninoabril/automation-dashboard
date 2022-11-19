import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getPatchableCycleFields } from '@lib/schema/cycle';
import { getCycleByID, getCycleByLike, updateCycleBy } from '@lib/store/cycles';
import { getSpecsWithCases } from '@lib/store/specs';
import { saveKnownIssue } from '@lib/store/known_issue';
import {
    defaultBuildSuffix,
    getCaseTitle,
    knownIssuesToObject,
    parseBuild,
} from '@lib/server_utils';
import auth from '@middleware/auth';
import type { KnownIssue } from '@types';

async function postKnownIssue(req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { build, cycle_id: cycleID },
    } = req;

    let cycle;
    if (cycleID) {
        // get cycle by ID
        const out = await getCycleByID(cycleID.toString());
        if (out.error) {
            return res.status(501).json({
                errorMessage: out.error,
            });
        }

        cycle = out.cycle;
    }

    let buildSuffix = defaultBuildSuffix;
    if (build) {
        // get cycle by repo, branch and build
        const out = await getCycleByLike({ build: build.toString() });
        if (out.error) {
            return res.status(501).json({
                errorMessage: out.error,
            });
        }

        cycle = out.cycle;

        ({ buildSuffix } = parseBuild(build.toString()));
    }

    if (!cycle?.id) {
        return res.status(400).json({
            errorMessage: 'No cycle found.',
        });
    }

    // get known issue by build_suffix
    let knownIssues: KnownIssue[] = [];
    try {
        knownIssues = require(`../../../data/known_issue/${buildSuffix}.json`);
    } catch (error) {
        // ignore error and use default empty array
    }

    // save known issue to DB
    if (knownIssues?.length) {
        const { error } = await saveKnownIssue(cycle.id, knownIssues);
        if (error) {
            return res.status(400).json({
                errorMessage: 'Failed to save known issue',
            });
        }
    }

    // transform as an object to easily workaround with the data
    const knownIssuesObj = knownIssuesToObject(knownIssues);

    // get specs with cases
    const out = await getSpecsWithCases(cycle.id);
    if (out?.error || !out?.specs) {
        return res.status(400).json({
            errorMessage: `No specs found for cycle id: "${cycle.id}"`,
        });
    }

    // recompute test details
    let specsRegistered = 0;
    let specsDone = 0;
    let duration = 0;
    let pass = 0;
    let fail = 0;
    let knownFail = 0;
    let pending = 0;
    let skipped = 0;

    for (let i = 0; i < out.specs.length; i++) {
        const spec = out.specs[i];
        specsRegistered += 1;
        duration += spec.duration;

        if (!spec.cases.length) {
            continue;
        }

        specsDone += 1;

        for (let j = 0; j < spec.cases.length; j++) {
            const caseExecution = spec.cases[j];

            switch (caseExecution.state) {
                case 'passed':
                    pass += 1;
                    break;
                case 'failed':
                    // prettier-ignore
                    if (knownIssuesObj[spec.file]?.casesObj[getCaseTitle(caseExecution.title)]?.is_known) {
                        knownFail += 1;
                    } else {
                        fail += 1;
                    }

                    break;
                case 'skipped':
                    skipped += 1;
                    break;
                case 'pending':
                    pending += 1;
                    break;
                default:
                    console.log('caseExecution state not counted', caseExecution.state);
            }
        }
    }

    const state = specsDone === 0 ? 'on_queue' : specsDone === specsRegistered ? 'done' : 'started';

    const patch = {
        state,
        specs_registered: specsRegistered,
        specs_done: specsDone,
        duration,
        pass,
        fail,
        known_fail: knownFail,
        pending,
        skipped,
    };

    // validate cycle patch
    const { value: cyclePatch, error: validationError } = getPatchableCycleFields(patch);
    if (validationError) {
        return res.status(400).json({
            error: true,
            message: `Invalid cycle patch: ${validationError}`,
        });
    }

    // patch the cycle with recomputed data
    const { cycle: updatedCycle, error: patchError } = await updateCycleBy(cycle.id, cyclePatch);
    if (patchError) {
        return res.status(400).json({
            error: true,
            message: `Invalid cycle patch: ${patchError}`,
        });
    }

    return res.status(200).json({
        cycle: updatedCycle,
    });
}

const handler = nextConnect();
handler.use(auth).post(postKnownIssue);

export default handler;
