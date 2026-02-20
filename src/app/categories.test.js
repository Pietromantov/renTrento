import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import jwt from 'jsonwebtoken';
import category from '../models/category.js';

describe('/renTrentoAPI/categories', () => {
    let categoryFindSpy, categoryFindOneSpy, categorySaveSpy, categoryFindByIdSpy, categoryDeleteSpy;

    const generateToken = (role) => {
        return jwt.sign({ email: 'test@mail.com', role: role }, process.env.SECRET_KEY, { expiresIn: '86400' });
    };

    const adminToken = generateToken('admin');
    const userToken = generateToken('user');

    beforeEach(() => {
        jest.clearAllMocks();

        categoryFindSpy = jest.spyOn(category, 'find').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        categoryFindOneSpy = jest.spyOn(category, 'findOne').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        categoryFindByIdSpy = jest.spyOn(category, 'findById').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        categorySaveSpy = jest.spyOn(category.prototype, 'save').mockImplementation(function() {
            return Promise.resolve(this);
        });

        categoryDeleteSpy = jest.spyOn(category, 'deleteOne').mockImplementation(() => {
            return {
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
            };
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('GET / - Restituisce la lista delle categorie registrate', async () => {
        categoryFindSpy = jest.spyOn(category, 'find').mockReturnValue({
            exec: jest.fn().mockResolvedValue([{ id: '1010', categoryName: 'Categoria test' }])
        });

        const res = await request(app).get('/renTrentoAPI/categories');
        expect(res.statusCode).toBe(200);
        expect(res.body[0].categoryName).toBe('Categoria test');
    });

    test('POST / - Aggiunta di una categoria nuova correttamente', async () => {
        jest.spyOn(category, 'findOne').mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
        jest.spyOn(category.prototype, 'save').mockResolvedValue({ id: '1010', categoryName: 'Categoria test' });

        const res = await request(app)
            .post('/renTrentoAPI/categories')
            .set('x-access-token', adminToken)
            .send({ categoryName: 'Categoria test' });

        expect(res.statusCode).toBe(201);
    });

    test('POST / - Aggiunta di una categoria nuova senza autenticazione', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/categories')
            .send({ categoryName: 'Categoria test' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('POST / - Aggiunta di una categoria nuova senza autenticazione da admin', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/categories')
            .set('x-access-token', userToken)
            .send({ categoryName: 'Categoria test' });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('You are not allowed to do this'); 
    });

    test('POST / - Aggiunta di una categoria già registrata ', async () => {
        jest.spyOn(category, 'findOne').mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: '1010', categoryName: 'Categoria test' }) 
        });

        const res = await request(app)
            .post('/renTrentoAPI/categories')
            .set('x-access-token', adminToken)
            .send({ categoryName: 'Categoria test' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('This category already exists');
    });

    test('DELETE /:id - Rimozione di una categoria correttamente', async () => {
        jest.spyOn(category, 'findById').mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ id: '1' }) 
        });
        jest.spyOn(category, 'deleteOne').mockResolvedValue({});

        const res = await request(app)
            .delete('/renTrentoAPI/categories/1')
            .set('x-access-token', adminToken);

        expect(res.statusCode).toBe(204);
    });

    test('DELETE /:id - Rimozione di una categoria senza autenticazione', async () => {
        const res = await request(app)
            .delete('/renTrentoAPI/categories/1');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('DELETE /:id - Rimozione di una categoria senza autorizzazione da admin', async () => {
        const res = await request(app)
            .delete('/renTrentoAPI/categories/1')
            .set('x-access-token', userToken);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('You are not allowed to do this');
    });
    
    test('DELETE /:id - Rimozione di una categoria non registrata', async () => {
        jest.spyOn(category, 'findById').mockReturnValue({ 
            exec: jest.fn().mockResolvedValue(null) 
        });

        const res = await request(app)
            .delete('/renTrentoAPI/categories/999')
            .set('x-access-token', adminToken);

        expect(res.statusCode).toBe(404);
    });
    
});