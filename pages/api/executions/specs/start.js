import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import Cycle from '../../../../lib/schema/cycle';
import SpecExecution from '../../../../lib/schema/spec_execution';
import auth from '../../../../middleware/auth';

async function startSpecExecutions(req, res) {
    const {
        query: { repo, branch, build },
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
                    return { status: 404, message: 'Cycle not found.' };
                }

                if (!cycle.state) {
                    const cycleDraft = {
                        state: 'started',
                    };
                    const { value: cyclePatch, error } = Cycle.toPatch(cycleDraft);
                    if (error) {
                        return { status: 400, error: true, message: `Invalid cycle patch: ${error}` };
                    }
                    const updatedCycle = await knex('cycles')
                        .transacting(trx)
                        .where('id', cycle.id)
                        .update({ ...cyclePatch, start_at: knex.fn.now(), update_at: knex.fn.now() })
                        .returning('*');
                    cycle = updatedCycle[0];
                }

                const origExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('cycle_id', cycle.id)
                    .whereNull('server')
                    .orderBy('sort_weight', 'asc')
                    .orderBy('file', 'asc')
                    .first();

                if (!origExecution) {
                    return { status: 200, message: 'No more spec file available to test.', execution: {}, cycle };
                }

                const specDraft = {
                    server: req.body.server,
                    state: 'started',
                };
                const { value: specPatch, error } = SpecExecution.toPatch(specDraft);
                if (error) {
                    return { status: 400, error: true, message: `Invalid spec execution patch: ${error}` };
                }
                const updatedExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('id', origExecution.id)
                    .update({
                        ...specPatch,
                        start_at: knex.fn.now(),
                        update_at: knex.fn.now(),
                    })
                    .returning('*');

                return { status: 200, message: 'Found spec file to test.', execution: updatedExecution[0], cycle };
            });

            const { message, execution, cycle } = data;

            let summary;
            if (cycle && cycle.id) {
                summary = await knex('spec_executions')
                    .where('cycle_id', cycle.id)
                    .select('server', 'state', knex.raw('COUNT(server), COUNT(state)'))
                    .groupBy('server', 'state');
            }

            return res.status(data.status).json({ message, execution, cycle, summary });
        } catch (e) {
            return res.status(501).json({ message: 'Internal error. Failed to get spec file to test.' });
        }
    }

    return res.status(400).json({ message: 'No repo, branch and build found in request query.' });
}

const handler = nextConnect();
handler.use(auth).post(startSpecExecutions);

export default handler;
