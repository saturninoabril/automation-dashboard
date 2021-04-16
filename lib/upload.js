const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { UPLOAD_REQUEST_URL } = loadEnvConfig('./', dev).combinedEnv;

export async function uploadFile(body) {
    const { extension, repo, branch, build } = body;
    const resGet = await fetch(`${UPLOAD_REQUEST_URL}&repo=${repo}&branch=${branch}&build=${build}&ext=${extension}`);
    const data = await resGet.json();

    return data;
}
