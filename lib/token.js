const jwt = require('jsonwebtoken');
const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { JWT_SECRET, ALLOWED_USER, ALLOWED_ROLE } = loadEnvConfig('./', dev).combinedEnv;

export function isTokenValid(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const urlEncodedToken = req.headers.authorization.split(' ')[1];
        const token = decodeURIComponent(urlEncodedToken);
        const { user, role } = jwt.verify(token, JWT_SECRET);
        return ALLOWED_USER.includes(user) && ALLOWED_ROLE.includes(role);
    }

    return false;
}
