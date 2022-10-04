import 'dotenv/config';
import { jest } from '@jest/globals';
jest.setTimeout(20000);

describe('server integration tests', () => {
    describe('Initialize server', () => {

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('Should open API at port 5000 if PORT env is not defined', async () => {

            const logSpy = jest.spyOn(console, 'log');

            const PORT = process.env.PORT;
            delete process.env.PORT;

            const { server } = await import('../../server.js');
            server.close();

            process.env.PORT = PORT;

            expect(logSpy.mock.calls.filter(v => v[0].match(/port 5000/i))).toEqual(
                [[expect.stringMatching(/port 5000/i)]]
            );

        });
    })
});