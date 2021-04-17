exports.up = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.string('code', 5000);
        table.string('error_display', 5000);
        table.string('error_frame', 5000);
        table.jsonb('screenshot');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.dropColumn('code');
        table.dropColumn('error_display');
        table.dropColumn('error_frame');
        table.dropColumn('screenshot');
    });
};
