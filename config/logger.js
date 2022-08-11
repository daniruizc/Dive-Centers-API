import debug from 'debug';
import path from 'path';
import winston from 'winston';
import winstonMongoDB from 'winston-mongodb';

// Function to print debug logs on the console
// Set the DEBUG environment variable to `debug` or any newly created debug types (concatenate multiple values with comma).
export const logDebug = debug('debug');

// Load function to log into File and Database
export const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.metadata()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join('log', 'error.log'),
            level: 'error'
        }),
        new winston.transports.MongoDB({
            db: process.env.MONGO_URI,
            level: 'error',
            options: {
                useUnifiedTopology: true
            },
        })
    ]
});