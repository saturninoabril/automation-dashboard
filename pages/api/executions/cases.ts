import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getCaseExecutionsBy, saveCaseExecution } from '@lib/store/case_execution';
import auth from '@middleware/auth';
import { CaseExecution } from '@types';

async function getCaseExecutions(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;
    if (!query.cycle_id) {
        return res.status(400).json({
            errorMessage: 'Invalid request: Requires cycle ID.',
        });
    }

    try {
        const { error, caseExecutions } = await getCaseExecutionsBy(
            query.cycle_id.toString(),
            query.spec_id?.toString()
        );
        if (error) {
            return res.status(501).json({
                error: true,
                message: error,
            });
        }

        return res.status(200).json(caseExecutions);
    } catch (e) {
        let errorMessage = 'No case found';
        if (query.cycle_id && query.spec_id) {
            errorMessage += `  for cycle: ${query.cycle_id} and spec execution: ${query.spec_id}`;
        } else if (query.cycle_id) {
            errorMessage += ` for cycle: ${query.cycle_id}`;
        }

        return res.status(404).json({ errorMessage });
    }
}

async function postCaseExecution(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;
    const body = req.body as CaseExecution;

    if (query.cycle_id && query.spec_id && body) {
        try {
            const {
                title,
                full_title,
                key,
                key_step,
                state,
                duration,
                code,
                error_display,
                error_frame,
                screenshot,
                test_start_at,
            } = body;
            const caseDraft: Partial<CaseExecution> = {
                title,
                full_title,
                key,
                key_step,
                state,
                duration,
                code,
                error_display,
                error_frame,
                screenshot,
                test_start_at,
                cycle_id: query.cycle_id.toString(),
                spec_execution_id: query.spec_id.toString(),
            };
            const execution = await saveCaseExecution(caseDraft);

            return res.status(201).json(execution);
        } catch (e) {
            return res
                .status(404)
                .json(
                    `No case found for cycle: ${query.cycle_id} and spec execution: ${query.spec_id}.`
                );
        }
    }

    return res.status(400).json({
        errorMessage: 'No cycle and spec execution IDs found in request query.',
    });
}

const handler = nextConnect();
handler.get(getCaseExecutions);
handler.use(auth).post(postCaseExecution);

export default handler;
