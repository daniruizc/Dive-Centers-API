import 'dotenv/config';
import colors from 'colors';
import { jest } from '@jest/globals';

describe('config db unit tests', () => {
    describe('Initialize db', () => {

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('Should open production DB', async () => {

            const logSpy = jest.spyOn(console, 'log');

            const NODE_ENV = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const { default: loadDB } = await import('../../../config/db.js');
            await loadDB();

            process.env.NODE_ENV = NODE_ENV;

            expect(logSpy.mock.calls.filter(v => v[0].match(/divecenters/i))).toEqual(
                [[expect.stringMatching(/divecenters/i)]]
            );
            expect(logSpy.mock.calls.filter(v => v[0].match(/divecenters/i))).not.toEqual(
                [[expect.stringMatching(/divecenters_test/i)]]
            );

        });
    })
});