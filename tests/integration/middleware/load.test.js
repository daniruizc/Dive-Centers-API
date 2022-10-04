import 'dotenv/config';
import { jest } from '@jest/globals';
import express from 'express';
import { server } from '../../../server.js';
import loadGlobalMiddlewares from '../../../middleware/load.js';
jest.setTimeout(20000);

describe('middleware load integration tests', () => {
    describe('Initialize middlewares', () => {

        afterAll(async () => {
            server.close();
        });

        it('Should load morgan when development environment', async () => {
            const NODE_ENV = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const app = express();
            loadGlobalMiddlewares(app);

            process.env.NODE_ENV = NODE_ENV;
        });

        it('Should load morgan when development environment', async () => {
            const app = express();
            loadGlobalMiddlewares(app);
        });
    })
});