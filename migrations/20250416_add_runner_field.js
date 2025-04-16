exports.up = async function (knex) {
    // Check if runner column exists in spec_executions
    const hasRunnerColumn = await knex.schema.hasColumn('spec_executions', 'runner');
    if (!hasRunnerColumn) {
        await knex.schema.alterTable('spec_executions', (table) => {
            table.string('runner').defaultTo('cypress');
        });
    }

    // Check if runner column exists in case_executions
    const hasCaseRunnerColumn = await knex.schema.hasColumn('case_executions', 'runner');
    if (!hasCaseRunnerColumn) {
        await knex.schema.alterTable('case_executions', (table) => {
            table.string('runner').defaultTo('cypress');
        });
    }

    // Check if runner column exists in cycles
    const hasCycleRunnerColumn = await knex.schema.hasColumn('cycles', 'runner');
    if (!hasCycleRunnerColumn) {
        await knex.schema.alterTable('cycles', (table) => {
            table.string('runner').defaultTo('cypress');
        });
    }
};

exports.down = async function (knex) {
    // Revert changes if needed
    const hasRunnerColumn = await knex.schema.hasColumn('spec_executions', 'runner');
    if (hasRunnerColumn) {
        await knex.schema.alterTable('spec_executions', (table) => {
            table.dropColumn('runner');
        });
    }

    const hasCaseRunnerColumn = await knex.schema.hasColumn('case_executions', 'runner');
    if (hasCaseRunnerColumn) {
        await knex.schema.alterTable('case_executions', (table) => {
            table.dropColumn('runner');
        });
    }

    const hasCycleRunnerColumn = await knex.schema.hasColumn('cycles', 'runner');
    if (hasCycleRunnerColumn) {
        await knex.schema.alterTable('cycles', (table) => {
            table.dropColumn('runner');
        });
    }
};
