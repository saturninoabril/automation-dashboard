import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getCycleByID, getCycleByLike } from '@lib/store/cycle';
import type { Cycle } from '@types';

async function getCycle(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id, repo, branch, build } = req.query;

        let cycle: Cycle | null = null;
        if (id) {
            ({ cycle } = await getCycleByID(id.toString()));
        } else if (repo || branch || build) {
            ({ cycle } = await getCycleByLike({
                repo: repo?.toString(),
                branch: branch?.toString(),
                build: build?.toString(),
            }));
        } else {
            res.status(400).json({
                error: true,
                message: 'Cycle not found. Requires query parameters.',
            });
        }

        if (!cycle) {
            return res.status(400).json({ error: true, message: 'Cycle not found.' });
        }

        return res.status(200).json(cycle);
    } catch (e) {
        return res.status(501).json({ error: true, message: 'Cycle not found.' });
    }
}

const handler = nextConnect();
handler.get(getCycle);

export default handler;
