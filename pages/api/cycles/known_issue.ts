import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { getToken } from 'next-auth/jwt';

import { getPatchableCycleFields } from '@lib/schema/cycle';
import { recomputeCycleTestValues } from '@lib/server_utils';
import { getCycleByID, getCycleByLike, updateCycle } from '@lib/store/cycle';
import { getSpecsWithCases } from '@lib/store/spec_execution';
import { saveKnownIssue } from '@lib/store/known_issue';
import { getCycleSummary, parseBuild } from '@lib/common_utils';
import { generateTestReport } from '@lib/report';
import { onpremEnt } from '@lib/server_utils';
import auth from '@middleware/auth';
import type { KnownIssueData } from '@types';

async function postKnownIssue(req: NextApiRequest, res: NextApiResponse) {
    const {
        body,
        query: { build, cycle_id: cycleID },
    } = req;

    const token = await getToken({ req });
    console.log('postKnownIssue token', token);

    let getCycleRes;
    if (cycleID) {
        // get cycle by ID
        getCycleRes = await getCycleByID(cycleID.toString());
        if (getCycleRes.error) {
            return res.status(501).json({
                all_passed: false,
                error: true,
                message: getCycleRes.error,
            });
        }
    }

    if (build) {
        // get cycle by repo, branch and build
        getCycleRes = await getCycleByLike({ build: build.toString() });
        if (getCycleRes.error) {
            return res.status(501).json({
                all_passed: false,
                error: true,
                message: getCycleRes.error,
            });
        }
    }

    let oldCycle = getCycleRes?.cycle;

    if (!oldCycle?.id) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: 'No cycle found.',
        });
    }

    const { pipelineID, imageTag, buildSuffix } = parseBuild(oldCycle.build);

    // get known issue by build_suffix
    let knownIssues: KnownIssueData[] = [];
    try {
        knownIssues = require(`../../../data/known_issue/${buildSuffix || onpremEnt}.json`);
    } catch (error) {
        // ignore error and use default empty array
    }

    // save known issue to DB
    if (knownIssues?.length) {
        const { error } = await saveKnownIssue(oldCycle.id, knownIssues);
        if (error) {
            return res.status(400).json({
                all_passed: false,
                error: true,
                message: 'Failed to save known issue',
            });
        }
    }

    // get specs with cases
    const { specs, error: specsError } = await getSpecsWithCases(oldCycle.id);
    if (specsError || !specs) {
        return res.status(400).json({
            all_passed: false,
            error: true,
            message: `No specs found for cycle id: "${oldCycle.id}"`,
        });
    }

    // recompute cycle test values
    const recomputedCycle = recomputeCycleTestValues(oldCycle, specs);

    const out = {
        all_passed: false,
        total: 0,
        pass: 0,
        fail: 0,
        cycle: oldCycle,
        message: 'test cycle nothing changed',
        report_sent: false,
    };

    let newCycle;

    if (
        recomputedCycle.specs_done !== oldCycle.specs_done ||
        recomputedCycle.duration !== oldCycle.duration ||
        recomputedCycle.pass !== oldCycle.pass ||
        recomputedCycle.fail !== oldCycle.fail ||
        recomputedCycle.bug !== oldCycle.bug ||
        recomputedCycle.known !== oldCycle.known ||
        recomputedCycle.flaky !== oldCycle.flaky ||
        recomputedCycle.pending !== oldCycle.pending ||
        recomputedCycle.skipped !== oldCycle.skipped ||
        (recomputedCycle.state && recomputedCycle.state !== oldCycle.state)
    ) {
        // validate cycle patch
        const { value: cyclePatch, error: validationError } =
            getPatchableCycleFields(recomputedCycle);
        if (validationError) {
            return res.status(400).json({
                all_passed: false,
                error: true,
                message: `Invalid cycle patch: ${validationError}`,
            });
        }

        // patch the cycle with recomputed data
        const updateCycleRes = await updateCycle({
            ...cyclePatch,
            id: oldCycle.id,
        });
        if (updateCycleRes.error || !updateCycleRes.cycle) {
            return res.status(400).json({
                all_passed: false,
                error: true,
                message: `Invalid cycle patch: ${updateCycleRes.error}`,
            });
        }

        newCycle = updateCycleRes.cycle;
        out.cycle = newCycle;
        out.message = 'test cycle updated';
    }

    const { passingRateNumber, totalCases, pass, fail } = getCycleSummary(out.cycle);
    out.all_passed = passingRateNumber === 100;
    out.total = totalCases;
    out.pass = pass;
    out.fail = fail;

    const {
        webhook_url: webhookUrl,
        title,
        test_cycle_key: testCycleKey,
        server_type: serverType,
        mm_env: mmEnv,
    } = body;

    if (webhookUrl) {
        const defaultTitle = `E2E for ${oldCycle.repo}/${oldCycle.branch}@${imageTag}`;
        const data = generateTestReport(
            newCycle || oldCycle,
            title || defaultTitle,
            pipelineID,
            req.headers.host || 'localhost',
            testCycleKey,
            serverType,
            mmEnv
        );
        const ok = await sendReport(webhookUrl, data);
        out.report_sent = ok;
    }

    return res.status(200).json(out);
}

async function sendReport(url: string, data: Record<any, any>) {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.ok;
}

const handler = nextConnect();
handler.use(auth).post(postKnownIssue);

export default handler;
