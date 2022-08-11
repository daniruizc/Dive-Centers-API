import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fileupload from 'express-fileupload';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (app) => {
    // Body parser
    app.use(express.json());

    // Cookie parser
    app.use(cookieParser());

    // Dev logging middleware
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    // File uploading
    app.use(fileupload());

    // Sanitize data
    app.use(mongoSanitize());

    // Set security headers
    app.use(helmet());

    // Prevent XSS attacks
    app.use(xss());

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 10 * 60 * 1000, // 10 mins
        max: 100
    });
    app.use(limiter);

    // Prevent http param pollution
    app.use(hpp());

    // Enable CORS
    app.use(cors());

    // Set static folder
    app.use(express.static(path.join(__dirname, '..', 'public')));
};