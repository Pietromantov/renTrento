import express from 'express';
import Rental from '../models/rental.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import tokenChecker from './tokenChecker.js';

const router = express.Router();

router.get('', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }
    
    let filter = {}

    if(req.query.productId)
        filter.productId= req.query.productId;
    if(req.query.renterId)
        filter.renterId= req.query.renterId;
    if(req.query.clientId)
        filter.clientId= req.query.clientId;
    if(req.query.startDate)
        filter.startDate= req.query.startDate;
    if(req.query.endDate)
        filter.endDate= req.query.endDate;
    if(req.query.status)
        filter.status= req.query.status;

    let rentals = await Rental.find(filter).exec();

    rentals= rentals.map(function(rental){
        return {
            self: 'renTrentoAPI/rentals' + rental.id,
            productId: rental.productId,
            renterId: rental.renterId,
            clientId: rental.clientId,
            startDate: rental.startDate,
            endDate: rental.endDate,
            status: rental.status
        }
    });

    res.status(200).json(rentals);
})

router.post('', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let product= await Product.findbyId(req.body.productId).exec();
    if(!product){
        res.status(400).json({error: 'Incorrect product ID'});
        return;
    }

    let rentalChecker= await Rental.findOne({
        productId: req.body.productId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status}).exec();
    
    if(rentalChecker){
        res.status(400).json({error: 'This rental already exists'});
        return;
    }

    let rental= new Rental({
        productId: req.body.productId,
        renterId: product.renterId,
        clientId: req.loggedUser.clientId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        rentalPrice: (req.body.endDate-req.body.startDate)/(1000 * 60 * 60 * 24)*product.productPrice, //numero di giorni*prezzo al giorno
        status: req.body.status
    })

    rental = await rental.save();

    res.status(201).json(rental);
})

router.get('/:rentalId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let rental= await Rental.findById(req.params.rentalId).exec();

    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=rental.renterId && req.loggedUser.id!=rental.clientId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }

    rental= {
        self: 'renTrentoAPI/rentals' + rental.id,
        productId: rental.productId,
        renterId: rental.renterId,
        clientId: rental.clientId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalPrice: rental.rentalPrice,
        status: rental.status
    };
    
    res.status(200).json(rental);
})

router.delete('/:rentalId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let rental= await Rental.findById(req.params.rentalId).exec();

    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=rental.renterId && req.loggedUser.id!=rental.clientId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }

    await rental.deleteOne({ _id: rental.id});
    console.log('rental deleted')
    res.status(204).send()
})

router.patch('/:rentalId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let rental= await Rental.findById(req.params.rentalId).exec();

    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=rental.renterId && req.loggedUser.id!=rental.clientId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }
    
    let product= await Product.findbyId(rental.productId).exec();
    let newStartDate= rental.startDate;
    let newEndDate= rental.endDate;

    if(req.body.startDate){
        newStartDate= req.body.startDate;
        rental.startDate= req.body.startDate;
    }
    if(req.body.endDate){    
        newEndDate= req.body.endDate;
        rental.endDate= req.body.endDate;
    }
    rental.rentalPrice= (newEndDate-newStartDate)/(1000 * 60 * 60 * 24)*product.productPrice;
    if(req.body.status)
        rental.status= req.body.status;

    await rental.save();
    
    res.status(200).send();
})

export default router;