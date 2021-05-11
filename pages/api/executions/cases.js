import nextConnect from 'next-connect';

import { getKnex } from '../../../knex';
import CaseExecution from '../../../lib/schema/case_execution';
import auth from '../../../middleware/auth';

async function getCaseExecutions(req, res) {
    const { query } = req;

    try {
        const knex = await getKnex();

        const fields = [
            'ce.id',
            'ce.title',
            'ce.full_title',
            'ce.key',
            'ce.key_step',
            'ce.state',
            'ce.duration',
            'ce.code',
            'ce.error_display',
            'ce.error_frame',
            'ce.screenshot',
            'ce.create_at',
            'ce.update_at',
            'ce.spec_execution_id',
            'se.file',
            'se.server',
            'ce.cycle_id',
            'c.branch',
            'c.build',
            'c.repo',
        ];

        const queryBuilder = knex('case_executions as ce')
            .join('cycles as c', 'c.id', '=', 'ce.cycle_id')
            .join('spec_executions as se', 'se.id', '=', 'ce.spec_execution_id');

        if (query.cycle_id) {
            queryBuilder.where('ce.cycle_id', query.cycle_id);
        }

        if (query.spec_id) {
            queryBuilder.where('ce.spec_execution_id', query.spec_id);
        }

        if (query.state) {
            queryBuilder.where('ce.state', query.state);
        }

        const executions = await queryBuilder.select(...fields);

        return res.status(200).json(executions);
    } catch (e) {
        let errorMessage = 'No case found';
        if (query.cycle_id && query.spec_id) {
            errorMessage += `  for cycle: ${query.cycle_id} and spec execution: ${query.spec_id}`;
        } else if (query.cycle_id) {
            errorMessage += ` for cycle: ${query.cycle_id}`;
        }

        return res.status(404).json({ errorMessage });
    }
}

async function saveCaseExecution(req, res) {
    const { query } = req;

    if (query.cycle_id && query.spec_id) {
        const { body } = req;

        try {
            const caseDraft = {
                cycle_id: query.cycle_id,
                spec_execution_id: query.spec_id,
                title: body.title,
                full_title: body.full_title,
                key: body.key,
                key_step: body.key_step,
                state: body.state,
                duration: body.duration,
                pass: body.pass,
                fail: body.fail,
                pending: body.pending,
                skipped: body.skipped,
            };
            const { value, error } = CaseExecution.schema.validate(caseDraft);
            if (error) {
                return { status: 400, error: true, message: `Invalid case execution: ${error}` };
            }

            const knex = await getKnex();
            const execution = await knex('case_executions').insert(value).returning('*');

            return res.status(201).json(execution);
        } catch (e) {
            return res
                .status(404)
                .json(
                    `No case found for cycle: ${query.cycle_id} and spec execution: ${query.spec_id}.`
                );
        }
    }

    return res
        .status(400)
        .json({ errorMessage: 'No cycle and spec execution IDs found in request query.' });
}

const handler = nextConnect();
handler.get(getCaseExecutions);
handler.use(auth).post(saveCaseExecution);

export default handler;
