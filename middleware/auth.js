import nextConnect from 'next-connect';

import { isTokenValid } from '../lib/token';

const auth = nextConnect().use((req, res, next) => {
    if (!isTokenValid(req)) {
        return res.status(403).json({ message: 'Invalid token' });
    }

    next();
});

export default auth;
