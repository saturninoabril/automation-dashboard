exports.up = async function (knex) {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await knex.schema.createTable('cycles', (table) => {
        table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('repo').notNullable();
        table.string('branch').notNullable();
        table.string('build').notNullable();
        table.string('state');
        table.integer('specs_registered').notNullable().defaultTo(0);
        table.integer('specs_done').notNullable().defaultTo(0);
        table.integer('duration').notNullable().defaultTo(0);
        table.integer('pass').notNullable().defaultTo(0);
        table.integer('fail').notNullable().defaultTo(0);
        table.integer('pending').notNullable().defaultTo(0);
        table.integer('skipped').notNullable().defaultTo(0);
        table.timestamp('start_at');
        table.timestamp('end_at');
        table.timestamp('create_at').defaultTo(knex.fn.now());
        table.timestamp('update_at').defaultTo(knex.fn.now());

        table.unique(['repo', 'branch', 'build']);
    });

    await knex.schema.createTable('spec_executions', (table) => {
        table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('file').notNullable();
        table.string('server');
        table.string('state');
        table.integer('duration').notNullable().defaultTo(0);
        table.integer('tests').notNullable().defaultTo(0);
        table.integer('pass').notNullable().defaultTo(0);
        table.integer('fail').notNullable().defaultTo(0);
        table.integer('pending').notNullable().defaultTo(0);
        table.integer('skipped').notNullable().defaultTo(0);
        table.integer('sort_weight').notNullable().defaultTo(0);
        table.timestamp('test_start_at');
        table.timestamp('test_end_at');
        table.timestamp('start_at');
        table.timestamp('end_at');
        table.timestamp('create_at').defaultTo(knex.fn.now());
        table.timestamp('update_at').defaultTo(knex.fn.now());
        table.uuid('cycle_id');

        table.unique(['file', 'cycle_id']);

        table.foreign('cycle_id').references('cycles.id');
    });

    await knex.schema.createTable('case_executions', (table) => {
        table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.specificType('title', 'text[]');
        table.string('full_title');
        table.string('key');
        table.string('key_step');
        table.string('state');
        table.integer('duration').notNullable().defaultTo(0);
        table.timestamp('test_start_at');
        table.timestamp('create_at').defaultTo(knex.fn.now());
        table.timestamp('update_at').defaultTo(knex.fn.now());
        table.uuid('cycle_id');
        table.uuid('spec_execution_id');

        table.unique(['full_title', 'cycle_id', 'spec_execution_id']);

        table.foreign('cycle_id').references('cycles');
        table.foreign('spec_execution_id').references('spec_executions.id');
    });
};

exports.down = async function (knex) {
    await knex.raw('DROP TABLE cycles CASCADE');
    await knex.raw('DROP TABLE spec_executions CASCADE');
    await knex.raw('DROP TABLE test_executions CASCADE');
};
