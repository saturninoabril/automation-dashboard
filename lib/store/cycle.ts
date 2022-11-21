import { getKnex } from '@knex';
import { stateDone } from '@lib/constant';
import { getPatchableCycleFields } from '@lib/schema/cycle';
import type { Cycle } from '@types';

type CycleByParams = {
    repo: string;
    branch: string;
    build: string;
};

export async function getCycleByID(id?: string) {
    if (!id) {
        return { error: 'Require cycle ID', cycle: null };
    }

    try {
        const knex = await getKnex();
        const cycle = (await knex('cycles').where('id', id).first()) as Cycle;

        return { error: null, cycle };
    } catch (error) {
        const message = `Cycle not found with id: "${id}"`;
        console.log(message, error);
        return { error: message, cycle: null };
    }
}

export async function getCycleByLike(params: Partial<CycleByParams> = {}) {
    try {
        const knex = await getKnex();
        const buildQuery = knex('cycles');

        if (params.repo) {
            buildQuery.where('repo', params.repo);
        }
        if (params.branch) {
            buildQuery.where('branch', params.branch);
        }
        if (params.build) {
            buildQuery.whereLike('build', `%${params.build}%`);
        }
        const cycle = (await buildQuery.orderBy('create_at', 'desc').first()) as Cycle;

        return { error: null, cycle };
    } catch (error) {
        const message = 'Cycle not found';
        console.log(message, error);
        return { error: message, cycle: null };
    }
}

export async function getCycleBy(params: CycleByParams) {
    const { repo, branch, build } = params;

    try {
        const knex = await getKnex();
        const cycle = (await knex('cycles')
            .where('repo', repo)
            .where('branch', branch)
            .where('build', build)
            .first()) as Cycle;

        return { error: null, cycle };
    } catch (error) {
        const message = `Cycle not found with repo: "${repo}", branch: "${branch}" and build: "${build}"`;
        console.log(message, error);
        return { error: message, cycle: null };
    }
}

export async function getCycleIDsByBranchAndBuildLike(
    branch: string,
    buildLike: string,
    limit = 5
) {
    const knex = await getKnex();

    if (!branch || !buildLike) {
        return { error: 'getCyclesLike: Requires branch and buildLike' };
    }

    try {
        const cycles = (await knex('cycles')
            .where('branch', branch)
            .whereLike('build', buildLike)
            .orderBy('update_at', 'desc')
            .limit(limit)
            .select('id')) as { id: string }[];

        return { error: null, cycleIDs: cycles.map((c) => c.id) };
    } catch (error) {
        const message = `Error getting cycle IDs with build like "${buildLike}"`;
        console.log(message, error);
        return { error: message, cycleIDs: null };
    }
}

export async function updateCycle(
    patch: Partial<Cycle>,
    trx?: any
): Promise<{ error: string | null; cycle: Cycle | null }> {
    if (!patch || !patch.id) {
        return { error: 'updateCycle: Requires cycle ID', cycle: null };
    }

    const { value: cyclePatch, error } = getPatchableCycleFields(patch);
    if (error) {
        return {
            error: `Invalid cycle patch: ${error}`,
            cycle: null,
        };
    }

    try {
        const knex = await getKnex();
        const queryBuilder = knex('cycles').where('id', patch.id);

        if (trx) {
            queryBuilder.transacting(trx);
        }

        if (patch.state === stateDone) {
            cyclePatch.end_at = knex.fn.now();
        }

        const cycles = await queryBuilder
            .update({ ...cyclePatch, update_at: knex.fn.now() })
            .returning('*');

        return { error: null, cycle: cycles[0] };
    } catch (error) {
        const message = `Failed to update cycle with id: "${patch.id}"`;
        console.log(message, error);
        return { error: message, cycle: null };
    }
}
