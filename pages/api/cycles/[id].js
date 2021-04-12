import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';
import Cycle from '../../../lib/schema/cycle';
import auth from '../../../middleware/auth';

async function getCycle(req, res) {
    try {
        const { id } = req.query;
        const knex = getKnex();
        const cycle = await knex('cycles').where('id', id).select('*');
        return res.status(200).json(cycle);
    } catch (e) {
        return res.status(501).json({ error: true, message: 'Cycle not found.' });
    }
}

async function updateCycle(req, res) {
    try {
        const { body, query } = req;
        const { value, error } = Cycle.toPatch(body);
        console.log('updateCycle query.id', query.id);
        console.log('updateCycle body', body);
        console.log('updateCycle value', value);
        console.log('updateCycle error', error);
        if (error) {
            return res.status(400).json({ error: true, message: `Invalid cycle patch: ${error}` });
        }
        const knex = getKnex();
        const cycle = await knex.transaction(async (trx) => {
            const updatedCycle = await knex('cycles')
                .transacting(trx)
                .where('id', query.id)
                .update({
                    ...value,
                    update_at: knex.fn.now(),
                })
                .returning('*');

            return updatedCycle;
        });

        return res.status(201).json(cycle);
    } catch (e) {
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.get(getCycle);
handler.use(auth).put(updateCycle);

export default handler;
