import Joi from 'joi';

// Used for creation
export const diveCenterSchema = Joi.object({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(500).required(),
    website: Joi.string().pattern(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/),
    phone: Joi.string().max(20),
    email: Joi.string().pattern(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
    address: Joi.string().required(),
    specialties: Joi.array().items(Joi.string().required()).required(),
    averageRating: Joi.number().min(1).max(10),
    averageCost: Joi.number(),
    photo: Joi.string(),
    createdAt: Joi.date(),
    user: Joi.objectId()
});

// Used for updates
export const diveCenterOptionalSchema = Joi.object({
    name: Joi.string().max(50),
    description: Joi.string().max(500),
    website: Joi.string().pattern(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/),
    phone: Joi.string().max(20),
    email: Joi.string().pattern(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
    address: Joi.string(),
    specialties: Joi.array().items(Joi.string().required()),
    averageRating: Joi.number().min(1).max(10),
    averageCost: Joi.number(),
    photo: Joi.string(),
    createdAt: Joi.date(),
    user: Joi.objectId()
});