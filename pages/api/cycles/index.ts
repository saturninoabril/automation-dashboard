import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { Knex } from 'knex/types';

import { getKnex } from '@knex';
import { params } from '@lib/params';
import type { Cycle } from '@types';

type CyclesResponse = {
    cycles: Cycle[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    per_page: number;
    error: boolean;
};

async function getCycles(req: NextApiRequest, res: NextApiResponse<Partial<CyclesResponse>>) {
    try {
        const { limit, offset, page, perPage } = params(req.query);
        const { repo, branch, build } = req.query;
        const knex = await getKnex();
        let selectQuery = knex('cycles');
        selectQuery = buildQuery(
            selectQuery,
            repo?.toString(),
            branch?.toString(),
            build?.toString()
        );

        let countQuery = knex('cycles');
        countQuery = buildQuery(
            countQuery,
            repo?.toString(),
            branch?.toString(),
            build?.toString()
        );
        const count = await countQuery.count('id');

        const cycles = await selectQuery
            .orderBy('create_at', 'desc')
            .limit(limit)
            .offset(offset)
            .select('*');

        return res.status(200).json({
            cycles,
            total: parseInt(count[0].count, 10),
            limit,
            offset,
            page,
            per_page: perPage,
        });
    } catch (e) {
        return res.status(501).json({ error: true });
    }
}

function buildQuery(query: Knex, repo?: string, branch?: string, build?: string) {
    if (repo) {
        query.where('repo', repo);
    }

    if (branch) {
        query.where('branch', branch);
    }

    if (build) {
        query.whereLike('build', `%${build}%`);
    }

    return query;
}

const handler = nextConnect();
handler.get(getCycles);

export default handler;
