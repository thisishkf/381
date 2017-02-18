/*************************************************************************
**	Author			: 	Ho Kin Fai														**
**	Last Modified	:	28-11-2016 11:50												**
**	Version			:	0.1.3/sam														**
**	Changes			:	apiCreate														**
*************************************************************************/
var http = require('http');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://user:123@ds159998.mlab.com:59998/fyp';
var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('cookie-session');

var haversine = require('haversine');
//customized function
var func = require('./function.js');
var data = require('./data.js');
var weatherAPI = require('./schedulingJob.js');
//on-trail function

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(fileUpload());
app.use(session({cookieName: 'session',keys: ['IT9']}));

//login
//api: -d'name="abc"&pw="123"'
app.post('/login',function(req,res) {
	var name = req.body.name;
	var pw = req.body.pw;	
	var criteria = {"Name" : name};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
			if(result == null){
				res.end("Invalid User Name!");
			}//no user
			else if(result.Name == user && result.Password == pw && !result.Active){
				res.end('valid');
				func.loginUser(db,result.ID,true);
			}else{
				res.end('Invalid Request');
			}
		db.close();
		});
	});
});

//logout
app.post('/logout',function(req,res) {
	var user = req.body.name;
	var criteria = {"Name" : user};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
			if(result == null){
				res.end("Invalid User Name!");
			}//no user
			else if(!result.Active){
				res.end('Invalid Request');
			}
			else{		
				res.end('valid');
				func.loginUser(db,result.ID,false);
			}
		db.close();
		});
	});
});
/*******************user*********************/
//createUser
//test
//api: curl -H 'Content-Type:application/JSON' -d '{"doc" : {"name" : "Sam Ho"}}' -X POST http://localhost:8090/create/user

app.post('/create/user',function(req,res){
	console.log(req.body);
	var criteria  ={"name" : doc.name};
	var doc = {"name" : doc.name, "password" : doc.password, "info" : null, "active" : false, "status" : "offline" , "location" : {"lat" : 0, " lon" : 0}};
console.log(criteria);
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
			if(result == null){
				func.createUser(db,doc,function(){
					res.send("ok");
				});
			}
			else{
				res.end("User Name is alerady Exisit");
			}
			db.close();
		});
	});
});
//get user information
//tested
//api =curl -d 'name=sam' -X POST http://localhost:8090/read/user/info
app.post('/read/user/info',function(req,res){
	var name = req.body.name;
	var criteria = {"Name" : name};
	console.log(criteria);
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
console.log(result);
			if(result == null || !result.Active){
				res.end("Invalud Request");
			}
			else{
				func.getUserInfo(res,db,criteria);
			}
			db.close();
		});
	});
})
//update user information
app.post('/update/user/info',function(req,res){
	var doc = req.body.doc;
	var criteria = {"Name" : doc.name};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
			if(!result.Active){
				res.end("Invalud Request");
			}
			else{
				func.updateUserInfo(db,name,function(updateResult){
					res.end(updateResult);
				})
			}
			db.close();
		});
	});
})



/*******************district*********************/
//create attraction
//tested
app.post('/admin/create/attraction',function(req,res){
	var doc = {"site" : 
							{"title" : req.body.title, 
							"location":{"lon" : req.body.lon, 
													"lat" : req.body.lat
													},  
							"description" : req.body.des,
							"promotion" : null,
							"comment" : []}
						};
	var criteria = {"_id" : ObjectId(req.body.district)};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.addDistrict(db,criteria,doc,function(result){
			res.send(result);
			db.close();
		});
	});//end db
})

//add comment
//tested
//api : curl -X POST -H "Content-Type:application/JSON" -d '{"doc":{"dis" : "588577f3734d1d75e11a7695","title":"Ma On Shan", "content" : "new test","user" : "sam"}}' localhost:8090/api/create/comment
app.post('/api/create/comment',function(req,res){
	var income = req.body.doc;
	var dis = income.dis;
	var title = income.title;
	var doc = {	"site.$.comment" :{
									"content" : income.content,
									"user"		:	income.user,
									"date/Time": Date()
									}
						};
	var criteria = {"_id" : ObjectId(dis), "site" : {$elemMatch : {"title" : title}}};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.addDistrictComment(db,criteria,doc,function(result){
			res.send(result);
			db.close();
		});
	});//end db
})

//read districtList
//testes
app.get('/api/read/districtList',function(req,res){
	var output = [];
	for(eachDistrict of data.dis){	
			output.push(eachDistrict.name);
	}
	res.send(output);
})

//read siteList
//testes
app.get('/api/read/siteList',function(req,res){
	var output = [];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				output.push(eachSite.title);
			}
		}
	}
	res.send(output);
})

//read one site
//tested
app.get('/api/read/siteList/:name',function(req,res){
	var name = req.params.name;
	var output = [];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(name == eachSite.title){
					output.push(eachSite);
				}
			}
		}
	}
	if(output.length <1)
		res.send("No result");
	else	
		res.send(output);
})

//read one district
//tested
app.get('/api/read/districtList/:district',function(req,res){
	var district = req.params.district;
	var output = [];
	for(eachDistrict of data.dis){	
		if(eachDistrict.name ==district){
			output.push(eachDistrict);
		}
	}
	if(output.length <1)
		res.send("No result");
	else	
		res.send(output);
})

//read comment
//tested
app.get('/api/read/:site/comment',function(req,res){
	var site = req.params.site;
	var output = [];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(eachSite.title == site && eachSite.comment != undefined){
					for(eachComment of eachSite.comment){
						output.push(eachComment);
					}
				}
			}
		}
	}
	if(output.length <1)
		res.send("No result");
	else	
		res.send(output);
})

/*******************radar*********************/
app.get('/api/read/radar/:category/:lat/:lon', function(req,res){
	var criteria = req.params.category;
	var start ={latitude: req.params.lat, longitude: req.params.lon};
	var end ={latitude: 0, longitude: 0};
	var output =[];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(eachSite.location != undefined){
					if(eachSite.categroy == criteria){
						end.latitude = parseInt(eachSite.location.lat);
						end.longitude = parseInt(eachSite.location.lon);
						console.log(haversine(start,end));
						if(haversine(start,end) <=100){
							output.push(eachSite);
						}
					}
				}
			}
		}
	}
	if(output.length <1)
		res.send("No result");
	else	
		res.send(output);
})


app.get('/api/read/map/:category', function(req,res){
	var criteria = req.params.category;
	var output =[];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(eachSite.location != undefined){
					if(eachSite.categroy == criteria){
						output.push(eachSite);
					}
				}
			}
		}
	}
	if(output.length <1)
		res.send("No result");
	else	
		res.send(output);
})

/*******************weather API*********************/
//tested
app.get('/api/read/weather', function(req,res) {
		res.send(data.weather);
})

/*******************Home Page*********************/
app.get('/api/read/home', function(req,res) {
	var output = [];
	var hot = [];
	var weather =[];

	weather.push(data.weather);

	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(eachSite.location != undefined && eachSite.promotion != undefined){
					if(eachSite.promotion == "hot"){
						hot.push(eachSite);
					}
				}
			}
		}
	}

	

})

/*******************UI*********************/
//tested
app.get('/admin/create/attraction',function(req,res){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.getDistrictList(db,function(result){
			res.render('createAttraction.ejs',{result:result});
			db.close();
		});
	});//end db
})

//tested
app.get('/admin/read/attraction',function(req,res){
	var output = [];
	var title = [];
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				title.push(eachDistrict._id);
				title.push(eachDistrict.name);
				title.push(eachSite.title);
				if(eachDistrict.promote == undefined || eachDistrict.promote != "hot" ){
					title.push(true);
				}else{
					title.push(false);
				}
				output.push(title);
				title= [];
			}
		}
	}
	res.render('attraction.ejs',{output:output});
})

//tested
app.get('/admin/read/site/:name',function(req,res){
	var name = req.params.name;
	for(eachDistrict of data.dis){	
		if(eachDistrict.site != undefined){
			for(eachSite of eachDistrict.site){
				if(name == eachSite.title){
					res.render('site.ejs',{output:eachSite});
				}
			}
		}
	}
})

app.get('/admin/login',function(req,res){
	res.render('login.ejs');
})

app.post('/admin/login', function(req,res){
	var ac = req.body.account;
	var pw = req.body.password;
	var criteria = {"name" : ac , "password" : pw};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
			findUser(db,criteria,function(result){
				if(result == null){
					res.send("null");
				}//no user
				else if(result.name == ac && result.password == pw){
					req.session.authenticated = true;
					res.redirect('/admin');
				}
			});
	});//end db
})

function findUser(db,criteria,callback) {
	db.collection('user').findOne(criteria,
		function(err,result) {
			assert.equal(err,null);
			callback(result);
		}//end function(err,result) {
	)//end find
}

app.get('/admin',function(req,res){
	if(req.session.authenticated != true){
		res.redirect('/admin/login');
	}else{
		res.render('home.ejs');
	}
})

app.get('/logout',function(req,res){
	req.session.authendication = false;
	res.redirect('/admin/login');
})

app.get('/admin/create/user',function(req,res){
	if(req.session.authenticated != true){
		res.redirect('/admin/login');
	}else{
		res.render('createUser.ejs',{msg:""});
	}
})

app.post('/admin/create/user',function(req,res){
	if(req.body.password == req.body.cPassword){
		var criteria = {"name" : req.body.ac , "password" : req.body.password};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.createUser(db,criteria,function(){
			res.send("<h1>Created</h1>");
			res.end();
		})
	})
	}else{
		res.render('createUser.ejs',{msg:"Password should be equal to confrim password"});
	}
})


app.post('/admin/update/hot',function(req,res){
	var name = req.body.tick;
	console.log(name);
	var criteria = {"_id" : ObjectId(req.body.id),"site.title" : name};
	console.log(criteria);
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		//db.collection('attraction').update({criteria},
			//{$set: {"site.promotion" : "hot"}}, 
			db.collection('district').findOne({criteria},
			function(err,result){
				console.log(result);
			});
	});//end db
})

app.listen(process.env.PORT ||8090, function() {
  console.log('Server is on.');
});
