import express from 'express';
import Category from '../models/category.js';
import tokenChecker from './tokenChecker.js';

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

router.post('', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }
    if(req.loggedUser.role!='admin'){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }

    let categoryNameChecker= await Category.findOne({categoryName: req.body.categoryName}).exec();
    if(categoryNameChecker){
        res.status(400).json({error: 'This category still exists'});
        return;
    }

    let category= new Category({categoryName: req.body.categoryName});

    category = await category.save();
    
    res.status(201).json(category);
});

router.delete('/:categoryId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }
    if(req.loggedUser.role!='admin'){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }

    let category= await User.findById(req.params.categoryId).exec();

    if(!category){
        res.status(404).send()
        console.log('category not found')
        return;
    }

    await Category.deleteOne({ _id: category.id});
    console.log('category deleted');
    res.status(204).send();
})

export default router;