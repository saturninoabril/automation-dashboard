import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { uploadRequest } from '@lib/upload';
import auth from '@middleware/auth';

async function upload(req: NextApiRequest, res: NextApiResponse) {
    const { body } = req;

    if (body) {
        const data = await uploadRequest(body);
        return res.status(200).json(data);
    }

    return res.status(400).json({ message: 'No file to upload' });
}

const handler = nextConnect();
handler.use(auth).get(upload);

export default handler;
