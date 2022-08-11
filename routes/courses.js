import express from 'express';
import { notFound } from '../middleware/error.js';
import {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
} from '../controllers/courses.js';
import Course from '../models/Course.js';

import advancedResults from '../middleware/advancedResults.js';
import { protect, authorize } from '../middleware/auth.js';

import validate from '../middleware/validate.js';
import {
    courseSchema,
    courseOptionalSchema
} from '../validationSchemas/courses.js';

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(advancedResults(Course, { path: 'diveCenter', select: 'name description' }), getCourses)
    .post(protect, authorize('publisher', 'admin'), validate(courseSchema), addCourse);

router
    .route('/:id')
    .get(getCourse)
    .put(protect, authorize('publisher', 'admin'), validate(courseOptionalSchema), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse);

router.use(notFound);

export { router };