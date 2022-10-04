import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import Course from '../models/Course.js';
import DiveCenter from '../models/DiveCenter.js';

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/diveCenters/:diveCenterId/courses
// @access  Public

export const getCourses = asyncHandler(async (req, res, next) => {
    if (req.params.diveCenterId) {
        const courses = await Course.find({ diveCenter: req.params.diveCenterId });
        return res.status(200).json({ success: true, count: courses.length, data: courses });
    } else {
        res.status(200).json(res.advancedResults);
    }
})

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public

export const getCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
        path: 'diveCenter',
        select: 'name description'
    });

    if (!course) {
        return next(new ErrorResponse(`Course not found with the id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: course });
})

// @desc    Add course
// @route   POST /api/v1/diveCenters/:diveCenterId/courses
// @access  Private

export const addCourse = asyncHandler(async (req, res, next) => {
    req.body.diveCenter = req.params.diveCenterId;
    req.body.user = req.user.id;

    const diveCenter = await DiveCenter.findById(req.params.diveCenterId);

    if (!diveCenter) {
        return next(new ErrorResponse(`DiveCenter not found with the id of ${req.params.diveCenterId}`, 404));
    }

    // Make sure user is diveCenter owner
    if (diveCenter.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to add a course to diveCenter ${diveCenter._id}`, 401));
    }

    const course = await Course.create(req.body);

    res.status(201).json({ success: true, data: course });
})

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private

export const updateCourse = asyncHandler(async (req, res, next) => {

    let course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with the id of ${req.params.id}`, 404));
    }

    // Make sure user is course owner
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update course ${req.params.id}`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: course });
})

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private

export const deleteCourse = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with the id of ${req.params.id}`, 404));
    }

    // Make sure user is course owner
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete course ${req.params.id}`, 401));
    }

    await course.remove();

    res.status(200).json({ success: true, data: {} });
})