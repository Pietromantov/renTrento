import express from 'express';
import User from '../models/user.js';
import tokenChecker from './tokenChecker.js';

const router = express.Router();

router.get('/me', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let user= await User.findOne({email: req.loggedUser.email}).exec();

    user= {
            self: 'renTrentoAPI/users' + user.id,
            userName: user.userName,
            email: user.email,
            wallet: user.wallet
        }
    
    res.status(200).json(user);
})

router.get('', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }
    if(req.loggedUser.role!='admin'){
        res.status(403).json({error: 'Yuo are not allowed to do this' })
        return;
    }
    
    let users = await User.find().exec();

    users= users.map(function(user){
        return {
            self: 'renTrentoAPI/users' + user.id,
            userName: user.userName,
            email: user.email
        }
    });

    res.status(200).json(users);
})

router.post('', async function(req,res){
    let user= new User({
        userName: req.body.userName,
        role: req.body.role,
        email: req.body.email,
        password: req.body.password,
        wallet: 0.0
    })

    if (!user.email || typeof user.email != 'string') {  //eventualmente aggiungere controllo sul formato
        res.status(400).json({ error: 'Invalid email format' });
        return;
    }

    user = await user.save();

    res.status(201).json(user);
})

router.get('/:userId', async function(req,res){
    let user= await User.findById(req.params.userId).exec();
    if(!user){
        res.status(404).send()
        console.log('user not found')
        return;
    }
    user= {
        self: 'renTrentoAPI/users' + user.id,
        userName: user.userName,
        email: user.email
    };
    
    res.status(200).json(user);
})

router.delete('/:userId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let user= await User.findById(req.params.userId).exec();

    if(!user){
        res.status(404).send();
        console.log('user not found');
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=user.id){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }

    await User.deleteOne({ _id: user.id});
    console.log('account deleted')
    res.status(204).send();
})

router.patch('/:userId', tokenChecker, async function(req,res){
    if(!req.loggedUser){
        res.status(401).json({error: 'You are not authenticated'});
        return;
    }

    let user= await User.findById(req.params.userId).exec();

    if(!user){
        res.status(404).send()
        console.log('user not found')
        return;
    }
    
    if(req.loggedUser.role!='admin' && req.loggedUser.id!=user.id){
        res.status(403).json({ error: 'Yuo are not allowed to do this' })
        return;
    }
    
    if(req.body.userName)
        user.userName= req.body.userName;
    if(req.body.role)    
        user.role= req.body.role;
    if(req.body.email)
        user.email= req.body.email;
    if(req.body.password)
        user.password= req.body.password;
    if(req.body.wallet)
        user.wallet= req.body.wallet;

    await user.save();
    
    res.status(200).send();
})

export default router;