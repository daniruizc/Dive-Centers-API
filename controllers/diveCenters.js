import path from 'path';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import DiveCenter from '../models/DiveCenter.js';
import geocoder from '../utils/geocoder.js';

// @desc    Get all diveCenters
// @route   GET /api/v1/diveCenters
// @access  Public
export const getDiveCenters = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
})

// @desc    Get single diveCenter
// @route   GET /api/v1/diveCenters/:id
// @access  Public
export const getDiveCenter = asyncHandler(async (req, res, next) => {
    const diveCenter = await DiveCenter.findById(req.params.id);
    if (!diveCenter) {
        return next(new ErrorResponse(`DiveCenter not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ sucess: true, data: diveCenter });
})

// @desc    Create new diveCenter
// @route   POST /api/v1/diveCenters
// @access  Private
export const createDiveCenter = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check for published diveCenter
    const publishedDiveCenter = await DiveCenter.findOne({ user: req.user.id });

    // If the user is not an admin, they can only add one diveCenter
    if (publishedDiveCenter && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a diveCenter`, 400));
    }

    const diveCenter = await DiveCenter.create(req.body);
    res.status(201).json({ success: true, data: diveCenter });
})

// @desc    Update diveCenter
// @route   PUT /api/v1/diveCenters/:id
// @access  Private
export const updateDiveCenter = asyncHandler(async (req, res, next) => {
    let diveCenter = await DiveCenter.findById(req.params.id);

    if (!diveCenter) {
        return next(new ErrorResponse(`DiveCenter not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is diveCenter owner
    if (diveCenter.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this diveCenter`, 401));
    }

    diveCenter = await DiveCenter.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ sucess: true, data: diveCenter });
})

// @desc    Delete diveCenter
// @route   DELETE /api/v1/diveCenters/:id
// @access  Private
export const deleteDiveCenter = asyncHandler(async (req, res, next) => {
    const diveCenter = await DiveCenter.findById(req.params.id);
    if (!diveCenter) {
        return next(new ErrorResponse(`DiveCenter not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is diveCenter owner
    if (diveCenter.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this diveCenter`, 401));
    }

    diveCenter.remove();

    res.status(200).json({ sucess: true, data: {} });
})

// @desc    Get diveCenters within a radius
// @route   GET /api/v1/diveCenters/radius/:address/:distance
// @access  Private
export const getDiveCentersInRadius = asyncHandler(async (req, res, next) => {
    const { address, distance } = req.params;

    // Get the lat/lng from geocoder
    const loc = await geocoder.geocode(address);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963;

    console.log(lat, lng, radius);

    const diveCenters = await DiveCenter.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({ sucess: true, count: diveCenters.length, data: diveCenters });
})

// @desc    Upload photo for diveCenter
// @route   PUT /api/v1/diveCenters/:id/photo
// @access  Private
export const diveCenterPhotoUpload = asyncHandler(async (req, res, next) => {
    const diveCenter = await DiveCenter.findById(req.params.id);
    if (!diveCenter) {
        return next(new ErrorResponse(`DiveCenter not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is diveCenter owner
    if (diveCenter.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this diveCenter`, 401));
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an imagen less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Create custom filename
    file.name = `photo_${diveCenter._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await DiveCenter.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({ sucess: true, data: file.name });
    });
})