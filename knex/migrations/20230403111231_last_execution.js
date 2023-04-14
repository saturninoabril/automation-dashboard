exports.up = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.jsonb('last_execution');

        table.index(['full_title'], 'idx_case_executions_full_title');
    });

    await knex.schema.table('spec_executions', (table) => {
        table.integer('bug').defaultTo(0);
        table.integer('known').defaultTo(0);
        table.integer('flaky').defaultTo(0);
        table.jsonb('last_execution');

        table.index(['file'], 'idx_spec_executions_file');
    });

    await knex.schema.table('cycles', (table) => {
        table.integer('bug').defaultTo(0);
        table.integer('known').defaultTo(0);
        table.integer('flaky').defaultTo(0);

        table.index(['repo', 'branch'], 'idx_cycles_repo_branch');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.dropColumn('last_execution');

        table.dropIndex(['full_title'], 'idx_case_executions_full_title');
    });

    await knex.schema.table('spec_executions', (table) => {
        table.dropColumn('bug');
        table.dropColumn('known');
        table.dropColumn('flaky');
        table.dropColumn('last_execution');

        table.dropIndex(['file'], 'idx_spec_executions_file');
    });

    await knex.schema.table('cycles', (table) => {
        table.dropColumn('bug');
        table.dropColumn('known');
        table.dropColumn('flaky');

        table.dropIndex(['repo', 'branch'], 'idx_cycles_repo_branch');
    });
};
