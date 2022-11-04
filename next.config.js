const { loadEnvConfig } = require('@next/env');
const dev = process.env.NODE_ENV !== 'production';
const { BASE_IMAGE_URL } = loadEnvConfig('./', dev).combinedEnv;

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: [BASE_IMAGE_URL],
    },
};

module.exports = nextConfig;
