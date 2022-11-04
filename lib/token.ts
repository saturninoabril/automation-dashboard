// @ts-nocheck
import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { loadEnvConfig } from '@next/env';

const dev = process.env.NODE_ENV !== 'production';
const { JWT_SECRET, ALLOWED_USER, ALLOWED_ROLE } = loadEnvConfig('./', dev).combinedEnv;

export function isTokenValid(req: NextApiRequest) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const urlEncodedToken = req.headers.authorization.split(' ')[1];
        const token = decodeURIComponent(urlEncodedToken);
        const decoded = jwt.verify(token, JWT_SECRET);
        return ALLOWED_USER.includes(decoded.user) && ALLOWED_ROLE.includes(decoded.role);
    }

    return false;
}
