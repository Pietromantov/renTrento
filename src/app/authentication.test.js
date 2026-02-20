import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import User from '../models/user.js';

describe('/renTrentoAPI/authentication', () => {
    let userFindOneSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        userFindOneSpy = jest.spyOn(User, 'findOne').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('POST / - Login di un account in modo corretto', async () => {
        jest.spyOn(User, 'findOne').mockReturnValue({
            exec: jest.fn().mockResolvedValue({
                _id: 'user_test_id_1',
                userName: 'testUser',
                email: 'mail_test',
                password: 'password_test',
                role: 'user'
            })
        });

        const res = await request(app)
            .post('/renTrentoAPI/authentication')
            .send({ email: 'mail_test', password: 'password_test' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Authenticated');
        expect(res.body.token).toBeDefined();
    });

    test('POST / - Login di un account inserendo uno username NON registrato nel sistema o vuoto', async () => {
        jest.spyOn(User, 'findOne').mockReturnValue({
            exec: jest.fn().mockResolvedValue(null)
        });

        const res = await request(app)
            .post('/renTrentoAPI/authentication')
            .send({ email: 'mail_test_wrong', password: 'password_test' });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Authentication failed. User not found.');
    });

    test('POST / - Login di un account inserendo uno username registrato e password errata', async () => {
        jest.spyOn(User, 'findOne').mockReturnValue({
            exec: jest.fn().mockResolvedValue({
                _id: 'user_test_id_1',
                userName: 'testUser',
                email: 'mail_test',
                password: 'password_test',
                role: 'user'
            })
        });

        const res = await request(app)
            .post('/renTrentoAPI/authentication')
            .send({ email: 'mail_test', password: 'password_test_wrong' });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Authentication failed. Wrong password.');
    });
});