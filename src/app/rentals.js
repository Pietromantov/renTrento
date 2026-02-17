import express from 'express';
import Rental from '../models/rental.js';

const router = express.Router();

router.get('', async function(req,res){
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
            rentalPrice: rental.rentalPrice,
            status: rental.status
        }
    });

    res.status(200).json(rentals);
})

router.post('', async function(req,res){
    let rental= new Rental({
        productId: req.body.productId,
        renterId: req.body.renterId,
        clientId: req.body.clientId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        rentalPrice: req.body.rentalPrice,
        status: req.body.status
    })

    rental = await rental.save();
    
    //let rentalId = rental._id;

    res.status(201).json(rental);
})

/*router.use('/:rentalId', async function(req,res,next){
    let rental= await Rental.findById(req.params.rentalId).exec();
    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    req['rental'] = rental;
    next();
})*/

router.get('/:rentalId', async function(req,res){
    let rental= await Rental.findById(req.params.rentalId).exec();
    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    rental= {
        self: 'renTrentoAPI/rentals' + rental.id,
        productId: req.body.productId,
        renterId: req.body.renterId,
        clientId: req.body.clientId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        rentalPrice: req.body.rentalPrice,
        status: req.body.status
    };
    
    res.status(200).json(rental);
})

router.delete('/:rentalId', async function(req,res){
    let rental= await Rental.findById(req.params.rentalId).exec();
    if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }
    await rental.deleteOne({ _id: rental.id});
    console.log('account deleted')
    res.status(204).send()
})

router.patch('/:rentalId', async function(req,res){
    let rental= await Rental.findById(req.params.rentalId).exec();
    /*if(!rental){
        res.status(404).send()
        console.log('rental not found')
        return;
    }*/
    if(req.body.startDate)
        rental.startDate= req.body.startDate;
    if(req.body.endDate)    
        rental.endDate= req.body.endDate;
    if(req.body.rentalPrice)
        rental.rentalPrice= req.body.rentalPrice;
    if(req.body.status)
        rental.status= req.body.status;

    await rental.save();
    
    res.status(200).send();
})

export default router;