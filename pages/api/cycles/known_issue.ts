import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getPatchableCycleFields } from '@lib/schema/cycle';
import { recomputeCycleTestValues } from '@lib/server_utils';
import { getCycleByID, getCycleByLike, updateCycle } from '@lib/store/cycle';
import { getSpecsWithCases } from '@lib/store/spec_execution';
import { saveKnownIssue } from '@lib/store/known_issue';
import { parseBuild } from '@lib/common_utils';
import { defaultBuildSuffix } from '@lib/server_utils';
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
                all_passed: false,
                error: true,
                message: out.error,
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
                all_passed: false,
                error: true,
                message: out.error,
            });
        }

        cycle = out.cycle;

        ({ buildSuffix } = parseBuild(build.toString()));
    }

    if (!cycle?.id) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: 'No cycle found.',
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
                all_passed: false,
                error: true,
                message: 'Failed to save known issue',
            });
        }
    }

    // get specs with cases
    const { specs, error: specsError } = await getSpecsWithCases(cycle.id);
    if (specsError || !specs) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: `No specs found for cycle id: "${cycle.id}"`,
        });
    }

    // recompute cycle test values
    const recomputedCycle = recomputeCycleTestValues(cycle, specs, knownIssues);

    // validate cycle patch
    const { value: cyclePatch, error: validationError } = getPatchableCycleFields(recomputedCycle);
    if (validationError) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: `Invalid cycle patch: ${validationError}`,
        });
    }

    // patch the cycle with recomputed data
    const { cycle: updatedCycle, error: patchError } = await updateCycle({
        ...cyclePatch,
        id: cycle.id,
    });
    if (patchError || !updatedCycle) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: `Invalid cycle patch: ${patchError}`,
        });
    }

    return res.status(200).json({
        all_passed:
            updatedCycle.pass > 0 &&
            updatedCycle.fail === 0 &&
            updatedCycle.pending === 0 &&
            updatedCycle.skipped === 0,
        cycle: updatedCycle,
    });
}

const handler = nextConnect();
handler.use(auth).post(postKnownIssue);

export default handler;
