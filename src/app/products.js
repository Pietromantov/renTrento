import express from 'express';
import Product from '../models/product.js';
import Category from '../models/category.js';
import tokenChecker from './tokenChecker.js';

const router = express.Router();

router.get('', async function(req,res){
    let filter = {}

    if(req.query.productUserId)
        filter.productUserId= req.query.productUserId;
    if(req.query.productName)
        filter.productName= {$regex: req.query.productName, $options: "i"};
    if(req.query.category)
        filter.category= req.query.category;
    if(req.query.status)
        filter.status= req.query.status;

    let products = await Product.find(filter).exec();

    products= products.map(function(product){
        return {
            self: 'renTrentoAPI/products' + product.id,
            productUserId: product.productUserId,
            productUserName: product.productUserName,
            productName: product.productName,
            category: product.category,
            productPrice: product.productPrice,
            pickUpPoint: product.pickUpPoint,
            status: product.status
        }
    });

    res.status(200).json(products);
})

router.post('', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    if(!req.body.productName || req.body.productName==''){
        res.status(401).json({error: 'Product name required'});
        return;
    }

    if(!req.body.productPrice){
        res.status(401).json({error: 'Product price required'});
        return;
    }

    /*
    if(!req.body.pickUpPoint){
        res.status(401).json({error: 'Pick-up point required'});
        return;
    }*/

    let categoryChecker= await Category.findOne({categoryName: req.body.category});

    if(!categoryChecker){
        res.status(400).json({error: 'Invalid category'});
        return;
    }

    let product= new Product({
        productUserId: req.loggedUser.id,
        productUserName: req.loggedUser.userName,
        productName: req.body.productName,
        category: req.body.category,
        productInfo: req.body.productInfo,
        productPrice: req.body.productPrice,
        pickUpPoint: req.body.pickUpPoint,
        status: 'available'
    })

    product = await product.save();

    res.status(201).json(product);
})

router.get('/:productId', async function(req,res){
    let product= await Product.findById(req.params.productId).exec();
    
    if(!product){
        res.status(404).send()
        console.log('product not found')
        return;
    }
    
    product= {
        self: 'renTrentoAPI/products' + product.id,
        productUserName: product.productUserName,
        productName: product.productName,
        category: product.category,
        productInfo: product.productInfo,
        productPrice: product.productPrice,
        pickUpPoint: product.pickUpPoint,
        status: product.status
    };
    
    res.status(200).json(product);
})

router.delete('/:productId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let product= await Product.findById(req.params.productId).exec();

    if(!product){
        res.status(404).send();
        console.log('product not found');
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=product.productUserId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' });
        return;
    }
    
    await product.deleteOne({ _id: product.id});
    console.log('product deleted');
    res.status(204).send();
})

router.patch('/:productId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let product= await Product.findById(req.params.productId).exec();

    if(!product){
        res.status(404).send();
        console.log('product not found');
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=product.productUserId){
        res.status(403).json({ error: 'Yuo are not allowed to do this' });
        return;
    }
     
    if(req.body.productName)
        product.productName= req.body.productName;
    if(req.body.category){
        let categoryChecker= await Category.findOne({categoryName: req.body.category}).exec();
        if(!categoryChecker){
            res.status(400).json({error: 'Invalid category'});
            return;
        }
        product.category= req.body.category;
    }    
    if(req.body.productInfo)
        product.productInfo= req.body.productInfo;
    if(req.body.productPrice)
        product.productPrice= req.body.productPrice;
    if(req.body.pickUpPoint)
        product.pickUpPoint= req.body.pickUpPoint;
    if(req.body.status)
        product.status= req.body.status;

    await product.save();
    
    res.status(200).send();
})

export default router;