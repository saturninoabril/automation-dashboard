exports.up = async function (knex) {
    await knex.schema.table('cycles', (table) => {
        table.string('cypress_version');
        table.string('browser_name');
        table.string('browser_version');
        table.boolean('headless');
        table.string('os_name');
        table.string('os_version');
        table.string('node_version');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('cycles', (table) => {
        table.dropColumn('cypress_version');
        table.dropColumn('browser_name');
        table.dropColumn('browser_version');
        table.dropColumn('headless');
        table.dropColumn('os_name');
        table.dropColumn('os_version');
        table.dropColumn('node_version');
    });
};
