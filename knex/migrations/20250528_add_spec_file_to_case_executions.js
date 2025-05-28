exports.up = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.string('spec_file');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.dropColumn('spec_file');
    });
};