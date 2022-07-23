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
import {
    protect
} from '../middleware/auth.js';

const router = express.Router();

router
    .post('/register', register)
    .post('/login', login)
    .get('/logout', logout)
    .get('/me', protect, getMe)
    .put('/updatedetails', protect, updateDetails)
    .put('/updatepassword', protect, updatePassword)
    .post('/forgotpassword', forgotPassword)
    .put('/resetpassword/:resettoken', resetPassword);

export { router };