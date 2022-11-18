exports.up = async function (knex) {
    await knex.schema.createTable('known_issues', (table) => {
        table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('cycle_id');
        table.string('hash');
        table.jsonb('data');
        table.timestamp('create_at').defaultTo(knex.fn.now());

        table.unique(['hash', 'cycle_id']);
        table.foreign('cycle_id').references('cycles.id');
        table.index(['cycle_id'], 'idx_known_issues_cycle_id');
    });

    await knex.schema.table('cycles', (table) => {
        table.integer('known_fail').defaultTo(0);
    });
};

exports.down = async function (knex) {
    await knex.schema.table('known_issues', (table) => {
        table.dropIndex(['cycle_id'], 'idx_known_issues_cycle_id');
    });
    await knex.raw('DROP TABLE known_issues CASCADE');

    await knex.schema.table('cycles', (table) => {
        table.dropColumn('known_fail');
    });
};
