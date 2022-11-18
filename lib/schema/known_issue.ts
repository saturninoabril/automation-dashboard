import Joi from 'joi';

const knownIssueSchema = Joi.object().keys({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
    hash: Joi.string().max(255).trim(),
    data: Joi.object(),
    create_at: Joi.string().isoDate(),
    cycle_id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .max(50),
});

export default knownIssueSchema;
