import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import jwt from 'jsonwebtoken';
import Rental from '../models/rental.js';
import Product from '../models/product.js';
import User from '../models/user.js';

describe('/renTrentoAPI/rentals', () => {
    let rentalFindSpy, rentalFindOneSpy, rentalFindByIdSpy, rentalSaveSpy;
    let productFindByIdSpy;
    let userFindByIdSpy, userSaveSpy;

    const generateToken = (role, id = 'client_user_test_id') => {
        return jwt.sign({ email: 'test@mail.com', role: role, id: id }, process.env.SECRET_KEY, { expiresIn: '86400' });
    };

    const clientToken = generateToken('user', 'client_user_test_id');
    const ownerToken = generateToken('user', 'owner_user_test_id');

    // La parte di testing riguardante le date è implementata per essere eseguita in qualunque momento (indipendente dalla data attuale)
    // Questa comodità ha lo svantaggio di essere complicata dal punto di vista del codice ma estremamente utile dal punto di vista pratico
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    beforeEach(() => {
        jest.clearAllMocks();

        rentalFindSpy = jest.spyOn(Rental, 'find').mockImplementation(() => ({ exec: jest.fn() }));
        rentalFindOneSpy = jest.spyOn(Rental, 'findOne').mockImplementation(() => ({ exec: jest.fn() }));
        rentalFindByIdSpy = jest.spyOn(Rental, 'findById').mockImplementation(() => ({ exec: jest.fn() }));
        rentalSaveSpy = jest.spyOn(Rental.prototype, 'save').mockImplementation(function() { return Promise.resolve(this); });

        productFindByIdSpy = jest.spyOn(Product, 'findById').mockImplementation(() => ({ exec: jest.fn() }));

        userFindByIdSpy = jest.spyOn(User, 'findById').mockImplementation(() => ({ exec: jest.fn() }));
        userSaveSpy = jest.spyOn(User.prototype, 'save').mockImplementation(function() { return Promise.resolve(this); });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('POST / - Inizio noleggio correttamente', async () => {
        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'owner_user_test_id', productPrice: 10 })
        });
        rentalFindOneSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
        userFindByIdSpy
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'owner_user_test_id', wallet: 50, save: jest.fn() }) })
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'client_user_test_id', wallet: 50, save: jest.fn() }) });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({
                productId: 'product_test_id',
                startDate: tomorrow.toISOString(),
                endDate: dayAfterTomorrow.toISOString(),
                status: 'active'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.productId).toBe('product_test_id');
    });

    test('POST / - Inizio noleggio senza essere autenticato', async () => {
        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .send({
                productId: 'product_test_id',
                startDate: tomorrow.toISOString(),
                endDate: dayAfterTomorrow.toISOString()
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('POST / - Inizio noleggio con un productID non valido o vuoto', async () => {
        productFindByIdSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({ productId: 'invalid_product_test_id', startDate: tomorrow.toISOString(), endDate: dayAfterTomorrow.toISOString() });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Incorrect product ID');
    });

    test('POST / - Inizio noleggio di un articolo messo a noleggio da sé stessi', async () => {
        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'client_user_test_id', productPrice: 10 })
        });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({ productId: 'product_test_id', startDate: tomorrow.toISOString(), endDate: dayAfterTomorrow.toISOString() });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('This product is yours!');
    });

    test('POST / - Inizio noleggio in un periodo non valido per il noleggio', async () => {
        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'owner_user_test_id', productPrice: 10 })
        });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({ 
                productId: 'product_test_id', 
                startDate: tomorrow.toISOString(), 
                endDate: yesterday.toISOString()
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Invalid renting period');
    });

    test('POST / - Inizio noleggio in un periodo in cui è già noleggiato ad un altro utente', async () => {
        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'owner_user_test_id', productPrice: 10 })
        });
        rentalFindOneSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: 'existing_rental_test_id' }) });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({ productId: 'product_test_id', startDate: tomorrow.toISOString(), endDate: dayAfterTomorrow.toISOString() });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Product already rented in the selected period');
    });

    test('POST / - Inizio noleggio senza abbastanza fondi nel wallet', async () => {
        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'owner_user_test_id', productPrice: 1000 })
        });
        rentalFindOneSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
        userFindByIdSpy
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'owner_user_test_id', wallet: 50, save: jest.fn() }) })
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'client_user_test_id', wallet: 50, save: jest.fn() }) });

        const res = await request(app)
            .post('/renTrentoAPI/rentals')
            .set('x-access-token', clientToken)
            .send({ productId: 'product_test_id', startDate: tomorrow.toISOString(), endDate: dayAfterTomorrow.toISOString() });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Not enough money in wallet');
    });

    test('GET / - Storico articoli presi a noleggio correttamente', async () => {
        rentalFindSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue([
                { 
                    id: 'rental_test_id', 
                    productId: 'product_test_id', 
                    renterId: 'client_user_test_id',
                    clientId: 'owner_user_test_id', 
                    startDate: yesterday.toISOString(), 
                    endDate: tomorrow.toISOString(), 
                    status: 'active' 
                }
            ])
        });

        const res = await request(app)
            .get('/renTrentoAPI/rentals?renterId=client_user_test_id')
            .set('x-access-token', clientToken);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].renterId).toBe('client_user_test_id');
    });

    test('GET / - Storico articoli presi a noleggio senza autenticazione', async () => {
        const res = await request(app)
            .get('/renTrentoAPI/rentals?renterId=client_user_test_id');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('PATCH /:rentalId - Fine noleggio correttamente', async () => {
        rentalFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ 
                id: 'rental_test_id', 
                productId: 'product_test_id',
                renterId: 'owner_user_test_id', 
                clientId: 'client_user_test_id',
                startDate: yesterday.toISOString(), 
                endDate: tomorrow.toISOString(), 
                rentalPrice: 50, 
                save: jest.fn() 
            })
        });

        productFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ id: 'product_test_id', productUserId: 'owner_user_test_id', productPrice: 10 })
        });

        userFindByIdSpy
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'client_user_test_id', wallet: 100, save: jest.fn() }) })
            .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'owner_user_test_id', wallet: 50, save: jest.fn() }) });

        const res = await request(app)
            .patch('/renTrentoAPI/rentals/rental_test_id')
            .set('x-access-token', clientToken)
            .send({ status: 'finished' });

        expect(res.statusCode).toBe(200);
    });

    test('PATCH /:rentalId - Fine noleggio senza essere autenticati', async () => {
        const res = await request(app)
            .patch('/renTrentoAPI/rentals/rental_test_id')
            .send({ status: 'finished' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('No token provided.');
    });

    test('PATCH /:rentalId - Fine noleggio utilizzando un rentalID non valido o vuoto', async () => {
        rentalFindByIdSpy.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .patch('/renTrentoAPI/rentals/invalid_rental_test_id')
            .set('x-access-token', clientToken)
            .send({ status: 'finished' });

        expect(res.statusCode).toBe(404);
    });

    test('PATCH /:rentalId - Fine noleggio senza autorizzazione', async () => {
        rentalFindByIdSpy.mockReturnValue({
            exec: jest.fn().mockResolvedValue({ 
                id: 'rental_test_id', 
                renterId: 'other_user_test_id_1', 
                clientId: 'other_user_test_id_2' 
            })
        });

        const res = await request(app)
            .patch('/renTrentoAPI/rentals/rental_test_id')
            .set('x-access-token', clientToken)
            .send({ status: 'finished' });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Yuo are not allowed to do this');
    });
});