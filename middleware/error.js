import ErrorResponse from "../utils/errorResponse.js";
import { logDebug, logger } from '../config/logger.js'; // use logDebug to log different type of debug messages and logger to log to file and db

export const errorHandler = (err, req, res, next) => {

    // Copy err object received and set the message
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    logDebug(err);

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
        error = new ErrorResponse(message, 400);
    }

    // Log important errors to file and db
    if (!error.statusCode || error.statusCode === 500) {
        const detail = {
            url: req.originalUrl || '',
            statusCode: error.statusCode || 500,
            name: err.name || '',
            fileName: err.fileName || '',
            lineNumber: err.lineNumber || '',
            stack: err.stack || ''
        };

        logger.error({ level: 'error', message: error.message || 'Internal Server Error', detail });
    }

    res.status(error.statusCode || 500).json({ sucess: false, error: error.message || 'Internal Server Error' });
}

export const unhandledErrorHandler = async (err, promise) => {
    // Log important errors to file and db
    const detail = {
        statusCode: 500,
        name: err.name || '',
        fileName: err.fileName || '',
        lineNumber: err.lineNumber || '',
        stack: err.stack || ''
    };

    await logger.log({ level: 'error', message: err.message, detail });
    console.log(`Error: ${err.message}`.red);

    // Exit process
    process.exit(1);
}

export const notFound = (req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
}