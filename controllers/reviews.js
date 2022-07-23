import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import Review from '../models/Review.js';
import DiveCenter from '../models/DiveCenter.js';

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/diveCenters/:diveCenterId/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res, next) => {
    if (req.params.diveCenterId) {
        const reviews = await Review.find({ diveCenter: req.params.diveCenterId });
        return res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } else {
        res.status(200).json(res.advancedResults);
    }
})

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'diveCenter',
        select: 'name description'
    });

    if (!review) {
        return next(new ErrorResponse(`No review found with the id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: review });
})

// @desc    Add review
// @route   POST /api/v1/diveCenters/:diveCenterId/reviews
// @access  Private
export const addReview = asyncHandler(async (req, res, next) => {
    req.body.diveCenter = req.params.diveCenterId;
    req.body.user = req.user.id;

    const diveCenter = await DiveCenter.findById(req.params.diveCenterId);

    if (!diveCenter) {
        return next(new ErrorResponse(`No diveCenter with the id of ${req.params.diveCenterId}`, 404));
    }

    const review = await Review.create(req.body);

    res.status(201).json({ success: true, data: review });
})

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404));
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review`, 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: review });
})

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404));
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review`, 401));
    }

    await review.remove();

    res.status(200).json({ success: true, data: {} });
})