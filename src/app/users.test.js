import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

describe('/renTrentoAPI/users', () => {
    let userFindSpy, userFindOneSpy, userSaveSpy, userFindByIdSpy;

    const generateToken = (role, id = '1010') => {
        return jwt.sign({ email: 'test@mail.com', role: role, id: id }, process.env.SECRET_KEY, { expiresIn: '86400' });
    };

    const adminToken = generateToken('admin', 'admin_id_test');
    const userToken = generateToken('user', 'user_id_test');

    beforeEach(() => {
        jest.clearAllMocks();

        userFindSpy = jest.spyOn(User, 'find').mockImplementation(() => ({
            exec: jest.fn()
        }));

        userFindOneSpy = jest.spyOn(User, 'findOne').mockImplementation(() => ({
            exec: jest.fn()
        }));

        userFindByIdSpy = jest.spyOn(User, 'findById').mockImplementation(() => ({
            exec: jest.fn()
        }));

        userSaveSpy = jest.spyOn(User.prototype, 'save').mockImplementation(function() {
            return Promise.resolve(this);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('POST / - Creazione di un’account in modo corretto', async () => {
        userFindOneSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .post('/renTrentoAPI/users')
            .send({
                userName: 'TestUser',
                email: 'testUser@mail.com',
                password: 'testPassword',
                role: 'user'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.userName).toBe('TestUser');
    });

    test('POST / - Creazione di un’account specificando uno username già esistente', async () => {
        userFindOneSpy
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: '1010' }) });

        const res = await request(app)
            .post('/renTrentoAPI/users')
            .send({ userName: 'TestUser', email: 'testUser@mail.com', password: 'testPassword' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Username already existing');
    });

    test('POST / - Creazione di un’account specificando una email già registrata nel sistema', async () => {
        userFindOneSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: '1010' }) });

        const res = await request(app)
            .post('/renTrentoAPI/users')
            .send({ userName: 'TestUser', email: 'testUser@mail.com', password: 'testPassword' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('An account with this email address already exists');
    });

    test('POST / - Creazione di un’account specificando una email in un formato invalido', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/users')
            .send({ userName: 'TestUser', email: 'invalid-test-email', password: 'testPassword' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Invalid email format');
    });

    test('GET /me - Visualizzazione del proprio profilo correttamente', async () => {
        userFindOneSpy.mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: 'test_id', userName: 'TestUser', email: 'testUser@mail.com', wallet: 0 }) 
        });

        const res = await request(app)
            .get('/renTrentoAPI/users/me')
            .set('x-access-token', userToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.userName).toBe('TestUser');
        expect(res.body).toHaveProperty('wallet');
    });

    test('GET /me - Visualizzazione del proprio profilo senza autenticazione', async () => {
        const res = await request(app).get('/renTrentoAPI/users/me');
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('GET /:userId - Visualizzazione di un profilo di un altro utente correttamente', async () => {
        userFindByIdSpy.mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: 'test_id_other_user', userName: 'OtherTestUser', email: 'otherUserTest@mail.com' }) 
        });

        const res = await request(app).get('/renTrentoAPI/users/test_id_other_user');

        expect(res.statusCode).toBe(200);
        expect(res.body.userName).toBe('OtherTestUser');
    });

    test('GET /:userId - Visualizzazione di un profilo di un altro utente utilizzando uno userID non valido o vuoto', async () => {
        userFindByIdSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/renTrentoAPI/users/test_id');
        expect(res.statusCode).toBe(404);
    });

    test('PATCH /:userId - Modifica dati profilo correttamente', async () => {
        userFindByIdSpy.mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: 'user_id_test', save: jest.fn() }) 
        });

        const res = await request(app)
            .patch('/renTrentoAPI/users/user_id_test')
            .set('x-access-token', userToken)
            .send({ userName: 'UpdatedNameTest' });

        expect(res.statusCode).toBe(200);
    });

    test('PATCH /:userId - Modifica dati profilo senza essere autenticati', async () => {
        const res = await request(app).patch('/renTrentoAPI/users/test_id');
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('PATCH /:userId - Modifica dati profilo con uno userID non valido', async () => {
        userFindByIdSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .patch('/renTrentoAPI/users/test_id')
            .set('x-access-token', adminToken);

        expect(res.statusCode).toBe(404);
    });

    test('PATCH /:userId - Modifica dati profilo senza autorizzazione', async () => {
        userFindByIdSpy.mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: 'test_id' })
        });

        const res = await request(app)
            .patch('/renTrentoAPI/users/test_id')
            .set('x-access-token', userToken);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('You are not allowed to do this');
    });
});