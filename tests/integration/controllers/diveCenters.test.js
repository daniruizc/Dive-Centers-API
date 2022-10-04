import fs from 'fs';
import { server } from '../../../server.js';
import request from 'supertest';
import mongoose from 'mongoose';
import DiveCenter from '../../../models/DiveCenter.js';
import User from '../../../models/User.js';

describe('diveCenters integration tests', () => {

    describe('Route not found', () => {

        it('should return 404 if route is not found', async () => {
            const result = await request(server).get('/api/v1/diveCenters/notfound/notfound');

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });
    });

    describe('GET /', () => {

        let diveCenters;

        afterAll(async () => {
            server.close();
        });

        beforeEach(() => {
            diveCenters = [
                { name: 'dive center 1', averageCost: 100 },
                { name: 'dive center 2', averageCost: 200 },
                { name: 'dive center 3', averageCost: 300 }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
        });

        it('should return all dive centers', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.name === 'dive center 1')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 2')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 3')).toBeTruthy();
        });

        it('should filter by custom field', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?name=dive center 1');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.name === 'dive center 1')).toBeTruthy();
        });

        it('should filter by $gt operator', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?averageCost[gt]=100');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.name === 'dive center 2')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 3')).toBeTruthy();
        });

        it('should filter by $gte operator', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?averageCost[gte]=100');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.name === 'dive center 1')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 2')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 3')).toBeTruthy();
        });

        it('should filter by $lt operator', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?averageCost[lt]=200');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.name === 'dive center 1')).toBeTruthy();
        });

        it('should filter by $lte operator', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?averageCost[lte]=200');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.name === 'dive center 1')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center 2')).toBeTruthy();
        });

        it('should filter by $in operator', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?averageCost[in]=300');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.name === 'dive center 3')).toBeTruthy();
        });

        it('should return only selected fields', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?select=name');

            expect(result.status).toBe(200);
            expect(result.body.data.filter(g => g.averageCost).length).toBe(0);
            expect(result.body.data.filter(g => g.name).length).toBeGreaterThan(0);
        });

        it('should sort results', async () => {
            diveCenters = [
                { name: 'c' },
                { name: 'b' },
                { name: 'a' }
            ];
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?sort=name');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data[0].name).toBe('a');
            expect(result.body.data[1].name).toBe('b');
            expect(result.body.data[2].name).toBe('c');
        });

        it('should limit results', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?limit=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
        });

        it('should paginate results', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get('/api/v1/diveCenters?limit=1&page=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data[0].name).toBe('dive center 2');
        });
    });

    describe('GET /:id', () => {

        let diveCenters;
        let _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(() => {
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            diveCenters = [
                { name: 'dive center 1' },
                { _id, name: 'dive center 2' }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
        });

        it('should return 404 if no valid id is passed', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            _idStr = undefined;
            const result = await request(server).get(`/api/v1/diveCenters/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return 404 if id does not exist', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            _idStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server).get(`/api/v1/diveCenters/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return a specific dive center', async () => {
            await DiveCenter.collection.insertMany(diveCenters);
            const result = await request(server).get(`/api/v1/diveCenters/${_idStr}`);

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'dive center 2');
        });
    });

    describe('POST /', () => {

        let _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await User.deleteMany({});
        });

        it('should return 401 if token is not provided', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters`)
                .send({ name: 'dive center 1' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 400 if mandatory fields are not provided', async () => {
            let result;

            result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"name" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"description" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"address" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"specialties" is required/i));
        });

        it('should return 400 if user has already published a diveCenter', async () => {
            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            const result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 2', description: 'desc', address: 'address', specialties: ['a'] });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/already published/i));
        });

        it('should return 403 if user role is not authorized', async () => {
            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            token = user.getSignedJwtToken();

            const result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 400 if duplicate field is entered', async () => {
            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            // Change de user role to admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            const result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/duplicate field/i));
        });

        it('should return the created diveCenter', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            expect(result.status).toBe(201);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'dive center 1');
        });
    });

    describe('PUT /:id', () => {

        let _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .send({});

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if diveCenter is not found', async () => {
            const result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            // Change de user role to user
            await User.collection.updateOne(user, { $set: { 'role': 'user' } });

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the diveCenter\'s owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return the modified diveCenter', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'dive center 1 modified');
        });

        it('Should return the modified diveCenter of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            // Make the user admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.name', 'dive center 1 modified');
        });

    });

    describe('DELETE /:id', () => {

        let _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if diveCenter is not found', async () => {
            const result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            // Change de user role to user
            await User.collection.updateOne(user, { $set: { 'role': 'user' } });

            result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the diveCenter\'s owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should delete the diveCenter', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

        it('Should delete the diveCenter of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            // Make the user admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            result = await request(server)
                .delete(`/api/v1/diveCenters/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

    });

    describe('GET /radius/:address/:distance', () => {

        afterAll(async () => {
            server.close();
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return diveCenters by address and distance', async () => {
            const user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            const token = user.getSignedJwtToken();

            // Make the user admin to let it create more than one dive center
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center Barcelona', description: 'desc', address: 'Barcelona', specialties: ['a'] });

            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center Tarragona', description: 'desc', address: 'Tarragona', specialties: ['a'] });

            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center Gerona', description: 'desc', address: 'Gerona', specialties: ['a'] });

            await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center Madrid', description: 'desc', address: 'Madrid', specialties: ['a'] });

            const result = await request(server)
                .get(`/api/v1/diveCenters/radius/Barcelona/100`);

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body.data.some(g => g.name === 'dive center Barcelona')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center Tarragona')).toBeTruthy();
            expect(result.body.data.some(g => g.name === 'dive center Gerona')).toBeTruthy();
        });

    });

    describe('PUT /:id/photo', () => {

        let _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if diveCenter is not found', async () => {
            const result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            // Change de user role to user
            await User.collection.updateOne(user, { $set: { 'role': 'user' } });

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the diveCenter\'s owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 400 if no file is present', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/upload a file/i));
        });

        it('Should return 400 if file is not an image', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;
            const filename = 'file.txt';

            fs.writeFileSync(`./${filename}`, 'some text here');

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' })
                .attach('file', `./${filename}`);

            fs.unlinkSync(`./${filename}`);

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/upload an image file/i));
        });

        it('Should return 400 if file is greater than permitted', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;
            const filename = 'file.png';

            fs.writeFileSync(`./${filename}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+L+U4T8ABu8CpCYJ1DQAAAAASUVORK5CYII=');

            // Modify max file size to make it fail
            let maxFileUpload = process.env.MAX_FILE_UPLOAD;
            process.env.MAX_FILE_UPLOAD = 0;

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' })
                .attach('file', `./${filename}`);

            fs.unlinkSync(`./${filename}`);

            // Restore value
            process.env.MAX_FILE_UPLOAD = maxFileUpload;

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/upload an imagen less than/i));
        });

        it('Should return 500 if upload fail for some reason', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;
            const filename = 'file.png';

            fs.writeFileSync(`./${filename}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+L+U4T8ABu8CpCYJ1DQAAAAASUVORK5CYII=');

            // Modify max file size to make it fail
            let fileUploadPath = process.env.FILE_UPLOAD_PATH;
            process.env.FILE_UPLOAD_PATH = 'invalid-path';

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' })
                .attach('file', `./${filename}`);

            fs.unlinkSync(`./${filename}`);

            // Restore value
            process.env.FILE_UPLOAD_PATH = fileUploadPath;

            expect(result.status).toBe(500);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/Problem with file upload/i));
        });

        it('Should upload the photo', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;
            const filename = 'file.png';

            fs.writeFileSync(`./${filename}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+L+U4T8ABu8CpCYJ1DQAAAAASUVORK5CYII=');

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' })
                .attach('file', `./${filename}`);

            fs.unlinkSync(`./${filename}`);

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', expect.stringMatching(/.png/));

            if (fs.existsSync(`./public/uploads/${result.body.data}`)) {
                fs.unlinkSync(`./public/uploads/${result.body.data}`);
            }
        });

        it('Should upload the photo of another users\'s diveCenter, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters`)
                .auth(token, { type: 'bearer' })
                .send({ name: 'dive center 1', description: 'desc', address: 'address', specialties: ['a'] });

            _id = result.body.data.id;
            const filename = 'file.png';

            fs.writeFileSync(`./${filename}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+L+U4T8ABu8CpCYJ1DQAAAAASUVORK5CYII=');

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            // Make the user admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            result = await request(server)
                .put(`/api/v1/diveCenters/${_id}/photo`)
                .auth(token, { type: 'bearer' })
                .attach('file', `./${filename}`);

            fs.unlinkSync(`./${filename}`);

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', expect.stringMatching(/.png/));

            if (fs.existsSync(`./public/uploads/${result.body.data}`)) {
                fs.unlinkSync(`./public/uploads/${result.body.data}`);
            }
        });

    });

});