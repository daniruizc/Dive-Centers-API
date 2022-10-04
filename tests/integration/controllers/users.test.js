import { server } from '../../../server.js';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../../models/User.js';

describe('users integration tests', () => {

    describe('GET /', () => {

        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {

            user1 = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user 2', email: 'user2@gmail.com', password: '123456', role: 'user' });
            user3 = new User({ name: 'user 3', email: 'user3@gmail.com', password: '123456', role: 'publisher' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            // Change de user role to admin
            await User.collection.updateOne(user1, { $set: { 'role': 'admin' } });
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server).get('/api/v1/users');

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .get('/api/v1/users')
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return all users', async () => {
            const result = await request(server)
                .get('/api/v1/users')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.name === 'user 1')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'user 2')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'user 3')).toBeTruthy();
        });

        it('should filter by custom field', async () => {
            const result = await request(server)
                .get('/api/v1/users?email=user2@gmail.com')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.name === 'user 2')).toBeTruthy();
        });

        it('should filter by $in operator', async () => {
            const result = await request(server)
                .get('/api/v1/users?name[in]=user 3')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.name === 'user 3')).toBeTruthy();
        });

        it('should return only selected fields', async () => {
            const result = await request(server)
                .get('/api/v1/users?select=email')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.data.filter(g => g.name).length).toBe(0);
            expect(result.body.data.filter(g => g.email).length).toBeGreaterThan(0);
        });

        it('should sort results', async () => {
            const users = [
                { name: 'user 0', email: 'user0@gmail.com' },
                { name: 'user 5', email: 'user5@gmail.com' },
                { name: 'user 4', email: 'user4@gmail.com' }
            ];
            await User.collection.insertMany(users);
            const result = await request(server)
                .get('/api/v1/users?sort=name')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(6);
            expect(result.body.data[0].name).toBe('user 0');
            expect(result.body.data[1].name).toBe('user 1');
            expect(result.body.data[2].name).toBe('user 2');
            expect(result.body.data[3].name).toBe('user 3');
            expect(result.body.data[4].name).toBe('user 4');
            expect(result.body.data[5].name).toBe('user 5');
        });

        it('should limit results', async () => {
            const result = await request(server)
                .get('/api/v1/users?limit=2')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
        });

        it('should paginate results', async () => {
            const result = await request(server)
                .get('/api/v1/users?limit=1&page=2')
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data[0].name).toBe('user 2');
        });
    });

    describe('GET /:id', () => {

        let user1, user2, token1, token2;
        let _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {

            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ _id, name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user 2', email: 'user2@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();

            // Change de user role to admin
            await User.collection.updateOne(user1, { $set: { 'role': 'admin' } });
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server).get(`/api/v1/users/${new mongoose.Types.ObjectId().toHexString()}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .get(`/api/v1/users/${new mongoose.Types.ObjectId().toHexString()}`)
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 404 if no valid id is passed', async () => {
            _idStr = undefined;
            const result = await request(server)
                .get(`/api/v1/users/${_idStr}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return 404 if id does not exist', async () => {
            _idStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server)
                .get(`/api/v1/users/${_idStr}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return a specific course', async () => {
            const result = await request(server)
                .get(`/api/v1/users/${_idStr}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'user 1');
        });
    });

    describe('POST /', () => {

        let user1, user2, token1, token2;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            user1 = new User({ name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user 2', email: 'user2@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();

            // Change de user role to admin
            await User.collection.updateOne(user1, { $set: { 'role': 'admin' } });
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .post('/api/v1/users/');

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .post('/api/v1/users')
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 400 if mandatory fields are not provided', async () => {
            let result;

            result = await request(server)
                .post('/api/v1/users')
                .auth(token1, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"name" is required/i));

            result = await request(server)
                .post('/api/v1/users')
                .auth(token1, { type: 'bearer' })
                .send({ name: 'user 3' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"email" is required/i));

            result = await request(server)
                .post('/api/v1/users')
                .auth(token1, { type: 'bearer' })
                .send({ name: 'user 3', email: 'user3@gmail.com' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"password" is required/i));
        });

        it('should return the created user', async () => {
            const result = await request(server)
                .post('/api/v1/users')
                .auth(token1, { type: 'bearer' })
                .send({ name: 'user 3', email: 'user3@gmail.com', password: '123456' });

            expect(result.status).toBe(201);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'user 3');
        });
    });

    describe('PUT /:id', () => {

        let user1, user2, token1, token2;
        let _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {

            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ _id, name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user 2', email: 'user2@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();

            // Change de user role to admin
            await User.collection.updateOne(user1, { $set: { 'role': 'admin' } });
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .put(`/api/v1/users/${_idStr}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .put(`/api/v1/users/${_idStr}`)
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if user is not found', async () => {
            const result = await request(server)
                .put(`/api/v1/users/${new mongoose.Types.ObjectId().toHexString()}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return the modified user', async () => {
            const result = await request(server)
                .put(`/api/v1/users/${_idStr}`)
                .auth(token1, { type: 'bearer' })
                .send({ name: 'user 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'user 1 modified');
        });
    });

    describe('DELETE /:id', () => {

        let user1, user2, token1, token2;
        let _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {

            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ _id, name: 'user 1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user 2', email: 'user2@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();

            // Change de user role to admin
            await User.collection.updateOne(user1, { $set: { 'role': 'admin' } });
        });

        afterEach(async () => {
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .delete(`/api/v1/users/${_idStr}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .delete(`/api/v1/users/${_idStr}`)
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if user is not found', async () => {
            const result = await request(server)
                .delete(`/api/v1/users/${new mongoose.Types.ObjectId().toHexString()}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should delete the user', async () => {
            const result = await request(server)
                .delete(`/api/v1/users/${_idStr}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });
    });

});