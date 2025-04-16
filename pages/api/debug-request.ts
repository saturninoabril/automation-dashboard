import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

async function debugRequest(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { method, query, body, headers } = req;
        
        // Remove sensitive information from headers
        const sanitizedHeaders = { ...headers };
        if (sanitizedHeaders.authorization) {
            sanitizedHeaders.authorization = 'Bearer [REDACTED]';
        }
        
        return res.status(200).json({
            method,
            query,
            body,
            headers: sanitizedHeaders,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error('Error in debugRequest:', e);
        return res.status(500).json({
            error: true,
            message: `Server error: ${e.message || 'Unknown error'}`
        });
    }
}

const handler = nextConnect();
handler.all(debugRequest);

export default handler;
