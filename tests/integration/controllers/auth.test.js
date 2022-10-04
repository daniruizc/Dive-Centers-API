import 'dotenv/config';
import { server } from '../../../server.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../../models/User.js';
// import { sendEmail, test } from '../../../utils/sendEmail.js';
import * as mailer from '../../../utils/sendEmail.js';

// jest.mock('../../../utils/sendEmail.js', () => {
//     return {
//         __esModule: true,
//         ...jest.requireActual('../../../utils/sendEmail.js'),
//         sendEmail: jest.fn().mockReturnValue(false)
//     }
// })


// import { forgotPassword } from '../../../controllers/auth.js';
// jest.unstable_mockModule('../../../utils/sendEmail.js', () => ({
//     sendEmail: jest.fn(() => false)
// }));
// console.log(sendEmail)
// jest.mock('../../../utils/sendEmail.js', () => ({
//     ...(jest.requireActual('../../../utils/sendEmail.js')),
//     sendEmail: jest.fn(() => false)
// }))
// console.log(sendEmail)

// const { sendEmail } = await import('../../../utils/sendEmail.js');



// const sendMailMock = jest.fn().mockReturnValue((mailoptions, callback) => { });
// import nodemailer from 'nodemailer';
// jest.mock("nodemailer");
// jest.mock('nodemailer', () => ({
//     createTransport: jest.fn().mockReturnValue({
//         sendMail: sendMailMock
//     })
// }));
// nodemailer.createTransport.mockReturnValue({ "sendMail": sendMailMock });

// beforeEach(() => {
//     sendMailMock.mockClear();
//     nodemailer.createTransport.mockClear();
// });





describe('auth integration tests', () => {

    describe('POST /register', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 400 if input validation is not passed', async () => {
            let result;

            result = await request(server)
                .post('/api/v1/auth/register')
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"name" is required/i));

            result = await request(server)
                .post('/api/v1/auth/register')
                .send({ name: 'user 1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"email" is required/i));

            result = await request(server)
                .post('/api/v1/auth/register')
                .send({ name: 'user 1', email: 'user1@gmail.com' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"password" is required/i));
        });

        it('Should return the created user with cookie information', async () => {
            const result = await request(server)
                .post('/api/v1/auth/register')
                .send({ name: 'user 1', email: 'user1@gmail.com', password: '123456' });

            expect(result.status).toBe(201);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            const token = result.body.token;
            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
        });

    });

    describe('POST /login', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 400 if input validation is not passed', async () => {
            let result;

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/email/i));

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/password/i));
        });

        it('should return 401 if user does not exist', async () => {
            const result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/invalid credentials/i));
        });

        it('should return 401 if user exist but credentials are invalid', async () => {
            const user1 = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user1.save();

            const result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '1234567' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/invalid credentials/i));
        });

        it('Should return the user with cookie information', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            const result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            const token = result.body.token;
            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
        });

        it('Should return the user with cookie information and secure option enable if production', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            const _NODE_ENV = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            process.env.NODE_ENV = _NODE_ENV;

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            const token = result.body.token;
            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
            expect(tokenCookie[0]).toContain(`Secure`);
        });

    });

    describe('GET /logout', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should remove token from cookie', async () => {
            const user1 = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user1.save();

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            const result = await request(server).get('/api/v1/auth/logout');

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.header).toHaveProperty('set-cookie');

            const token = result.body.token;
            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain('token=none');
        });

    });

    describe('GET /me', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server).get('/api/v1/auth/me');

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if token is not valid', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            const token = user.getSignedJwtToken();

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            const JWT_SECRET = process.env.JWT_SECRET;
            process.env.JWT_SECRET = "1234";

            const result = await request(server)
                .get('/api/v1/auth/me')
                .auth(token, { type: 'bearer' });

            process.env.JWT_SECRET = JWT_SECRET;

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return logged in user', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            const token = user.getSignedJwtToken();

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            const result = await request(server)
                .get('/api/v1/auth/me')
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'user 1');
        });

    });

    describe('PUT /updatedetails', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server).put('/api/v1/auth/updatedetails');

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 400 if validation is not passed', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            const token = user.getSignedJwtToken();

            let result;

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            result = await request(server)
                .put('/api/v1/auth/updatedetails')
                .auth(token, { type: 'bearer' })
                .send({ name: 1234 });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/validation error/i));

            result = await request(server)
                .put('/api/v1/auth/updatedetails')
                .auth(token, { type: 'bearer' })
                .send({ email: 1234 });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/validation error/i));
        });

        it('Should return the modified user', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            const token = user.getSignedJwtToken();

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            const result = await request(server)
                .put('/api/v1/auth/updatedetails')
                .auth(token, { type: 'bearer' })
                .send({ name: 'user 1 modified', email: 'user1mod@gmail.com' });;

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'user 1 modified');
            expect(result.body).toHaveProperty('data.email', 'user1mod@gmail.com');
        });

    });

    describe('PUT /updatepassword', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server).put('/api/v1/auth/updatepassword');

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 400 if validation is not passed', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            const token = user.getSignedJwtToken();

            let result;

            await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            result = await request(server)
                .put('/api/v1/auth/updatepassword')
                .auth(token, { type: 'bearer' })
                .send({ currentPassword: '1234' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/validation error/i));

            result = await request(server)
                .put('/api/v1/auth/updatepassword')
                .auth(token, { type: 'bearer' })
                .send({ newPassword: '1234' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/validation error/i));
        });

        it('Should return 401 if passwords does not match', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            let result;

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            const token = result.body.token;

            result = await request(server)
                .put('/api/v1/auth/updatepassword')
                .auth(token, { type: 'bearer' })
                .send({ currentPassword: '1234567', newPassword: '1234567' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/password is incorrect/i));
        });

        it('Should return the user with cookie information', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            let result, token;

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            token = result.body.token;

            result = await request(server)
                .put('/api/v1/auth/updatepassword')
                .auth(token, { type: 'bearer' })
                .send({ currentPassword: '123456', newPassword: '1234567' });

            token = result.body.token;

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
        });

    });

    describe('POST /forgotpassword', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 400 if validation is not passed', async () => {
            const result = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: '1234' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/validation error/i));
        });

        it('Should return 404 if user not found', async () => {
            const result = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: 'notfound@gmail.com' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it.skip('Should return 500 if email cannot be sent', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            // TODO: Jest spy to intercept mailer.sendPasswordResetEmail call
            let spy = jest.spyOn(mailer, 'sendEmail').mockImplementation(() => false);

            const result = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: 'user1@gmail.com' });

            expect(result.status).toBe(500);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not be sent/i));
        });

        it('Should return 200 if email is sent', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();

            let result, token;

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '123456' });

            token = result.body.token;

            result = await request(server)
                .put('/api/v1/auth/updatepassword')
                .auth(token, { type: 'bearer' })
                .send({ currentPassword: '123456', newPassword: '1234567' });

            token = result.body.token;

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            const tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
        });

    });

    describe('PUT /resetpassword/:resettoken', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 400 if reset token is not valid', async () => {
            const resetToken = '12345';
            const result = await request(server)
                .put(`/api/v1/auth/resetpassword/${resetToken}`);

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/invalid token/i));
        });

        it('Should return 400 if reset token is not valid', async () => {
            const resetToken = '12345';
            const result = await request(server)
                .put(`/api/v1/auth/resetpassword/${resetToken}`);

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/invalid token/i));
        });

        it('Should change the password and return the user with cookie information', async () => {
            const user = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            const resetToken = user.getResetPasswordToken();
            await user.save();

            let result, token, tokenCookie;
            result = await request(server)
                .put(`/api/v1/auth/resetpassword/${resetToken}`)
                .send({ password: '_123456' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            token = result.body.token;
            tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);

            result = await request(server)
                .post('/api/v1/auth/login')
                .send({ email: 'user1@gmail.com', password: '_123456' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('token');
            expect(result.header).toHaveProperty('set-cookie');

            token = result.body.token;
            tokenCookie = result.header['set-cookie'].filter(cookie => cookie.includes('token='));

            expect(tokenCookie[0]).toContain(`token=${token}`);
        });

    });

});