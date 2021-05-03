import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';
import { params } from '../../../lib/params';

async function getCycles(req, res) {
    try {
        const { limit, offset, page, perPage } = params(req.query);
        const knex = getKnex();
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
