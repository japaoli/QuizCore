var models = require('../models/models.js');

//MW que permite acciones solamente si el usuario objeto
//corresponde con el usuario logeado o si es cuenta admin
exports.ownershipRequired = function(req, res, next){
	var objUser = req.user.id;
	var logUser = req.session.user.id;
	var isAdmin = req.session.user.isAdmin;

	if (isAdmin || objUser === logUser){
		next();
	} else {
		res.redirect('/');
	}
};

// Autoload :userId
exports.load = function(req, res, next, userId) {
	models.User.find({
		where: {id: Number(userId)}})
	 .then(function(user){
	 	if (user) {
	 		req.user = user;
	 		next();
	 	} else { next(new Error('No existe userId=' + userId))}
	 }
	 ).catch(function(error){next(error)});
};

//Comprobamos si el usuario esta registrado en users
// si autenticaci´on fall o hay errores se ejecuta callback(error)
exports.autenticar = function(login, password, callback){
	models.User.find({
		where: {
			username: login
		}
	}).then(function(user){
		if (user) {
			if(user.verifyPassword(password)){
				callback(null, user);
			}
			else{callback(new Error('password erroneo.')); }
	} else { callback(new Error('No existe user=' + login))}
	}).catch(function(error){callback(error)});
};

//GET /user/:id/edit
exports.edit = function(req,res){
	res.render('user/edit', {user: req.user, errors:[]});
};			//req.user: instancia de user cargada con Autoload

//PUT /user/:id
exports.update = function(req, res, next) {
	req.user.username = req.body.user.username;
	req.user.password = req.body.user.password;

	req.user
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('user/' + req.user.id, {user: req.user, errors:err.errors});
			} else {
				req.user 	//save: guarda campo username y password en la BD
				.save ( {fields: ["username","password"]})
				.then( function(){res.redirect('/');});
			}	// Redirecci´on HTTP a /
		}
	).catch(function(error){next(error)});
};

//GET /user
exports.new = function(req,res) {
	var user = models.User.build( // crea objeto user
			{username:"", password: ""}
		);
	res.render('user/new', {user: user, errors: [] });
};

// POST /user
exports.create = function(req,res){
	var user = models.User.build( req.body.user);

	user
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('user/new', {user:user, errors: err.errors});
			} else {
				user //save: guarda en Bd campos username y password de user
				.save({fields: ["username", "password"]})
				.then( function(){
					//crea la sesion con el usuario ya autenticado y redirige a /
					req.session.user = {id:user.id, username:user.username};
					res.redirect('/');
				});
			}
		}
	).catch(function(error){next(error)});
};

//DELETE /user/:id
exports.destroy = function(req, res) {
	req.user.destroy().then( function() {
		//borra la sesion y redirige a /
		delete req.session.user;
		res.redirect('/');
	}).catch(function(error){next(error)});
};

//GET /user/index
exports.index = function(req,res){
	models.User.find({where: {
			id: req.session.user.id
		}}).then(function(user){
			console.log(user);
			req.session.user.respondidas = user.dataValues.respondidas;
			req.session.user.respondidasBien = user.dataValues.respondidasBien;
			res.render('user/index',{user:req.session.user, errors: []});
		});
}