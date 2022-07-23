import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import express from 'express';
import morgan from 'morgan';
import colors from 'colors';
import fileupload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';

connectDB(); // Load MongoDB
const app = express(); // Load express server
app.use(express.json()); // Body parser
app.use(cookieParser()); // Cookie parser

// Route files
import { router as diveCenters } from './routes/diveCenters.js';
import { router as courses } from './routes/courses.js';
import { router as auth } from './routes/auth.js';
import { router as users } from './routes/users.js';
import { router as reviews } from './routes/reviews.js';

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
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/diveCenters', diveCenters);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// Mount error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    // server.close(() => process.exit(1));
})