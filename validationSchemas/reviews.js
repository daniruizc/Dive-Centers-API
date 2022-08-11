import Joi from 'joi';

// Used for creation
export const reviewSchema = Joi.object({
    title: Joi.string().max(100).required(),
    text: Joi.string().required(),
    rating: Joi.number().min(1).max(10).required(),
    createdAt: Joi.date(),
    diveCenter: Joi.objectId(),
    user: Joi.objectId()
});

// Used for updates
export const reviewOptionalSchema = Joi.object({
    title: Joi.string().max(100),
    text: Joi.string(),
    rating: Joi.number().min(1).max(10),
    createdAt: Joi.date(),
    diveCenter: Joi.objectId(),
    user: Joi.objectId()
});