import express from 'express';
import { notFound } from '../middleware/error.js';
import {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview
} from '../controllers/reviews.js';
import Review from '../models/Review.js';

import advancedResults from '../middleware/advancedResults.js';
import { protect, authorize } from '../middleware/auth.js';

import validate from '../middleware/validate.js';
import {
    reviewSchema,
    reviewOptionalSchema
} from '../validationSchemas/reviews.js';

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(advancedResults(Review, { path: 'diveCenter', select: 'name description' }), getReviews)
    .post(protect, authorize('user', 'admin'), validate(reviewSchema), addReview);

router
    .route('/:id')
    .get(getReview)
    .put(protect, authorize('user', 'admin'), validate(reviewOptionalSchema), updateReview)
    .delete(protect, authorize('user', 'admin'), deleteReview);

router.use(notFound);

export { router };