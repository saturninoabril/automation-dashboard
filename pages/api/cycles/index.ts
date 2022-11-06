import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import { params } from '@lib/params';
import type { Cycle } from '@types';

type CyclesResponse = {
    cycles: Cycle[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    per_page: number;
    error: boolean;
};

async function getCycles(req: NextApiRequest, res: NextApiResponse<Partial<CyclesResponse>>) {
    try {
        const { limit, offset, page, perPage } = params(req.query);
        const knex = await getKnex();
        const queryBuilder = knex('cycles')
            .orderBy('create_at', 'desc')
            .limit(limit)
            .offset(offset);

        const cycles = await queryBuilder.select('*');
        const count = await knex('cycles').count('id');

        return res.status(200).json({
            cycles,
            total: parseInt(count[0].count, 10),
            limit,
            offset,
            page,
            per_page: perPage,
        });
    } catch (e) {
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.get(getCycles);

export default handler;
