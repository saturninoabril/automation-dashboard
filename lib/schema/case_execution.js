const Joi = require('joi');
const pickBy = require('lodash.pickby');

const schema = Joi.object().keys({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    title: Joi.array().items(Joi.string()),
    full_title: Joi.string().trim(),
    key: Joi.string().max(50).trim(),
    key_step: Joi.string().max(50).trim(),
    state: Joi.string().lowercase().max(255).trim(),
    duration: Joi.number().min(0),
    code: Joi.string().max(5000).trim(),
    error_display: Joi.string().max(5000).trim(),
    error_frame: Joi.string().max(5000).trim(),
    screenshot: Joi.object({
        url: Joi.string().uri(),
        taken_at: Joi.string().isoDate(),
        height: Joi.number().integer(),
        width: Joi.number().integer(),
    }),
    test_start_at: Joi.string().isoDate(),
    create_at: Joi.string().isoDate(),
    update_at: Joi.string().isoDate(),
    cycle_id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    spec_execution_id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
});

const patchableFields = ['key', 'key_step', 'state', 'duration'];

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
