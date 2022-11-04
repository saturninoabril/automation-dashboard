import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { isTokenValid } from '@lib/token';

const auth = nextConnect().use((req: NextApiRequest, res: NextApiResponse, next) => {
    if (!isTokenValid(req)) {
        return res.status(403).json({ message: 'Invalid token' });
    }

    next();
});

export default auth;
