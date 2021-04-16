import nextConnect from 'next-connect';

import { getKnex } from '../../../../knex';
import Cycle from '../../../../lib/schema/cycle';
import SpecExecution from '../../../../lib/schema/spec_execution';
import CaseExecution from '../../../../lib/schema/case_execution';
import auth from '../../../../middleware/auth';

async function endSpecExecution(req, res) {
    const { query } = req;

    if (query.id) {
        const { spec, tests } = req.body;

        try {
            const knex = getKnex();

            const started = await knex.transaction(async (trx) => {
                const specDraft = {
                    state: 'done', // explicitly set as done
                    pass: spec.pass,
                    fail: spec.fail,
                    pending: spec.pending,
                    skipped: spec.skipped,
                    duration: spec.duration,
                    test_start_at: spec.test_start_at,
                    test_end_at: spec.test_end_at,
                };
                const { value: specPatch, error } = SpecExecution.toPatch(specDraft);
                if (error) {
                    return { status: 400, error: true, message: `Invalid spec execution patch: ${error}` };
                }

                const updatedExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('id', query.id)
                    .where('file', spec.file)
                    .update({ ...specPatch, end_at: knex.fn.now(), update_at: knex.fn.now() })
                    .returning('*');

                const origCycle = await knex('cycles').where('id', updatedExecution[0].cycle_id).select('*');

                const specsDone = origCycle[0].specs_done + 1;
                const isDone = origCycle[0].specs_registered === specsDone;

                const cycleDraft = {
                    state: isDone ? 'done' : 'started',
                    specs_done: specsDone,
                    pass: origCycle[0].pass + spec.pass,
                    fail: origCycle[0].fail + spec.fail,
                    pending: origCycle[0].pending + spec.pending,
                    skipped: origCycle[0].skipped + spec.skipped,
                    duration: origCycle[0].duration + spec.duration,
                };
                const { value: cyclePatch, error: cycleError } = Cycle.toPatch(cycleDraft);
                if (cycleError) {
                    return { status: 400, error: true, message: `Invalid cycle patch: ${cycleError}` };
                }

                const updatedCycle = await knex('cycles')
                    .transacting(trx)
                    .where('id', updatedExecution[0].cycle_id)
                    .update({ ...cyclePatch, end_at: isDone ? knex.fn.now() : null, update_at: knex.fn.now() })
                    .returning('*');

                const caseExecutions = [];
                tests.forEach((t) => {
                    const caseDraft = {
                        title: t.title,
                        full_title: t.full_title,
                        key: t.key,
                        key_step: t.key_step,
                        state: t.state,
                        duration: t.duration,
                        code: t.code,
                        error_display: t.error_display,
                        error_frame: t.error_frame,
                        screenshot: t.screenshot,
                        test_start_at: t.test_start_at,
                        cycle_id: updatedCycle[0].id,
                        spec_execution_id: updatedExecution[0].id,
                    };
                    const { value, error } = CaseExecution.schema.validate(caseDraft);
                    if (error) {
                        return { status: 400, error: true, message: `Invalid case execution: ${error}` };
                    }

                    caseExecutions.push({ ...value, update_at: knex.fn.now() });
                });

                await Promise.all(
                    caseExecutions.map(async (ce) => {
                        await knex('case_executions').transacting(trx).insert(ce).returning('*');
                    })
                );

                return { status: 201, cycle: updatedCycle[0], spec: updatedExecution[0] };
            });
            return res.status(started.status).json(started);
        } catch (e) {
            return res.status(501).json({ error: true });
        }
    }

    return res.status(400).json({ errorMessage: 'No ID found in request query.' });
}

const handler = nextConnect();
handler.use(auth).post(endSpecExecution);

export default handler;
