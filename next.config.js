const { loadEnvConfig } = require('@next/env');
const dev = process.env.NODE_ENV !== 'production';
const { BASE_IMAGE_URL } = loadEnvConfig('./', dev).combinedEnv;

/** @type {import('next').NextConfig} */
const images = {};
if (BASE_IMAGE_URL) {
    images.domains = [BASE_IMAGE_URL, 'avatars.githubusercontent.com'];
}

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images,
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
            port: '',
            pathname: '/**',
        },
    ],
};

module.exports = nextConfig;
