import 'dotenv/config';
import express from 'express';
import colors from 'colors';
import loadDB from './config/db.js';
import loadGlobalMiddlewares from './middleware/load.js';
import { unhandledErrorHandler } from './middleware/error.js';
import loadRoutes from './routes/load.js';

// Load MongoDB
await loadDB();

// Load Express server
const app = express();

// Load global Middlewares
loadGlobalMiddlewares(app);

// Mount routes
loadRoutes(app);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

process.on('unhandledRejection', unhandledErrorHandler);
process.on('uncaughtException', unhandledErrorHandler);