import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';
import auth from '../../../middleware/auth';

async function startCycle(req, res) {
    try {
        const {
            body: { branch, build, repo, files = [] },
        } = req;

        const knex = getKnex();
        const started = await knex.transaction(async (trx) => {
            const cycle = await knex('cycles')
                .transacting(trx)
                .insert({
                    branch,
                    build,
                    repo,
                    specs_registered: files.length,
                })
                .returning('*');

            let executions;
            if (files.length > 0) {
                const chunkSize = 30;
                const newExecutions = files.map((f) => {
                    return {
                        file: f.file,
                        sort_weight: f.sortWeight,
                        cycle_id: cycle[0].id,
                    };
                });

                executions = await knex
                    .batchInsert('spec_executions', newExecutions, chunkSize)
                    .transacting(trx)
                    .returning('*');
            }

            return { cycle, executions };
        });

        return res.status(201).json(started);
    } catch (e) {
        console.log('cycles/start e', e);
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.use(auth).post(startCycle);

export default handler;
