import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import { getPatchableCycleFields } from '@lib/schema/cycle';
import { getCycleByID, updateCycle } from '@lib/store/cycle';
import auth from '@middleware/auth';

async function getCycle(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;
        const { cycle } = await getCycleByID(id?.toString());

        if (!cycle) {
            return res.status(501).json({ error: true, message: 'Cycle not found.' });
        }

        return res.status(200).json(cycle);
    } catch (e) {
        return res.status(501).json({ error: true, message: 'Cycle not found.' });
    }
}

async function putCycle(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { body, query } = req;
        if (!query?.id) {
            return res.status(400).json({
                error: true,
                message: 'Invalid request: No cycle ID found in query parameter.',
            });
        }

        const { value: cyclePatch, error: validationError } = getPatchableCycleFields(body);
        if (validationError) {
            return res.status(400).json({
                error: true,
                message: `Invalid cycle patch: ${validationError}`,
            });
        }

        const id = query.id.toString();
        cyclePatch.id = id;

        const knex = await getKnex();
        const { error: updateError, cycle } = await knex.transaction(async (trx: any) => {
            return await updateCycle(cyclePatch, trx);
        });

        if (updateError) {
            return res.status(501).json({
                error: true,
                message: 'Failed to update the cycle.',
            });
        }

        return res.status(201).json(cycle);
    } catch (e) {
        return res.status(501).json({
            error: true,
            message: 'Failed to update the cycle.',
        });
    }
}

const handler = nextConnect();
handler.get(getCycle);
handler.use(auth).put(putCycle);

export default handler;
