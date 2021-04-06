import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';

async function getSpecExecutions(req, res) {
    const { query } = req;
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

    const queryBuilder = knex('spec_executions as se').join('cycles as c', 'c.id', '=', 'se.cycle_id');

    if (query.cycle_id) {
        queryBuilder.where('se.cycle_id', query.cycle_id);
    }

    if (query.state) {
        queryBuilder.where('se.state', query.state);
    }

    const executions = await queryBuilder
        .select(...fields)
        .orderBy('se.sort_weight', 'asc')
        .orderBy('se.file', 'asc');

    return res.status(200).json(executions);
}

const handler = nextConnect();
handler.get(getSpecExecutions);

export default handler;
