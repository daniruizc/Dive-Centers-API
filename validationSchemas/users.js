import Joi from 'joi';

// Used for creation
export const userSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().pattern(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).required(),
    role: Joi.string().valid('user', 'publisher'),
    password: Joi.string().min(6).required(),
    resetPasswordToken: Joi.string(),
    resetPasswordExpire: Joi.string(),
    createdAt: Joi.date()
});

// Used for updates
export const userOptionalSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string().pattern(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
    role: Joi.string().valid('user', 'publisher'),
    password: Joi.string().min(6),
    currentPassword: Joi.string().min(6),
    newPassword: Joi.string().min(6),
    resetPasswordToken: Joi.string(),
    resetPasswordExpire: Joi.string(),
    createdAt: Joi.date()
});