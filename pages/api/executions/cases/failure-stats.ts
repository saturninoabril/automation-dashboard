import { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../../knex';
import { isTokenValid } from '../../../../lib/token';

interface Cycle {
    id: string;
    branch: string;
}

interface LastCycleStats {
    cycle_id: string;
    branch: string;
    state: string;
    count: number;
}

interface RawResultRow {
    cycle_id: string;
    branch: string;
    state: string;
    count: string | number;
}

type StatsResponse = {
    full_title: string;
    spec_file: string;
    last_10_cycles: {
        cycle_id: string;
        branch: string;
        state: string;
        count: number;
    }[];
    total_failures: number;
    total_passes: number;
};

async function getFailureStats(
    req: NextApiRequest,
    res: NextApiResponse<StatsResponse | { error: string }>
) {
    if (!isTokenValid(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { full_title, spec_file } = req.query;

    if (typeof full_title !== 'string' || typeof spec_file !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid full_title or spec_file parameter' });
    }

    try {
        const knex = await getKnex();

        // Get last 10 cycles (modified to match your seed data)
        const lastCycles = await knex('cycles')
            .orderBy('start_at', 'desc')
            .limit(10)
            .select('id', 'branch', 'start_at');

        const cycleIds: string[] = lastCycles.map((c: any) => c.id);

        // Get pass/fail counts for this test in those cycles
        // Modified to match your seed data structure
        const results = await knex('case_executions as ce')
            .join('cycles as c', 'ce.cycle_id', 'c.id')
            .where('ce.full_title', 'like', `%${full_title}%`)
            .where('ce.spec_file', 'like', `%${spec_file.replace(/\W/g, '_')}%`)
            .whereIn('ce.cycle_id', cycleIds)
            .select('ce.cycle_id', 'c.branch', 'ce.state')
            .count('* as count')
            .groupBy('ce.cycle_id', 'c.branch', 'ce.state');

        const last_10_cycles: LastCycleStats[] = results.map((row: any) => ({
            cycle_id: row.cycle_id,
            branch: row.branch,
            state: row.state,
            count: Number(row.count),
        }));

        const total_failures = last_10_cycles
            .filter(r => r.state === 'failed')
            .reduce((sum, r) => sum + r.count, 0);

        const total_passes = last_10_cycles
            .filter(r => r.state === 'passed')
            .reduce((sum, r) => sum + r.count, 0);

        return res.status(200).json({
            full_title,
            spec_file,
            last_10_cycles,
            total_failures,
            total_passes,
        });
    } catch (error) {
        console.error('Error fetching failure stats:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return getFailureStats(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
}
