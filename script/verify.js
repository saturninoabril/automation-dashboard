const jwt = require('jsonwebtoken');
const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { JWT_SECRET, JWT_SIGNED_TOKEN } = loadEnvConfig('./', dev).combinedEnv;

try {
    const decoded = jwt.verify(JWT_SIGNED_TOKEN, JWT_SECRET);
    console.log('decoded', decoded);
} catch (err) {
    console.log('error', err);
}
