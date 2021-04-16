import nextConnect from 'next-connect';

import { uploadFile } from '../../lib/upload';
import auth from '../../middleware/auth';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
};

async function upload(req, res) {
    const { body } = req;

    if (body) {
        const data = await uploadFile(body);
        return res.status(200).json(data);
    }

    return res.status(400).json({ message: 'No file to upload' });
}

const handler = nextConnect();
handler.use(auth).get(upload);

export default handler;
