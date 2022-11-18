import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';

async function getCaseExecution(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;
        const knex = await getKnex();
        const caseExecution = await knex('case_executions').where('id', id).select('*');
        return res.status(200).json(caseExecution[0]);
    } catch (e) {
        return res.status(501).json({
            error: true,
            message: 'Case execution not found.',
        });
    }
}

const handler = nextConnect();
handler.get(getCaseExecution);

export default handler;
