// @ts-nocheck
import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { loadEnvConfig } from '@next/env';

const dev = process.env.NODE_ENV !== 'production';
const { JWT_SECRET, ALLOWED_USER, ALLOWED_ROLE } = loadEnvConfig('./', dev).combinedEnv;

// Log loaded environment variables for debugging
console.log('Auth Config - ALLOWED_USER:', ALLOWED_USER);
console.log('Auth Config - ALLOWED_ROLE:', ALLOWED_ROLE);
// Avoid logging JWT_SECRET in production environments
if (dev) {
    console.log('Auth Config - JWT_SECRET:', JWT_SECRET ? 'Loaded' : 'Not Loaded');
}


export function isTokenValid(req: NextApiRequest) {
    console.log('isTokenValid: Checking token...'); // Log entry
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        try {
            const urlEncodedToken = req.headers.authorization.split(' ')[1];
            // Try both decoded and raw token to handle different client implementations
            let token = urlEncodedToken;
            try {
                // Only decode if it's actually URL encoded
                if (urlEncodedToken.includes('%')) {
                    token = decodeURIComponent(urlEncodedToken);
                }
            } catch (decodeError) {
                console.warn('isTokenValid: Error decoding token, using raw token:', decodeError.message);
            }
            
            console.log('isTokenValid: Token found, verifying...'); // Log step
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('isTokenValid: Token verified. Decoded payload:', decoded); // Log decoded payload

            // If ALLOWED_USER or ALLOWED_ROLE is empty or not defined, skip that check
            const userAllowed = !ALLOWED_USER || ALLOWED_USER === '' || ALLOWED_USER.split(',').includes(decoded.user);
            const roleAllowed = !ALLOWED_ROLE || ALLOWED_ROLE === '' || ALLOWED_ROLE.split(',').includes(decoded.role);

            console.log(`isTokenValid: User "${decoded.user}" allowed?`, userAllowed); // Log user check
            console.log(`isTokenValid: Role "${decoded.role}" allowed?`, roleAllowed); // Log role check

            return userAllowed && roleAllowed;
        } catch (error) {
            console.error('isTokenValid: Error verifying token:', error.message); // Log verification errors
            return false;
        }
    }

    console.log('isTokenValid: No valid Bearer token found in Authorization header.'); // Log missing token
    return false;
}
