import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import { getPatchableCycleFields } from '@lib/schema/cycle';
import { getPatchableSpecExecutionFields } from '@lib/schema/spec_execution';
import CaseExecutionSchema from '@lib/schema/case_execution';
import auth from '@middleware/auth';
import { CaseExecution, SpecExecution } from '@types';

async function endSpecExecution(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;

    if (query.id) {
        const spec = req.body.spec as SpecExecution;
        const tests = req.body.tests as CaseExecution[];

        try {
            const knex = await getKnex();

            const started = await knex.transaction(async (trx: any) => {
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
                const { value: specPatch, error } = getPatchableSpecExecutionFields(specDraft);
                if (error) {
                    return {
                        status: 400,
                        error: true,
                        message: `Invalid spec execution patch: ${error}`,
                    };
                }

                const updatedExecution = await knex('spec_executions')
                    .transacting(trx)
                    .where('id', query.id)
                    .where('file', spec.file)
                    .update({ ...specPatch, end_at: knex.fn.now(), update_at: knex.fn.now() })
                    .returning('*');

                const origCycle = await knex('cycles')
                    .where('id', updatedExecution[0].cycle_id)
                    .select('*');

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
                const { value: cyclePatch, error: cycleError } =
                    getPatchableCycleFields(cycleDraft);
                if (cycleError) {
                    return {
                        status: 400,
                        error: true,
                        message: `Invalid cycle patch: ${cycleError}`,
                    };
                }

                const updatedCycle = await knex('cycles')
                    .transacting(trx)
                    .where('id', updatedExecution[0].cycle_id)
                    .update({
                        ...cyclePatch,
                        end_at: isDone ? knex.fn.now() : null,
                        update_at: knex.fn.now(),
                    })
                    .returning('*');

                const caseExecutions: CaseExecution[] = [];
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
                    const { value, error } = CaseExecutionSchema.validate(caseDraft);
                    if (error) {
                        return {
                            status: 400,
                            error: true,
                            message: `Invalid case execution: ${error}`,
                        };
                    }

                    caseExecutions.push({ ...value, update_at: knex.fn.now() });
                });

                const cases = await Promise.all(
                    caseExecutions.map((ce) => {
                        return knex('case_executions').transacting(trx).insert(ce).returning('*');
                    })
                );

                return { status: 201, cycle: updatedCycle[0], spec: updatedExecution[0], cases };
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
