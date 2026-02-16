import express from 'express';
import Category from '../models/category.js';

const router = express.Router();

router.get('', async function(req,res){
    let categories = await Category.find().exec();

    categories= categories.map(function(category){
        return {
            self: 'renTrentoAPI/categories' + category.id,
            categoryName: category.categoryName,
        }
    });

    res.status(200).json(categories);
})

router.post('', async function(req,res){
    let category= new Category({categoryName: req.body.categoryName});

    category = await category.save();
    
    //let categoryId = category._id;

    res.status(201).json(category);
})

export default router;