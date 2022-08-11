import express from "express";
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/users.js';

import User from "../models/User.js";

import advancedResults from '../middleware/advancedResults.js';
import { protect, authorize } from '../middleware/auth.js';

import validate from '../middleware/validate.js';
import {
    userSchema,
    userOptionalSchema
} from '../validationSchemas/users.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(advancedResults(User), getUsers)
    .post(validate(userSchema), createUser);

router
    .route('/:id')
    .get(getUser)
    .put(validate(userOptionalSchema), updateUser)
    .delete(deleteUser);

export { router };