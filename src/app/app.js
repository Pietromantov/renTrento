import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API  document
const APIdoc = yaml.load(path.join(__dirname, '..', 'doc', 'renTrentoAPI.yaml'));

const app= express();

app.use('/docs', swaggerUi.serve, swaggerUi.setup(APIdoc));

app.use(express.json());