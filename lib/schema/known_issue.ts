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

export const knownIssueDataSchema = Joi.object().keys({
    spec_file: Joi.string().required(),
    cases: Joi.array()
        .items({
            title: Joi.string().required(),
            type: Joi.string().required().valid('bug', 'known', 'flaky'),
            ticket: Joi.string().when('type', {
                is: 'bug',
                then: Joi.string()
                    .regex(/^(MM-)\d+/)
                    .required(),
                otherwise: Joi.string(),
            }),
        })
        .required(),
});

export default knownIssueSchema;
