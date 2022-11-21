import { getKnex } from '@knex';
import CaseExecutionSchema from '@lib/schema/case_execution';
import { CaseExecution } from '@types';

export async function getCaseExecutionsBy(
    cycleId: string,
    specId?: string,
    state?: string,
    trx?: any
) {
    if (!cycleId) {
        return { error: 'getCaseExecutionsBy: Requires cycle ID', caseExecutions: null };
    }

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

        if (trx) {
            queryBuilder.transacting(trx);
        }

        if (specId) {
            queryBuilder.where('ce.spec_execution_id', specId);
        }

        if (state) {
            queryBuilder.where('ce.state', state);
        }

        const caseExecutions = await queryBuilder.where('ce.cycle_id', cycleId).select(...fields);

        return { error: null, caseExecutions: caseExecutions };
    } catch (error) {
        const message = 'Failed to get case executions.';
        console.log(message, error);
        return { error: message, caseExecutions: null };
    }
}

export async function saveCaseExecution(caseExecution: Partial<CaseExecution>, trx?: any) {
    const { value, error } = CaseExecutionSchema.validate(caseExecution);
    if (error) {
        return {
            error: `Invalid case execution patch: ${error}`,
            caseExecution: null,
        };
    }

    try {
        const knex = await getKnex();
        const queryBuilder = knex('case_executions');

        if (trx) {
            queryBuilder.transacting(trx);
        }

        const savedCaseExecution = (await queryBuilder
            .insert({ ...value, update_at: knex.fn.now() })
            .returning('*')) as CaseExecution[];

        return { error: null, caseExecution: savedCaseExecution[0] };
    } catch (error) {
        const message = 'Failed to save case execution.';
        console.log(message, error);
        return { error: message, caseExecution: null };
    }
}
