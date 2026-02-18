import jwt from 'jsonwebtoken';

const tokenChecker = function(req, res, next) {
	var token = req.query.token || req.headers['x-access-token'];
	console.log('tokenchecker= ',token); //da togliere
	if (!token) {
		return res.status(401).send({ 
			success: false,
			message: 'No token provided.'
		});
	}

	jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {			
		console.log('decoded= ',decoded); //da togliere
		if(err){
			console.log('errore: ',err); //ad togliere
			return res.status(403).send({
				success: false,
				message: 'Failed to authenticate token.'
			});		
		}
        else{
			console.log('token verificato'); //da togliere
			req.loggedUser = decoded;
			next();
		}
	});
	
};

export default tokenChecker;