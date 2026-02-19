import request from 'supertest';
import app from './app.js';

test('app module should be defined', () => {
  expect(app).toBeDefined();
});