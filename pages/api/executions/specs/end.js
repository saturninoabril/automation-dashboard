import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import auth from '../../../../middleware/auth';

async function endSpecExecution(req, res) {
    const { query } = req;

    if (query.id) {
        const { spec, tests } = req.body;

        try {
            const knex = getKnex();

            const started = await knex.transaction(async (trx) => {
                const updatedExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('id', query.id)
                    .where('file', spec.file)
                    .update({
                        state: 'done',
                        pass: spec.pass,
                        fail: spec.fail,
                        pending: spec.pending,
                        skipped: spec.skipped,
                        duration: spec.duration,
                        test_start_at: spec.test_start_at,
                        test_end_at: spec.test_end_at,
                        end_at: knex.fn.now(),
                        update_at: knex.fn.now(),
                    })
                    .returning('*');

                const origCycle = await knex('cycles').where('id', updatedExecution[0].cycle_id).select('*');

                const specsDone = origCycle[0].specs_done + 1;
                const isDone = origCycle[0].specs_registered === specsDone;

                const updatedCycle = await knex('cycles')
                    .transacting(trx)
                    .where('id', updatedExecution[0].cycle_id)
                    .update({
                        state: isDone ? 'done' : 'started',
                        specs_done: specsDone,
                        pass: origCycle[0].pass + spec.pass,
                        fail: origCycle[0].fail + spec.fail,
                        pending: origCycle[0].pending + spec.pending,
                        skipped: origCycle[0].skipped + spec.skipped,
                        duration: origCycle[0].duration + spec.duration,
                        end_at: isDone ? knex.fn.now() : null,
                        update_at: knex.fn.now(),
                    })
                    .returning('*');

                await Promise.all(
                    tests.map(async (t) => {
                        await knex('case_executions').transacting(trx).insert({
                            title: t.title,
                            full_title: t.full_title,
                            key: t.key,
                            key_step: t.key_step,
                            state: t.state,
                            duration: t.duration,
                            test_start_at: t.test_start_at,
                            update_at: knex.fn.now(),
                            cycle_id: updatedCycle[0].id,
                            spec_execution_id: updatedExecution[0].id,
                        });
                    })
                );

                return { cycle: updatedCycle[0], spec: updatedExecution[0] };
            });

            return res.status(201).json(started);
        } catch (e) {
            return res.status(501).json({ error: true });
        }
    }

    return res.status(400).json({ errorMessage: 'No ID found in request query.' });
}

const handler = nextConnect();
handler.use(auth).post(endSpecExecution);

export default handler;
