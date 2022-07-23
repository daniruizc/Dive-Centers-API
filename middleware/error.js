import ErrorResponse from "../utils/errorResponse.js";

export const errorHandler = (err, req, res, next) => {

    // Copy err object received and set the message
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.log(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        console.log(message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({ sucess: false, error: error.message || 'Server Error' });
}

export const notFound = (req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
}