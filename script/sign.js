const jwt = require('jsonwebtoken');
const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { JWT_SECRET, JWT_ALG, JWT_EXPIRES_IN, JWT_USER, JWT_ROLE } = loadEnvConfig('./', dev).combinedEnv;

const token = jwt.sign({ user: JWT_USER, role: JWT_ROLE }, JWT_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: JWT_EXPIRES_IN,
});
console.log('Token', token);
