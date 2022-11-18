import { getKnex } from '@knex';
import type { Cycle } from '@types';

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

export async function getCycleByLike(repo?: string, branch?: string, build?: string) {
    try {
        const knex = await getKnex();
        const buildQuery = knex('cycles');

        if (repo) {
            buildQuery.where('repo', repo);
        }
        if (branch) {
            buildQuery.where('branch', branch);
        }
        if (build) {
            buildQuery.whereLike('build', `%${build}%`);
        }
        const cycle = (await buildQuery.orderBy('create_at', 'desc').first()) as Cycle;

        return { error: null, cycle };
    } catch (error) {
        const message = 'Cycle not found';
        console.log(message, error);
        return { error: message, cycle: null };
    }
}

export async function getCycleBy(repo: string, branch: string, build: string) {
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

export async function updateCycleBy(cycleID: string, patch: Partial<Cycle>, trx?: any) {
    try {
        const knex = await getKnex();
        const queryBuilder = knex('cycles').where('id', cycleID);

        if (trx) {
            queryBuilder.transacting(trx);
        }

        const cycle = (await queryBuilder
            .update({ ...patch, update_at: knex.fn.now() })
            .returning('*')) as Cycle[];

        return { error: null, cycle: cycle[0] };
    } catch (error) {
        const message = `Failed to update cycle with id: "${cycleID}"`;
        console.log(message, error);
        return { error: message, cycle: null };
    }
}
