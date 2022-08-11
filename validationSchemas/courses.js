import Joi from 'joi';

// Used for creation
export const courseSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    days: Joi.number().required(),
    price: Joi.number().required(),
    minimumSkill: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    createdAt: Joi.date(),
    diveCenter: Joi.objectId(),
    user: Joi.objectId()
});

// Used for updates
export const courseOptionalSchema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    days: Joi.number(),
    price: Joi.number(),
    minimumSkill: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    createdAt: Joi.date(),
    diveCenter: Joi.objectId(),
    user: Joi.objectId()
});