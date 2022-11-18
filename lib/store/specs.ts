import { getKnex } from '@knex';
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
    const knex = await getKnex();

    if (!cycleId) {
        return { error: 'getSpecsWithCases: Requires cycle ID', specs: [], total: 0 };
    }

    try {
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
