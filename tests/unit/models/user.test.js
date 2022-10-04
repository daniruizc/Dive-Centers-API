import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../../models/User.js';

describe('User unit tests', () => {

    let _id;
    beforeEach(() => {
        _id = new mongoose.Types.ObjectId().toHexString();
    });

    describe('user.getSignedJwtToken', () => {
        it('should return a valid JWT', () => {
            const user = new User({ _id });
            const token = user.getSignedJwtToken();
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            expect(decoded.id).toBe(_id);
        });
    });

    describe('user.matchPassword', () => {

        let salt, password;
        beforeEach(async () => {
            salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash('12345', salt);
        });

        it('should be true if both passwords match', async () => {
            const user = new User({ _id, password });

            const result = await user.matchPassword('12345');

            expect(result).toBeTruthy();
        });

        it('should be false if passwords does not match', async () => {
            const user = new User({ _id, password });

            const result = await user.matchPassword('123456');

            expect(result).toBeFalsy();
        })
    });
});



