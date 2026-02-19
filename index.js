/*
import dns from 'node:dns';
// Forza l'uso dei server DNS di Google per risolvere i record SRV di MongoDB
dns.setServers(['8.8.8.8', '8.8.4.4']);
*/

import app from './src/app/app.js';
import mongoose from 'mongoose';
//import dotenv from 'dotenv';

const port = process.env.PORT || 8080;

app.locals.db = mongoose.connect( process.env.DB_URL )
.then ( () => {
    console.log("Connected to Database");
    
    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
})
.catch(err => console.error(err));