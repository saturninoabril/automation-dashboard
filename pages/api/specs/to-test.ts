import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { getKnex } from '@knex';
import auth from '@middleware/auth';
import { SpecExecution } from '@types';

async function getSpecToTest(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { body } = req;
        const { repo, branch, build, server } = body;

        if (!repo || !branch || !build) {
            return res.status(400).json({
                error: true,
                message: 'Invalid request: Requires repo, branch, and build.',
            });
        }

        const knex = await getKnex();

        // Find a cycle that matches the repo, branch, and build
        const cycle = await knex('cycles')
            .where({
                repo,
                branch,
                build,
            })
            .orderBy('create_at', 'desc')
            .first();

        if (!cycle) {
            return res.status(404).json({
                error: true,
                message: `No test cycle found for repo: ${repo}, branch: ${branch}, build: ${build}`,
            });
        }

        // Find a spec that hasn't been started yet
        const spec = await knex('spec_executions')
            .where({
                cycle_id: cycle.id,
                state: 'registered', // Assuming 'registered' is the initial state
            })
            .orderBy('sort_weight', 'asc')
            .orderBy('file', 'asc')
            .first();

        if (!spec) {
            return res.status(404).json({
                error: true,
                message: 'No specs available to test',
            });
        }

        // Mark the spec as started
        await knex('spec_executions')
            .where('id', spec.id)
            .update({
                state: 'started',
                start_at: knex.fn.now(),
                update_at: knex.fn.now(),
                server: server || '',
                runner: 'playwright', // Set the runner to playwright
            });

        return res.status(200).json({
            spec: {
                ...spec,
                state: 'started',
                server: server || '',
                runner: 'playwright',
            },
            cycle,
        });
    } catch (e) {
        console.error('Error in getSpecToTest:', e);
        return res.status(500).json({
            error: true,
            message: `Server error: ${e.message}`,
        });
    }
}

const handler = nextConnect();
handler.use(auth).post(getSpecToTest);

export default handler;
