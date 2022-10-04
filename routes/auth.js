import express from "express";
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

import validate from '../middleware/validate.js';
import {
    userSchema,
    userOptionalSchema
} from '../validationSchemas/users.js';

const router = express.Router();

router
    .post('/register', validate(userSchema), register)
    .post('/login', login)
    .get('/logout', logout)
    .get('/me', protect, getMe)
    .put('/updatedetails', protect, validate(userOptionalSchema), updateDetails)
    .put('/updatepassword', protect, validate(userOptionalSchema), updatePassword)
    .post('/forgotpassword', validate(userOptionalSchema), forgotPassword)
    .put('/resetpassword/:resettoken', resetPassword);

export { router };