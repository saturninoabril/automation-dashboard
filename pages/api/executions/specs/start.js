import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import auth from '../../../../middleware/auth';

async function startSpecExecutions(req, res) {
    const {
        query: { repo, branch, build, last = false },
    } = req;

    if (repo && branch && build) {
        try {
            const knex = getKnex();

            const data = await knex.transaction(async (trx) => {
                let cycle = await knex('cycles')
                    .transacting(trx)
                    .where('repo', repo)
                    .where('branch', branch)
                    .where('build', build)
                    .first();

                if (!cycle) {
                    return null;
                }

                if (!cycle.state) {
                    const updatedCycle = await knex('cycles')
                        .transacting(trx)
                        .where('id', cycle.id)
                        .update({
                            state: 'started',
                            start_at: knex.fn.now(),
                            update_at: knex.fn.now(),
                        })
                        .returning('*');
                    cycle = updatedCycle[0];
                }

                const origExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('cycle_id', cycle.id)
                    .whereNull('server')
                    .orderBy('sort_weight', last ? 'desc' : 'asc')
                    .orderBy('file', last ? 'desc' : 'asc')
                    .first();

                if (!origExecution) {
                    return null;
                }

                const updatedExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('id', origExecution.id)
                    .update({
                        server: req.body.server,
                        state: 'started',
                        start_at: knex.fn.now(),
                        update_at: knex.fn.now(),
                    })
                    .returning('*');

                return { execution: updatedExecution[0], cycle };
            });

            if (!data) {
                return res.status(404).json({ error: true });
            }

            const { execution, cycle } = data;

            const summary = await knex('spec_executions')
                .where('cycle_id', execution.cycle_id)
                .select('server', 'state', knex.raw('COUNT(server), COUNT(state)'))
                .groupBy('server', 'state');

            return res.status(200).json({ execution, cycle, summary });
        } catch (e) {
            return res.status(501).json({ error: true });
        }
    }

    return res.status(400).json({ errorMessage: 'No repo, branch and build found in request query.' });
}

const handler = nextConnect();
handler.use(auth).post(startSpecExecutions);

export default handler;
