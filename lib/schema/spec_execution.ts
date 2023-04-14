import Joi from 'joi';
import pickBy from 'lodash.pickby';

const specExecutionSchema = Joi.object().keys({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    file: Joi.string().max(255).trim(),
    server: Joi.string().max(255).trim(),
    state: Joi.string().max(255).trim(),
    duration: Joi.number().min(0),
    tests: Joi.number().min(0),
    pass: Joi.number().min(0),
    fail: Joi.number().min(0),
    bug: Joi.number().min(0),
    known: Joi.number().min(0),
    flaky: Joi.number().min(0),
    pending: Joi.number().min(0),
    skipped: Joi.number().min(0),
    sort_weight: Joi.number().min(0),
    test_end_at: Joi.string().isoDate(),
    test_start_at: Joi.string().isoDate(),
    start_at: Joi.string().isoDate(),
    end_at: Joi.string().isoDate(),
    create_at: Joi.string().isoDate(),
    update_at: Joi.string().isoDate(),
    cycle_id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    last_execution: Joi.array(),
});

const patchableFields = [
    'server',
    'state',
    'pass',
    'fail',
    'bug',
    'known',
    'flaky',
    'pending',
    'skipped',
    'duration',
    'test_start_at',
    'test_end_at',
    'last_execution',
];

export const getPatchableSpecExecutionFields = (data: Record<string, any>) => {
    const { value, error } = specExecutionSchema.validate(data);

    if (error) {
        return { error };
    }

    return {
        value: pickBy(value, (v, k) => {
            return !(v === undefined || v === null) && patchableFields.includes(k);
        }),
    };
};

export default specExecutionSchema;
