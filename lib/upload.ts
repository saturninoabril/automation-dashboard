const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { UPLOAD_REQUEST_URL } = loadEnvConfig('./', dev).combinedEnv;

type UploadRequestParams = {
    extension: string;
    repo: string;
    branch: string;
    build: string;
};

export async function uploadRequest(body: UploadRequestParams) {
    const { extension, repo, branch, build } = body;
    const res = await fetch(
        `${UPLOAD_REQUEST_URL}&repo=${repo}&branch=${branch}&build=${build}&ext=${extension}`
    );
    const data = await res.json();

    return data;
}
