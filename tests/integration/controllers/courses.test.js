import { server } from '../../../server.js';
import request from 'supertest';
import mongoose from 'mongoose';
import DiveCenter from '../../../models/DiveCenter.js';
import Course from '../../../models/Course.js';
import User from '../../../models/User.js';

describe('courses integration tests', () => {

    describe('GET /', () => {

        let courses;
        let _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            await DiveCenter.collection.insertMany([
                { _id, name: 'dive center 1' }
            ]);

            courses = [
                { title: 'course 1', diveCenter: _id, price: 100 },
                { title: 'course 2', diveCenter: _id, price: 200 },
                { title: 'course 3', diveCenter: new mongoose.Types.ObjectId(), price: 300 }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Course.deleteMany({});
        });

        it('should return all courses of a dive center', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get(`/api/v1/diveCenters/${_idStr}/courses`);

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 2')).toBeTruthy();
        });

        it('should return all courses', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 3')).toBeTruthy();
        });

        it('should filter by custom field', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?title=course 1');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
        });

        it('should filter by $gt operator', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?price[gt]=100');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'course 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 3')).toBeTruthy();
        });

        it('should filter by $gte operator', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?price[gte]=100');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 3')).toBeTruthy();
        });

        it('should filter by $lt operator', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?price[lt]=200');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
        });

        it('should filter by $lte operator', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?price[lte]=200');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'course 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'course 2')).toBeTruthy();
        });

        it('should filter by $in operator', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?price[in]=300');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'course 3')).toBeTruthy();
        });

        it('should return only selected fields', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?select=title');

            expect(result.status).toBe(200);
            expect(result.body.data.filter(g => g.price).length).toBe(0);
            expect(result.body.data.filter(g => g.title).length).toBeGreaterThan(0);
        });

        it('should sort results', async () => {
            courses = [
                { title: 'c' },
                { title: 'b' },
                { title: 'a' }
            ];
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?sort=title');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data[0].title).toBe('a');
            expect(result.body.data[1].title).toBe('b');
            expect(result.body.data[2].title).toBe('c');
        });

        it('should limit results', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?limit=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
        });

        it('should paginate results', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get('/api/v1/courses?limit=1&page=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data[0].title).toBe('course 2');
        });
    });

    describe('GET /:id', () => {

        let courses;
        let _idDiveCenter, _id, _idStr;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1' }
            ]);

            courses = [
                { _id, title: 'course 1', diveCenter: _idDiveCenter },
                { title: 'course 2', diveCenter: _idDiveCenter },
                { title: 'course 3', diveCenter: new mongoose.Types.ObjectId() }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Course.deleteMany({});
        });

        it('should return 404 if no valid id is passed', async () => {
            await Course.collection.insertMany(courses);
            _idStr = undefined;
            const result = await request(server).get(`/api/v1/courses/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return 404 if id does not exist', async () => {
            await Course.collection.insertMany(courses);
            _idStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server).get(`/api/v1/courses/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return a specific course', async () => {
            await Course.collection.insertMany(courses);
            const result = await request(server).get(`/api/v1/courses/${_idStr}`);

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'course 1');
        });
    });

    describe('POST /', () => {

        let _idDiveCenter, _idDiveCenterStr, _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Course.deleteMany({});
            await User.deleteMany({});
        });

        it('should return 401 if token is not provided', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .send({ title: 'course 1' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 404 if dive center is not found', async () => {
            _idDiveCenterStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/DiveCenter not found/i));
        });

        it('should return 400 if mandatory fields are not provided', async () => {
            let result;

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"title" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"description" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"days" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"price" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"minimumSkill" is required/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'user' });
            await user.save();
            token = user.getSignedJwtToken();

            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the course owner', async () => {
            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return the created course', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(201);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'course 1');
        });
    });

    describe('PUT /:id', () => {

        let _idDiveCenter, _idDiveCenterStr, _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Course.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .send({});

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if course is not found', async () => {
            const result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            // Change de user role to user
            await User.collection.updateOne(user, { $set: { 'role': 'user' } });

            result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the course owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return the modified course', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'course 1 modified');
        });

        it('Should return the modified course of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            // Make the user admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            result = await request(server)
                .put(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'course 1 modified');
        });

    });

    describe('DELETE /:id', () => {

        let _idDiveCenter, _idDiveCenterStr, _id;
        let user, token;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId().toHexString();

            user = new User({ name: 'user1', email: 'email@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Course.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .delete(`/api/v1/courses/${_id}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if course is not found', async () => {
            const result = await request(server)
                .delete(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            // Change de user role to user
            await User.collection.updateOne(user, { $set: { 'role': 'user' } });

            result = await request(server)
                .delete(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the course owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            result = await request(server)
                .delete(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should delete the course', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            result = await request(server)
                .delete(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

        it('Should delete the course of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/courses`)
                .auth(token, { type: 'bearer' })
                .send({ title: 'course 1', description: 'desc', days: '1', price: '1', minimumSkill: 'beginner' });

            _id = result.body.data._id;

            user = new User({ name: 'user1', email: 'user1@gmail.com', password: '123456', role: 'publisher' });
            await user.save();
            token = user.getSignedJwtToken();

            // Make the user admin
            await User.collection.updateOne(user, { $set: { 'role': 'admin' } });

            result = await request(server)
                .delete(`/api/v1/courses/${_id}`)
                .auth(token, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

    });

});