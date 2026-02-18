import express from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const router= express.Router();

//aggiungere autenticazione con google

router.post('', async function(req,res){
    let user= await User.findOne({email: req.body.email}).exec();
    
    if (!user) {
		res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
		return;
	}
	
	if (user.password != req.body.password) {
        res.status(401).json({ success: false, message: 'Authentication failed. Wrong password.' });
        return;
    }

    var payload = {
        id: user._id,
        userName: user.userName,
        role: user.role,
		email: user.email	
	}
	var options = {
		expiresIn: 10800 // 3 ore
	}
	var token = jwt.sign(payload, process.env.SECRET_KEY, options);
	
	console.log(token); //da togliere

	res.json({
		success: true,
		message: 'Authenticated',
		token: token,
        id: user._id,
		email: user.email,
		self: "renTrento" + user._id
	});
});

export default router;