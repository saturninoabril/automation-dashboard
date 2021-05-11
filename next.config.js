const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { BASE_IMAGE_URL } = loadEnvConfig('./', dev).combinedEnv;

module.exports = {
    future: {
        webpack5: true,
    },
    images: {
        domains: [BASE_IMAGE_URL],
    },
};
