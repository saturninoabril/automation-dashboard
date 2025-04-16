exports.up = async function (knex) {
    await knex.schema.table('cycles', (table) => {
        table.string('runner', 20).nullable().index(); // Add runner column
    });
    await knex.schema.table('spec_executions', (table) => {
        table.string('runner', 20).nullable().index(); // Add runner column
    });
    await knex.schema.table('case_executions', (table) => {
        table.string('runner', 20).nullable().index(); // Add runner column
        // Change error_frame to JSONB to store richer error data from Playwright
        table.jsonb('error_frame').alter();
        // Add new optional columns for Playwright specific error details
        table.text('error_stack').nullable();
        table.text('error_snippet').nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.table('cycles', (table) => {
        table.dropColumn('runner');
    });
    await knex.schema.table('spec_executions', (table) => {
        table.dropColumn('runner');
    });
    await knex.schema.table('case_executions', (table) => {
        table.dropColumn('runner');
        // Revert error_frame back to TEXT (potential data loss)
        table.text('error_frame').alter();
        table.dropColumn('error_stack');
        table.dropColumn('error_snippet');
    });
};
