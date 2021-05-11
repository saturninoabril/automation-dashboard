import knex from 'knex';
import config from '../knexfile.js';

/**
 * Global is used here to ensure the connection
 * is cached across hot-reloads in development
 *
 * see https://github.com/vercel/next.js/discussions/12229#discussioncomment-83372
 */
let cached = global.pg;
if (!cached) cached = global.pg = {};

export async function getKnex() {
    // try {
    //     if (cached.instance) {
    //         const connectCheck = await cached.instance.raw('SELECT 1 + 1');
    //         console.log('!SUCCESS connectCheck', connectCheck)
    //     }
    // } catch (e) {
    //     console.log('!ERROR connectCheck', e)
    //     cached.instance = knex(config)
    // }

    // if (!cached.instance) cached.instance = knex(config);
    // return cached.instance;

    if (cached.instance) {
        try {
            await cached.instance.raw('SELECT 1 + 1');
            console.log('!SUCCESS connectCheck');
            return cached.instance;
        } catch (e) {
            console.log('!ERROR connectCheck', e);
            cached.instance = knex(config);
            return getKnex();
        }
    } else {
        console.log('!RETRY no instance in cache');
        cached.instance = knex(config);
        return getKnex();
    }
}
