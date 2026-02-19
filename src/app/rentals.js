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

    let product= await Product.findById(req.body.productId).exec();
    
    
    if(!product){
        res.status(400).json({error: 'Incorrect product ID'});
        return;
    }

    if(product.productUserId==req.loggedUser.id){
        res.status(400).json({error: 'This product is yours!'});
        return;
    }
    
    if((new Date(req.body.startDate))>=(new Date(req.body.endDate)) || (new Date(req.body.startDate))<(new Date())){
        res.status(400).json({error: 'Invalid renting period'});
        return;
    }

    let dateChecker= await Rental.findOne({
        productId: req.body.productId,
        startDate: {$gte: req.body.startDate, $lte: req.body.endDate},
    }).exec();
    
    if(dateChecker){
        res.status(400).json({error: 'Product already rented in the selected period'});
        return;
    }

    let price= (new Date(req.body.endDate)-new Date(req.body.startDate))/(1000 * 60 * 60 * 24)*product.productPrice; //numero di giorni*prezzo al giorno
    let renter= await User.findById(product.productUserId).exec();
    let client= await User.findById(req.loggedUser.id).exec();

    if(price>client.wallet){
        res.status(400).json({error: 'Not enough money in wallet'});
        return;
    }

    let rental= new Rental({
        productId: product.id,
        renterId: renter.id,
        clientId: client.id,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        rentalPrice: price,
        status: req.body.status
    })

    renter.wallet+= price;
    client.wallet-= price;

    rental = await rental.save();
    renter = await renter.save();
    client = await client.save();

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
    
    if(req.loggedUser.id!=rental.renterId && req.loggedUser.id!=rental.clientId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }
    
    let product= await Product.findById(rental.productId).exec();
    let renter= await User.findById(req.loggedUser.id).exec();
    let client= await User.findById(product.productUserId).exec();
    let newStartDate;
    let newEndDate;

    if(req.body.startDate)
        newStartDate= req.body.startDate;
    else
        newStartDate= rental.startDate;
    if(req.body.endDate)
        newEndDate= req.body.endDate;
    else
        newEndDate= rental.endDate;
    
    let newPrice= (new Date(newEndDate)-new Date(newStartDate))/(1000 * 60 * 60 * 24)*product.productPrice;
    let diff= newPrice-rental.rentalPrice;
    if(diff>client.wallet){
        res.status(400).json({error: 'Not enough money in wallet'});
        return;
    }
    
    rental.startDate= newStartDate;
    rental.endDate= newEndDate;
    rental.rentalPrice= newPrice
    if(req.body.status)
        rental.status= req.body.status;

    renter.wallet+= diff;
    client.wallet-= diff;

    await rental.save();
    await renter.save();
    await client.save();
    
    res.status(200).send();
})

export default router;