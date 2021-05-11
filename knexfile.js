const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';
const { PG_URI } = loadEnvConfig('./', dev).combinedEnv;

module.exports = {
    client: 'pg',
    connection: PG_URI,
    migrations: {
        directory: './knex/migrations',
    },
    seeds: {
        directory: './knex/seeds',
    },
    pool: {
        min: 0,
        max: 7,
        afterCreate: function (conn, done) {
            conn.query('SELECT 1 + 1;', function (err) {
                if (err) {
                    console.log('Error: on newly created pool');
                } else {
                    console.log('Success: New pool created');
                }

                done(err, conn);
            });
        },
    },
};
