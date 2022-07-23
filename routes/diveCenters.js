import express from 'express';
import { notFound } from '../middleware/error.js';
import {
    getDiveCenters,
    getDiveCenter,
    createDiveCenter,
    updateDiveCenter,
    deleteDiveCenter,
    getDiveCentersInRadius,
    diveCenterPhotoUpload
} from '../controllers/diveCenters.js';

import DiveCenter from '../models/DiveCenter.js';

// Include other resource routers
import { router as courseRouter } from './courses.js';
import { router as reviewsRouter } from './reviews.js';

const router = express.Router();

import advancedResults from '../middleware/advancedResults.js';
import { protect, authorize } from '../middleware/auth.js';

// Re-route into other resource routers
router.use('/:diveCenterId/courses', courseRouter);
router.use('/:diveCenterId/reviews', reviewsRouter);

router
    .route('/radius/:address/:distance')
    .get(getDiveCentersInRadius);

router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), diveCenterPhotoUpload);

router
    .route('/')
    .get(advancedResults(DiveCenter, 'courses'), getDiveCenters)
    .post(protect, authorize('publisher', 'admin'), createDiveCenter);

router
    .route('/:id')
    .get(getDiveCenter)
    .put(protect, authorize('publisher', 'admin'), updateDiveCenter)
    .delete(protect, authorize('publisher', 'admin'), deleteDiveCenter);


router.use(notFound);


export { router };