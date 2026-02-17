import express from 'express';
import Product from '../models/product.js';

const router = express.Router();

router.get('', async function(req,res){
    let filter = {}

    if(req.query.productUserId)
        filter.productUserId= req.query.productUserId;
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
            status: product.status
        }
    });

    res.status(200).json(products);
})

router.post('', async function(req,res){
    let product= new Product({
        productUserId: req.body.productUserId,
        productUserName: req.body.productUserName,
        productName: req.body.productName,
        category: req.body.category,
        productInfo: req.body.productInfo,
        productPrice: req.body.productPrice,
        status: req.body.status
    })

    product = await product.save();
    
    //let productId = product._id;

    res.status(201).json(product);
})

/*router.use('/:productId', async function(req,res,next){
    let product= await product.findById(req.params.productId).exec();
    if(!product){
        res.status(404).send()
        console.log('product not found')
        return;
    }
    req['product'] = product;
    next();
})*/

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
        status: product.status
    };
    
    res.status(200).json(product);
})

router.delete('/:productId', async function(req,res){
    let product= await product.findById(req.params.productId).exec();
    if(!product){
        res.status(404).send()
        console.log('product not found')
        return;
    }
    await product.deleteOne({ _id: product.id});
    console.log('product deleted')
    res.status(204).send()
})

router.patch('/:productId', async function(req,res){
    let product= await product.findById(req.params.productId).exec();
    /*if(!product){
        res.status(404).send()
        console.log('product not found')
        return;
    }*/ 
    if(req.body.productName)
        product.productName= req.body.productName;
    if(req.body.category)
        product.category= req.body.category;    
    if(req.body.productInfo)
        product.productInfo= req.body.productInfo;
    if(req.body.productPrice)
        product.productPrice= req.body.productPrice;
    if(req.body.status)
        product.status= req.body.status;

    await product.save();
    
    res.status(200).send();
})

export default router;