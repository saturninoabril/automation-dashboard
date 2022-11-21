import { getKnex } from '@knex';
import { getPatchableSpecExecutionFields } from '@lib/schema/spec_execution';
import { stateDone } from '@lib/constant';
import { SpecExecution } from '@types';

type GetSpecsWithCasesResponse = {
    specs: SpecExecution[] | null;
    total: number;
    error: string | null;
};

export async function getSpecsWithCases(
    cycleId: string,
    limit = 1000,
    offset = 0
): Promise<GetSpecsWithCasesResponse> {
    if (!cycleId) {
        return { error: 'getSpecsWithCases: Requires cycle ID', specs: [], total: 0 };
    }

    try {
        const knex = await getKnex();
        const specRes = await knex.raw(`
        SELECT se.*, json_agg(
            json_build_object(
                'id', ce.id,
                'title', ce.title,
                'state', ce.state,
                'duration', ce.duration,
                'test_start_at', ce.test_start_at
            )
        ) AS "cases"
        FROM spec_executions se
        LEFT JOIN case_executions AS ce ON ce.spec_execution_id = se.id
        WHERE se.id IN (
            SELECT id from spec_executions
            WHERE cycle_id='${cycleId}'
            ORDER BY sort_weight ASC, file ASC
            LIMIT ${limit}
            OFFSET ${offset}
        )
        GROUP BY se.id
        ORDER BY sort_weight ASC, file ASC`);

        return { error: null, specs: specRes.rows, total: specRes.rows.length };
    } catch (error) {
        const message = 'Error getting specs with cases';
        console.log(message, error);
        return { error: message, specs: null, total: 0 };
    }
}

export async function getDoneSpecs(
    cycleId: string,
    limit = 1000,
    offset = 0
): Promise<{ error: string | null; specs: SpecExecution[] | null }> {
    if (!cycleId) {
        return { error: 'getDoneSpecs: Requires cycle ID', specs: null };
    }

    try {
        const knex = await getKnex();
        const specRes = await knex.raw(`
            SELECT se.*, json_agg(
                json_build_object(
                    'id', ce.id,
                    'title', ce.title,
                    'state', ce.state,
                    'duration', ce.duration,
                    'test_start_at', ce.test_start_at
                )
            ) AS "cases"
            FROM spec_executions se
            LEFT JOIN case_executions AS ce ON ce.spec_execution_id = se.id
            WHERE se.id IN (
                SELECT id from spec_executions
                WHERE cycle_id='${cycleId}' AND state='${stateDone}'
                ORDER BY sort_weight ASC, file ASC
                LIMIT ${limit}
                OFFSET ${offset}
            )
            GROUP BY se.id
            ORDER BY sort_weight ASC, file ASC`);

        return { error: null, specs: specRes.rows };
    } catch (error) {
        const message = 'Error getting done specs';
        console.log(message, error);
        return { error: message, specs: null };
    }
}

export async function updateSpecsAsDone(
    patch?: Partial<SpecExecution>,
    trx?: any
): Promise<{ error: string | null; spec: SpecExecution | null }> {
    if (!patch || !patch.id) {
        return { error: 'updateSpecsAsDone: Requires spec ID', spec: null };
    }

    const { value: specPatch, error } = getPatchableSpecExecutionFields(patch);
    if (error) {
        return {
            error: `Invalid spec execution patch: ${error}`,
            spec: null,
        };
    }

    try {
        const knex = await getKnex();
        const queryBuilder = knex('spec_executions').where('id', patch.id);

        if (trx) {
            queryBuilder.transacting(trx);
        }

        const specs = await queryBuilder
            .update({
                ...specPatch,
                state: stateDone, // explicitly set as done
                end_at: knex.fn.now(),
                update_at: knex.fn.now(),
            })
            .returning('*');
        return { error: null, spec: specs[0] };
    } catch (error) {
        const message = 'Error updating specs as done';
        console.log(message, error);
        return { error: message, spec: null };
    }
}
