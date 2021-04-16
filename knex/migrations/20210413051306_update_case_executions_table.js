exports.up = async function (knex) {
    await knex.schema.table('case_executions', (table) => {
        table.string('code', 1000);
        table.string('error_display', 1000);
        table.string('error_frame', 1000);
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
