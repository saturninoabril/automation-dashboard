import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';

async function getCycles(req, res) {
    try {
        const knex = getKnex();
        const cycles = await knex('cycles').orderBy('create_at', 'desc');
        return res.status(200).json(cycles);
    } catch (e) {
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.get(getCycles);

export default handler;
