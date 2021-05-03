import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import { params } from '../../../../lib/params';

async function getSpecExecutions(req, res) {
    const { query } = req;
    const { limit, offset, page, perPage } = params(req.query);
    const knex = getKnex();

    const fields = [
        'se.id',
        'se.file',
        'se.sort_weight',
        'se.server',
        'se.state',
        'se.duration',
        'se.pass',
        'se.fail',
        'se.pending',
        'se.skipped',
        'se.test_start_at',
        'se.test_end_at',
        'se.start_at',
        'se.end_at',
        'se.create_at',
        'se.update_at',
        'se.cycle_id',
        'c.branch',
        'c.build',
        'c.repo',
    ];

    const queryBuilder = knex('spec_executions as se')
        .join('cycles as c', 'c.id', '=', 'se.cycle_id')
        .limit(limit)
        .offset(offset);

    if (query.cycle_id) {
        queryBuilder.where('se.cycle_id', query.cycle_id);
    }

    if (query.state) {
        queryBuilder.where('se.state', query.state);
    }

    const specs = await queryBuilder
        .select(...fields)
        .orderBy('se.sort_weight', 'asc')
        .orderBy('se.file', 'asc');

    const count = await knex('spec_executions').where('cycle_id', query.cycle_id).count('id');

    return res.status(200).json({
        specs,
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
