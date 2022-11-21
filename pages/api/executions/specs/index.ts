import type { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import nextConnect from 'next-connect';

import { params } from '@lib/params';
import { getSpecsWithCases } from '@lib/store/spec_execution';
import { getKnownIssueByCycleID } from '@lib/store/known_issue';
import { getCaseTitle, knownIssuesToObject } from '@lib/server_utils';

async function getSpecExecutions(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;
    if (!query.cycle_id) {
        return res.status(400).json({
            errorMessage: 'Invalid request: No cycle ID found in query parameter.',
        });
    }

    const cycleId = query.cycle_id.toString();

    const schema = Joi.string().guid({ version: ['uuidv4'] });
    const { error } = schema.validate(cycleId);
    if (error) {
        return res.status(400).json({ errorMessage: 'Invalid cycle ID' });
    }

    const { limit, offset, page, perPage } = params(req.query);
    const specsRes = await getSpecsWithCases(cycleId, limit, offset);
    if (specsRes?.error || !specsRes.specs) {
        return res.status(501).json({
            error: true,
            message: specsRes.error,
        });
    }

    const { knownIssue } = await getKnownIssueByCycleID(cycleId);
    const knownIssuesObj = knownIssuesToObject(knownIssue?.data);

    for (let i = 0; i < specsRes.specs.length; i++) {
        const spec = specsRes.specs[i];

        // reset values
        spec.pass = 0;
        spec.fail = 0;
        spec.known_fail = 0;
        spec.pending = 0;
        spec.skipped = 0;

        if (!spec.cases.length) {
            continue;
        }

        for (let j = 0; j < spec.cases.length; j++) {
            const caseExecution = spec.cases[j];

            switch (caseExecution.state) {
                case 'passed':
                    spec.pass += 1;
                    break;
                case 'failed':
                    // prettier-ignore
                    if (knownIssuesObj[spec.file]?.casesObj[getCaseTitle(caseExecution.title)]?.is_known) {
                        const knownIssue = knownIssuesObj[spec.file].casesObj[getCaseTitle(caseExecution.title)];
                        spec.known_fail += 1;
                        spec.cases[j].state = 'known_fail';

                        if (knownIssue.type) {
                            spec.cases[j].known_fail_type = knownIssue.type;
                        }
                        if (knownIssue.ticket) {
                            spec.cases[j].known_fail_ticket = knownIssue.ticket;
                        }
                    } else {
                        spec.fail += 1;
                    }

                    break;
                case 'skipped':
                    spec.skipped += 1;
                    break;
                case 'pending':
                    spec.pending += 1;
                    break;
                default:
                    console.log('caseExecution state not counted', caseExecution.state);
            }
        }
    }

    return res.status(200).json({
        knownIssuesObj,
        specs: specsRes.specs,
        total: specsRes.total,
        limit,
        offset,
        page,
        per_page: perPage,
    });
}

const handler = nextConnect();
handler.get(getSpecExecutions);

export default handler;
