import { server } from '../../../server.js';
import request from 'supertest';
import mongoose from 'mongoose';
import DiveCenter from '../../../models/DiveCenter.js';
import Review from '../../../models/Review.js';
import User from '../../../models/User.js';

describe('reviews integration tests', () => {

    describe('GET /', () => {

        let reviews;
        let _id, _idStr;
        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ name: 'user1', email: 'email1@gmail.com', password: '123456', role: 'publisher' });
            user2 = new User({ name: 'user2', email: 'email2@gmail.com', password: '123456', role: 'publisher' });
            user3 = new User({ name: 'user3', email: 'email3@gmail.com', password: '123456', role: 'publisher' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id, name: 'dive center 1', user: user1._id }
            ]);

            reviews = [
                { title: 'review 1', diveCenter: _id, user: user1._id, rating: 5 },
                { title: 'review 2', diveCenter: _id, user: user2._id, rating: 6 },
                { title: 'review 3', diveCenter: new mongoose.Types.ObjectId(), user: user3._id, rating: 7 }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Review.deleteMany({});
            await User.deleteMany({});
        });

        it('should return all reviews of a dive center', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get(`/api/v1/diveCenters/${_idStr}/reviews`);

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 2')).toBeTruthy();
        });

        it('should return all reviews', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 3')).toBeTruthy();
        });

        it('should filter by custom field', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?title=review 1');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
        });

        it('should filter by $gt operator', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?rating[gt]=5');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'review 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 3')).toBeTruthy();
        });

        it('should filter by $gte operator', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?rating[gte]=5');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 2')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 3')).toBeTruthy();
        });

        it('should filter by $lt operator', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?rating[lt]=6');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
        });

        it('should filter by $lte operator', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?rating[lte]=6');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
            expect(result.body.data.some(g => g.title === 'review 1')).toBeTruthy();
            expect(result.body.data.some(g => g.title === 'review 2')).toBeTruthy();
        });

        it('should filter by $in operator', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?rating[in]=7');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data.some(g => g.title === 'review 3')).toBeTruthy();
        });

        it('should return only selected fields', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?select=title');

            expect(result.status).toBe(200);
            expect(result.body.data.filter(g => g.rating).length).toBe(0);
            expect(result.body.data.filter(g => g.title).length).toBeGreaterThan(0);
        });

        it('should sort results', async () => {
            reviews = [
                { title: 'c', diveCenter: _id, user: user1._id, rating: 5 },
                { title: 'b', diveCenter: _id, user: user2._id, rating: 6 },
                { title: 'a', diveCenter: new mongoose.Types.ObjectId(), user: user3._id, rating: 7 }
            ];
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?sort=title');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(3);
            expect(result.body.data[0].title).toBe('a');
            expect(result.body.data[1].title).toBe('b');
            expect(result.body.data[2].title).toBe('c');
        });

        it('should limit results', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?limit=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(2);
        });

        it('should paginate results', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get('/api/v1/reviews?limit=1&page=2');

            expect(result.status).toBe(200);
            expect(result.body.count).toBe(1);
            expect(result.body.data[0].title).toBe('review 2');
        });
    });

    describe('GET /:id', () => {

        let reviews;
        let _idDiveCenter, _id, _idStr;
        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ name: 'user1', email: 'email1@gmail.com', password: '123456', role: 'publisher' });
            user2 = new User({ name: 'user2', email: 'email2@gmail.com', password: '123456', role: 'publisher' });
            user3 = new User({ name: 'user3', email: 'email3@gmail.com', password: '123456', role: 'publisher' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user1._id }
            ]);

            reviews = [
                { _id, title: 'review 1', diveCenter: _idDiveCenter, user: user1._id, rating: 5 },
                { title: 'review 2', diveCenter: _idDiveCenter, user: user2._id, rating: 6 },
                { title: 'review 3', diveCenter: _idDiveCenter, user: user3._id, rating: 7 }
            ];
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Review.deleteMany({});
            await User.deleteMany({});
        });

        it('should return 404 if no valid id is passed', async () => {
            await Review.collection.insertMany(reviews);
            _idStr = undefined;
            const result = await request(server).get(`/api/v1/reviews/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return 404 if id does not exist', async () => {
            await Review.collection.insertMany(reviews);
            _idStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server).get(`/api/v1/reviews/${_idStr}`);

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('should return a specific course', async () => {
            await Review.collection.insertMany(reviews);
            const result = await request(server).get(`/api/v1/reviews/${_idStr}`);

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'review 1');
        });
    });

    describe('POST /', () => {

        let _idDiveCenter, _idDiveCenterStr, _id, _idStr;
        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ name: 'user1', email: 'email1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user2', email: 'email2@gmail.com', password: '123456', role: 'publisher' });
            user3 = new User({ name: 'user3', email: 'email3@gmail.com', password: '123456', role: 'publisher' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user1._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Review.deleteMany({});
            await User.deleteMany({});
        });

        it('should return 401 if token is not provided', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .send({ title: 'review 1' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return 404 if dive center is not found', async () => {
            _idDiveCenterStr = new mongoose.Types.ObjectId().toHexString();
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/DiveCenter not found/i));
        });

        it('should return 400 if mandatory fields are not provided', async () => {
            let result;

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"title" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"text" is required/i));

            result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text' });

            expect(result.status).toBe(400);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/"rating" is required/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token2, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('should return the created review', async () => {
            const result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            expect(result.status).toBe(201);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'review 1');
        });
    });

    describe('PUT /:id', () => {

        let _idDiveCenter, _idDiveCenterStr, _id, _idStr;
        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ name: 'user1', email: 'email1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user2', email: 'email2@gmail.com', password: '123456', role: 'publisher' });
            user3 = new User({ name: 'user3', email: 'email3@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user1._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Review.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .put(`/api/v1/reviews/${_idStr}`)
                .send({});

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if review is not found', async () => {
            const result = await request(server)
                .put(`/api/v1/reviews/${_idStr}`)
                .auth(token1, { type: 'bearer' })
                .send({});

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            // Change de user role to publisher
            await User.collection.updateOne(user1, { $set: { 'role': 'publisher' } });

            result = await request(server)
                .put(`/api/v1/reviews/${_id}`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the review owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            result = await request(server)
                .put(`/api/v1/reviews/${_id}`)
                .auth(token3, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return the modified review', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            result = await request(server)
                .put(`/api/v1/reviews/${_id}`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'review 1 modified');
        });

        it('Should return the modified review of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            // Make the user admin
            await User.collection.updateOne(user2, { $set: { 'role': 'admin' } });

            result = await request(server)
                .put(`/api/v1/reviews/${_id}`)
                .auth(token2, { type: 'bearer' })
                .send({ title: 'review 1 modified' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data.title', 'review 1 modified');
        });

    });

    describe('DELETE /:id', () => {

        let _idDiveCenter, _idDiveCenterStr, _id, _idStr;
        let user1, user2, user3, token1, token2, token3;

        afterAll(async () => {
            server.close();
        });

        beforeEach(async () => {
            _idDiveCenter = new mongoose.Types.ObjectId();
            _idDiveCenterStr = _idDiveCenter.toHexString();
            _id = new mongoose.Types.ObjectId();
            _idStr = _id.toHexString();

            user1 = new User({ name: 'user1', email: 'email1@gmail.com', password: '123456', role: 'user' });
            user2 = new User({ name: 'user2', email: 'email2@gmail.com', password: '123456', role: 'publisher' });
            user3 = new User({ name: 'user3', email: 'email3@gmail.com', password: '123456', role: 'user' });
            await user1.save();
            await user2.save();
            await user3.save();
            token1 = user1.getSignedJwtToken();
            token2 = user2.getSignedJwtToken();
            token3 = user3.getSignedJwtToken();

            await DiveCenter.collection.insertMany([
                { _id: _idDiveCenter, name: 'dive center 1', user: user1._id }
            ]);
        });

        afterEach(async () => {
            await DiveCenter.deleteMany({});
            await Review.deleteMany({});
            await User.deleteMany({});
        });

        it('Should return 401 if user is not logged in', async () => {
            const result = await request(server)
                .delete(`/api/v1/reviews/${_idStr}`);

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 404 if review is not found', async () => {
            const result = await request(server)
                .delete(`/api/v1/reviews/${_idStr}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(404);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not found/i));
        });

        it('Should return 403 if user role is not authorized', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            // Change de user role to publisher
            await User.collection.updateOne(user1, { $set: { 'role': 'publisher' } });

            result = await request(server)
                .delete(`/api/v1/reviews/${_id}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(403);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should return 401 if user is not the review owner', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            result = await request(server)
                .delete(`/api/v1/reviews/${_id}`)
                .auth(token3, { type: 'bearer' });

            expect(result.status).toBe(401);
            expect(result.body).toHaveProperty('success', false);
            expect(result.body).toHaveProperty('error', expect.stringMatching(/not authorized/i));
        });

        it('Should delete the review', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            result = await request(server)
                .delete(`/api/v1/reviews/${_id}`)
                .auth(token1, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

        it('Should delete the review of another user, when user is admin', async () => {
            let result = await request(server)
                .post(`/api/v1/diveCenters/${_idDiveCenterStr}/reviews`)
                .auth(token1, { type: 'bearer' })
                .send({ title: 'review 1', text: 'text', rating: 10 });

            _id = result.body.data._id;

            // Make the user admin
            await User.collection.updateOne(user2, { $set: { 'role': 'admin' } });

            result = await request(server)
                .delete(`/api/v1/reviews/${_id}`)
                .auth(token2, { type: 'bearer' });

            expect(result.status).toBe(200);
            expect(result.body).toHaveProperty('success', true);
            expect(result.body).toHaveProperty('data', {});
        });

    });

});