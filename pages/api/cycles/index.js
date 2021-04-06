import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';

async function getCycles(req, res) {
    const knex = getKnex();
    const cycles = await knex('cycles').orderBy('create_at', 'desc');
    return res.status(200).json(cycles);
}

const handler = nextConnect();
handler.get(getCycles);

export default handler;
