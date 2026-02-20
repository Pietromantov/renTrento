import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import jwt from 'jsonwebtoken';
import Product from '../models/product.js';
import Category from '../models/category.js';

describe('/renTrentoAPI/products', () => {
    let categoryFindOneSpy, productFindSpy, productFindByIdSpy, productSaveSpy;

    const generateToken = (id, role) => {
        return jwt.sign({ id: id, userName: 'testUser', role: role }, process.env.SECRET_KEY, { expiresIn: '86400' });
    };

    const userToken = generateToken('user_test_id_1', 'user');
    const otherUserToken = generateToken('user_test_id_2', 'user');
    const adminToken = generateToken('user_test_id_3', 'admin');

    beforeEach(() => {
        jest.clearAllMocks();

        categoryFindOneSpy = jest.spyOn(Category, 'findOne').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        productFindSpy = jest.spyOn(Product, 'find').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        productFindByIdSpy = jest.spyOn(Product, 'findById').mockImplementation(() => {
            return {
                exec: jest.fn()
            };
        });

        productSaveSpy = jest.spyOn(Product.prototype, 'save').mockImplementation(function() {
            return Promise.resolve(this);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('GET / - Ricerca di un articolo nel database con risultati validi', async () => {
        jest.spyOn(Product, 'find').mockReturnValue({
            exec: jest.fn().mockResolvedValue([{
                id: 'product_test_id_1',
                productName: 'Tenda',
                category: 'Montagna',
                productPrice: 30
            }])
        });

        const res = await request(app)
            .get('/renTrentoAPI/products')
            .query({ productName: 'Ten' });

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].productName).toBe('Tenda');
    });

    test('GET / - Ricerca di un articolo nel database senza ottenere risultati validi', async () => {
        jest.spyOn(Product, 'find').mockReturnValue({
            exec: jest.fn().mockResolvedValue([])
        });

        const res = await request(app)
            .get('/renTrentoAPI/products')
            .query({ productName: 'ProdottoInesistente' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('POST / - Inserimento nel sistema di un articolo correttamente', async () => {
        jest.spyOn(Category, 'findOne').mockResolvedValue({ categoryName: 'Montagna' });
        jest.spyOn(Product.prototype, 'save').mockResolvedValue({ id: 'product_test_id_1', productName: 'Tenda' });

        const res = await request(app)
            .post('/renTrentoAPI/products')
            .set('x-access-token', userToken)
            .send({ 
                productName: 'Tenda', 
                category: 'Montagna', 
                productPrice: 30 
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.productName).toBe('Tenda');
    });

    test('POST / - Inserimento nel sistema di un articolo senza autenticazione', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/products')
            .send({ 
                productName: 'Tenda', 
                category: 'Montagna', 
                productPrice: 30 
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('POST / - Inserimento nel sistema di un articolo senza specificare il nome', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/products')
            .set('x-access-token', userToken)
            .send({ 
                category: 'Montagna', 
                productPrice: 30 
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Product name required');
    });

    test('POST / - Inserimento nel sistema di un articolo senza specificare il prezzo', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/products')
            .set('x-access-token', userToken)
            .send({ 
                productName: 'Tenda', 
                category: 'Montagna' 
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Product price required');
    });

    test('POST / - Inserimento nel sistema di un articolo con una categoria non valida', async () => {
        jest.spyOn(Category, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .post('/renTrentoAPI/products')
            .set('x-access-token', userToken)
            .send({ 
                productName: 'Tenda', 
                category: 'Inesistente', 
                productPrice: 30 
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Invalid category');
    });

    test('GET /:productId - Visualizzazione di un articolo a cui è associato un productID correttamente', async () => {
        jest.spyOn(Product, 'findById').mockReturnValue({ 
            exec: jest.fn().mockResolvedValue({ 
                id: 'product_test_id_1', 
                productName: 'Casco' 
            }) 
        });

        const res = await request(app).get('/renTrentoAPI/products/product_test_id_1');

        expect(res.statusCode).toBe(200);
        expect(res.body.productName).toBe('Casco');
    });

    test('GET /:productId - Visualizzazione di un articolo a cui è associato un productID non riferito ad un prodotto', async () => {
        jest.spyOn(Product, 'findById').mockReturnValue({ 
            exec: jest.fn().mockResolvedValue(null) 
        });

        const res = await request(app).get('/renTrentoAPI/products/invalid_product_test_id');

        expect(res.statusCode).toBe(404);
    });

    test('PATCH /:productId - Modifica corretta del proprio prodotto', async () => {
        jest.spyOn(Product, 'findById').mockReturnValue({
            exec: jest.fn().mockResolvedValue({
                id: 'product_test_id_1',
                productUserId: 'user_test_id_1',
                save: jest.fn().mockResolvedValue(true)
            })
        });

        const res = await request(app)
            .patch('/renTrentoAPI/products/product_test_id_1')
            .set('x-access-token', userToken)
            .send({ productPrice: 35 });

        expect(res.statusCode).toBe(200);
    });

    test('PATCH /:productId - Modifica prodotto di un altro utente senza privilegi admin', async () => {
        jest.spyOn(Product, 'findById').mockReturnValue({
            exec: jest.fn().mockResolvedValue({
                id: 'product_test_id_1',
                productUserId: 'user_test_id_1' 
            })
        });

        const res = await request(app)
            .patch('/renTrentoAPI/products/product_test_id_1')
            .set('x-access-token', otherUserToken)
            .send({ productPrice: 15 });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Yuo are not allowed to do this');
    });

    test('DELETE /:productId - Rimozione di un prodotto correttamente', async () => {
        const mockProduct = {
            id: 'product_test_id_1',
            productUserId: 'user_test_id_1',
            deleteOne: jest.fn().mockResolvedValue({})
        };

        jest.spyOn(Product, 'findById').mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProduct)
        });

        const res = await request(app)
            .delete('/renTrentoAPI/products/product_test_id_1')
            .set('x-access-token', userToken);

        expect(res.statusCode).toBe(204);
    });

    test('DELETE /:productId - Rimozione di un prodotto di un altro utente senza privilegi admin', async () => {
        jest.spyOn(Product, 'findById').mockReturnValue({
            exec: jest.fn().mockResolvedValue({
                id: 'product_test_id_1',
                productUserId: 'user_test_id_1'
            })
        });

        const res = await request(app)
            .delete('/renTrentoAPI/products/product_test_id_1')
            .set('x-access-token', otherUserToken);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Yuo are not allowed to do this');
    });
});