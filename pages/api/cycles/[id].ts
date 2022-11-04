import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import { getPatchableCycleFields } from '@lib/schema/cycle';
import auth from '@middleware/auth';
import type { Cycle } from '@types';

type CycleResponse =
    | Cycle
    | {
          error: boolean;
          message: string;
      };

async function getCycle(req: NextApiRequest, res: NextApiResponse<Partial<CycleResponse>>) {
    try {
        const { id } = req.query;
        const knex = await getKnex();
        const cycle = (await knex('cycles').where('id', id).select('*')) as unknown as Cycle[];
        return res.status(200).json(cycle[0]);
    } catch (e) {
        return res.status(501).json({ error: true, message: 'Cycle not found.' });
    }
}

async function updateCycle(req: NextApiRequest, res: NextApiResponse<Partial<CycleResponse>>) {
    try {
        const { body, query } = req;
        const { value: cyclePatch, error } = getPatchableCycleFields(body);
        if (error) {
            return res.status(400).json({ error: true, message: `Invalid cycle patch: ${error}` });
        }
        const knex = await getKnex();
        const cycle = await knex.transaction(async (trx: any) => {
            const updatedCycle = await knex('cycles')
                .transacting(trx)
                .where('id', query.id)
                .update({ ...cyclePatch, update_at: knex.fn.now() })
                .returning('*');

            return updatedCycle as Cycle;
        });

        return res.status(201).json(cycle[0]);
    } catch (e) {
        return res.status(501).json({ error: true, message: 'Failed to update the cycle.' });
    }
}

const handler = nextConnect();
handler.get(getCycle);
handler.use(auth).put(updateCycle);

export default handler;
