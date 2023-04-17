import { getKnex } from '@knex';
import { getPatchableSpecExecutionFields } from '@lib/schema/spec_execution';
import { baseRepoBranch, stateDone } from '@lib/constant';
import { getLastExecutionLimit } from '@lib/server_utils';
import { LastSpecExecution, SpecExecution } from '@types';

type GetSpecsWithCasesResponse = {
    specs: SpecExecution[] | null;
    total: number;
    error: string | null;
};

export async function getSpecByID(id?: string) {
    if (!id) {
        return { error: 'Require spec ID', spec: null };
    }

    try {
        const knex = await getKnex();
        const spec = (await knex('spec_executions').where('id', id).first()) as SpecExecution;

        return { error: null, spec };
    } catch (error) {
        const message = `Spec not found with id: "${id}"`;
        console.log(message, error);
        return { error: message, spec: null };
    }
}

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

    if (specPatch.last_execution) {
        specPatch.last_execution = JSON.stringify(specPatch.last_execution);
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

export async function getLastSpecExecutions(
    specFile: string,
    repo = 'mattermost-server',
    buildLike = 'onprem-ent',
    limit = getLastExecutionLimit()
): Promise<{ error: string | null; last_spec_executions: LastSpecExecution[] | null }> {
    const branch = baseRepoBranch[repo] || 'master';

    try {
        const knex = await getKnex();
        const specRes = await knex.raw(`
            SELECT
                se.id,
                se.pass,
                se.fail,
                se.bug,
                se.known,
                se.flaky,
                se.pending,
                se.skipped,
                se.update_at,
                se.cycle_id,
                cs.repo,
                cs.branch,
                cs.build,
                cs.create_at AS cycle_create_at
            FROM public.spec_executions se
            LEFT JOIN cycles AS cs ON cs.id = se.cycle_id
            WHERE
                se.file = '${specFile}'
                AND se.cycle_id IN (
                    SELECT id from cycles
                    WHERE
                        state = 'done'
                        AND repo = '${repo}'
                        AND branch = '${branch}'
                        AND build LIKE '%${buildLike}%'
                    ORDER BY create_at DESC LIMIT ${limit * 2}
                )
            GROUP BY se.id, cs.repo, cs.branch, cs.build, cycle_create_at
            ORDER BY se.create_at DESC LIMIT ${limit}`);

        return { error: null, last_spec_executions: specRes.rows };
    } catch (error) {
        const message = 'Error getting last spec executions';
        console.log(message, error);
        return { error: message, last_spec_executions: null };
    }
}
