exports.up = async function (knex) {
    await knex.schema.table('spec_executions', (table) => {
        table.index(['cycle_id'], 'idx_spec_executions_cycle_id');
    });

    await knex.schema.table('case_executions', (table) => {
        table.index(['cycle_id'], 'idx_case_executions_cycle_id');
        table.index(['spec_execution_id'], 'idx_case_executions_spec_execution_id');
        table.index(
            ['cycle_id', 'spec_execution_id'],
            'idx_case_executions_cycle_id_spec_execution_id'
        );
    });
};

exports.down = async function (knex) {
    await knex.schema.table('spec_executions', (table) => {
        table.dropIndex(['cycle_id'], 'idx_spec_executions_cycle_id');
    });

    await knex.schema.table('case_executions', (table) => {
        table.dropIndex(['cycle_id'], 'idx_case_executions_cycle_id');
        table.dropIndex(['spec_execution_id'], 'idx_case_executions_spec_execution_id');
        table.dropIndex(
            ['cycle_id', 'spec_execution_id'],
            'idx_case_executions_cycle_id_spec_execution_id'
        );
    });
};
