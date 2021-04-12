import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';
import Cycle from '../../../lib/schema/cycle';
import auth from '../../../middleware/auth';

async function startCycle(req, res) {
    try {
        const {
            body: { branch, build, repo, files = [] },
        } = req;

        const { value, error } = Cycle.schema.validate({ branch, build, repo, specs_registered: files.length });
        if (error) {
            return res.status(400).json({ error: true, message: `Invalid cycle patch: ${error}` });
        }

        const knex = getKnex();
        const started = await knex.transaction(async (trx) => {
            const cycle = await knex('cycles')
                .transacting(trx)
                .insert({
                    branch: value.branch,
                    build: value.build,
                    repo: value.repo,
                    specs_registered: value.specs_registered,
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
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.use(auth).post(startCycle);

export default handler;
