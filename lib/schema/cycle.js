const Joi = require('joi');
const pickBy = require('lodash.pickby');

const schema = Joi.object().keys({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    repo: Joi.string().max(50).trim(),
    branch: Joi.string().max(50).trim(),
    build: Joi.string().max(64).trim(),
    state: Joi.string().max(50).trim(),
    specs_registered: Joi.number().min(0),
    specs_done: Joi.number().min(0),
    duration: Joi.number().min(0),
    pass: Joi.number().min(0),
    fail: Joi.number().min(0),
    pending: Joi.number().min(0),
    skipped: Joi.number().min(0),
    cypress_version: Joi.string().max(50).trim(),
    browser_name: Joi.string().max(50).trim(),
    browser_version: Joi.string().max(50).trim(),
    headless: Joi.boolean(),
    os_name: Joi.string().max(50).trim(),
    os_version: Joi.string().max(50).trim(),
    node_version: Joi.string().max(50).trim(),
    start_at: Joi.string().isoDate(),
    end_at: Joi.string().isoDate(),
    create_at: Joi.string().isoDate(),
    update_at: Joi.string().isoDate(),
});

const patchableFields = [
    'state',
    'specs_registered',
    'specs_done',
    'duration',
    'pass',
    'fail',
    'pending',
    'skipped',
    'cypress_version',
    'browser_name',
    'browser_version',
    'headless',
    'os_name',
    'os_version',
    'node_version',
];

const toPatch = (data) => {
    const { value, error } = schema.validate(data);

    if (error) {
        return { error };
    }

    return {
        value: pickBy(value, (v, k) => {
            return !(v === undefined || v === null) && patchableFields.includes(k);
        }),
    };
};

export default { schema, toPatch };
