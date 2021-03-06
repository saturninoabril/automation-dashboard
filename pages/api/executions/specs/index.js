import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import { params } from '../../../../lib/params';

async function getSpecExecutions(req, res) {
    const { query } = req;
    if (!query.cycle_id) {
        return res
            .status(400)
            .json({ errorMessage: 'Invalid request: No cycle ID found in query parameter.' });
    }

    const { limit, offset, page, perPage } = params(req.query);
    const knex = await getKnex();
    const specRes = await knex.raw(`
        SELECT se.*, json_agg(
            json_build_object(
                'id', ce.id,
                'title', ce.title,
                'state', ce.state,
                'duration', ce.duration,
                'test_start_at', ce.test_start_at
            )
        ) AS "cases"
        FROM spec_executions se
        LEFT JOIN case_executions AS ce ON ce.spec_execution_id = se.id
        WHERE se.id IN (
            SELECT id from spec_executions
            WHERE cycle_id='${query.cycle_id}'
            ORDER BY sort_weight ASC, file ASC
            LIMIT ${limit}
            OFFSET ${offset}
        )
        GROUP BY se.id
        ORDER BY sort_weight ASC, file ASC`);

    const count = await knex('spec_executions').where('cycle_id', query.cycle_id).count('id');

    return res.status(200).json({
        specs: specRes.rows,
        total: parseInt(count[0].count, 10),
        limit,
        offset,
        page,
        per_page: perPage,
    });
}

const handler = nextConnect();
handler.get(getSpecExecutions);

export default handler;
