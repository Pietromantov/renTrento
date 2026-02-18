import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import users from './users.js';
import products from './products.js';
import rentals from './rentals.js';
import categories from './categories.js';
import authentication from './authentication.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// caricare documento API 
const APIdoc = yaml.load(path.join(__dirname, '..', 'doc', 'renTrentoAPI.yaml'));

//creazione app
const app= express();

//parser
app.use(express.json());

//aggiungere frontend

//usa documento API
app.use('/APIdocs', swaggerUi.serve, swaggerUi.setup(APIdoc));

app.use((req,res,next) => {
    console.log(req.method + ' ' + req.url)
    next()
})

//authentication routing
app.use('/renTrentoAPI/authentication',authentication);

//routing risorse
app.use('/renTrentoAPI/users',users);
app.use('/renTrentoAPI/products',products);
app.use('/renTrentoAPI/rentals',rentals);
app.use('/renTrentoAPI/categories',categories);

// Default 404 handler
app.use((req, res) => {
    res.status(404);
    res.json({ error: 'Not found' });
});

// Default 500 handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something did not work' });
});

export default app;