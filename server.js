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
var url = require('url');
var haversine = require('haversine');
//customized function
var func = require('./function.js');
//var data = require('./data.js');
var mtr = require('./mtr.js');
//var weatherAPI = require('./schedulingJob.js');
//on-trail function

var districtList =["Islands","Kwai Tsing","North","Sai Kung","Sha Tin","Tai Po","Tsuen Wan","Tuen Mun","Yuen Long","Kowloon City","Kwun Tong","Sham Shui Po","Wong Tai Sin","Yau Tsim Mong","Central & Western","Eastern","Southern","Wan Chai"];

var dis = [];
var wea = [];
var data = [dis,wea];

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
	var criteria = {"name" : name};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.findUser(db,criteria,function(result){
			if(result == null){
				res.send("Invalid User Name!");
				res.end();
			}//no user
			else if(result.name == name && result.password == pw && !result.Active){
				res.send('Valid');
				res.end();
				func.loginUser(db,result.ID,true);
			}else{
				res.send('Invalid Request');
				res.end();
			}
		db.close();
		});
	});
});

//logout
app.post('/logout',function(req,res) {
	var user = req.body.name;
	var criteria = {"name" : user};
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
	var criteria  ={"name" : req.body.name};
	var doc = {"name" : req.body.name, 
							"password" : req.body.password, 
							"info" : null, 
							"active" : false, 
							"status" : "offline" , 
							"location" : {
								"lat" : 0, 
								"lon" : 0
								}
						};
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
app.get('/read/user/:name/info',function(req,res){
	var name = req.params.name;
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
app.post('/admin/create/attraction',function(req,res){
	var doc = {	"district" : req.body.district,
							"title" : req.body.title, 
							"location":{"lon" : req.body.lon, 
													"lat" : req.body.lat
													},  
							"category" : req.body.cat,
							"description" : req.body.des,
							"hours" : req.body.hour,
							"promotion" : null,
							"issue" : null,
							"comment" : []
						};
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.addDistrict(db,doc,function(result){
			res.send(result);
			db.close();
		});
	});//end db
})

//add comment
//api : curl -X POST -H "Content-Type:application/JSON" -d '{"doc":{"dis" : "588577f3734d1d75e11a7695","title":"Ma On Shan", "content" : "new test","user" : "sam"}}' localhost:8090/api/create/comment
app.post('/api/create/comment',function(req,res){
	var income = req.body.doc;
	var dis = income.dis;
	var title = income.title;
	var doc = {	"comment" :{
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
	res.send(districtList);
})

//read siteList
//testes
app.get('/api/read/siteList',function(req,res){
	var output = [];
	for(eachSite of data[0]){	
		output.push(eachSite.title);
	}
	res.send(output);
})

//read one site
//tested
app.get('/api/read/siteList/:name',function(req,res){
	var name = req.params.name;
	var output = [];
	for(eachSite of data[0]){	
		if(name == eachSite.title){
			output.push(eachSite);
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
	for(eachDistrict of data[0]){	
		if(eachDistrict.district ==district){
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
	for(eachSite of data[0]){	
		if(eachSite.title == site && eachSite.comment != undefined){
			for(eachComment of eachSite.comment){					output.push(eachComment);
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
	for(eachSite of data[0]){	
		if(eachSite.categroy == criteria){
			end.latitude = parseInt(eachSite.location.lat);
			end.longitude = parseInt(eachSite.location.lon);
			console.log(haversine(start,end));
			if(haversine(start,end) <=100){
				output.push(eachSite);
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
	for(eachSite of data[0]){	
		if(criteria == "all" || eachSite.categroy == criteria){
			output.push(eachSite);
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
		res.send(data[1]);
})

/*******************Home Page*********************/
app.get('/api/read/home', function(req,res) {
	var output = [];
	var hot = [];
	var weather =[];

	weather.push(data[1]);

	for(eachSite of data[0]){				
		if(eachSite.promotion == "hot"){
			hot.push(eachSite);
		}
	}

	output.push(weather);
	output.push(hot);
	res.send(output);
	res.end();
})

/*******************UI*********************/
//tested
app.get('/admin/create/attraction',function(req,res){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.getDistrictList(db,function(result){
			res.render('createAttraction.ejs',{result:result,districtList:districtList});
			db.close();
		});
	});//end db
})

//tested
app.get('/admin/read/attraction',function(req,res){
	var output = [];
	var title = [];
	for(eachDistrict of data[0]){	
		title.push(eachDistrict._id);
		title.push(eachDistrict.district);
		title.push(eachDistrict.title);
		if(eachDistrict.promotion != "hot" ){
			title.push(false);
		}else{
			title.push(true);
		}
		output.push(title);
		title= [];
	}
	res.render('attraction.ejs',{output:output});
})

//tested
app.get('/admin/read/site/:name',function(req,res){
	var name = req.params.name;
	for(eachDistrict of data[0]){	
		if(eachDistrict.title == name){
			res.render('site.ejs',{output:eachDistrict});
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
			func.findUser(db,criteria,function(result){
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



app.get('/admin',function(req,res){
	if(req.session.authenticated != true){
		res.redirect('/admin/login');
	}else{
		res.render('home.ejs');
	}
})

app.get('/admin/logout',function(req,res){
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
			res.render('ok.ejs');
		})
	})
	}else{
		res.render('createUser.ejs',{msg:"Password should be equal to confrim password"});
	}
})


app.get('/admin/read/user',function(req,res){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		func.getUserList(db,function(result){
			res.render('users.ejs',{result:result});
			console.log(result);
			db.close();
		});
	});//end db	
})

app.post('/admin/update/hot',function(req,res){
	var tick = req.body.tick;
	if(tick.length != 3){
		res.send("please check 3 boxes");
		res.end();
	}
	else {
		var criteria1 = {"_id" :  ObjectId(tick[0])};
		var criteria2 = {"_id" :  ObjectId(tick[1])};
		var criteria3 = {"_id" :  ObjectId(tick[2])};

		MongoClient.connect(mongourl,function(err,db) {
			assert.equal(err,null);
			func.rmHot(db,function(result){
				func.addHot(db,criteria1,function(result){
					func.addHot(db,criteria2,function(result){
						func.addHot(db,criteria3,function(result){
							//buffer
							func.getDistrict(db,function(district){
									data.push(district);
									db.close();
									res.render('ok.ejs');
								});	//buffer	
						});//add
					});//add
				});//add
			});//rm
		});//end db	
	}
})

//*****test*****//
var mtrLine = [mtr.AEL,mtr.DRL,mtr.EAL,mtr.ISL,mtr.KTL,mtr.MOL,mtr.TCL,mtr.TKL,mtr.TWL,mtr.WRL,mtr.SIL];
app.get('/mtr/:start/:end',function(req,res){
	var start = req.params.start;
	var StartStation = {};
	var end = req.params.end;
	var endStation = {};
	var result =0;
	var nextStation
	for(line of mtrLine){
		for(station of line){
			if(station.name == start)startStation = station;
			if(station.name == end)endStation = station;
			
		}
	}
	nextLine = func.chooseLine(startStation.line);

	result = nextInterchange(startStation,endStation,func.chooseLine(startStation.line));

	res.send(JSON.stringify(startStation) + "<br/>" + JSON.stringify(endStation)+ "<br/>"+result);
	res.end();
})

function nextInterchange(start,end,mtrLine){
console.log("------new request-----------");
	var out =0;
	var i =0, c=0;

			if(mtrLine[0].line == end.line){

				console.log("end search");
					for(line of mtrLine){
						if(line.name == start.name){
				console.log("station in line from " + line.name + 
					" and " + end.name + ": " +
					func.absoluteValue(parseInt(line.sequence) - parseInt(end.sequence)));
console.log("--------------------------");
							return func.absoluteValue(parseInt(line.sequence) - parseInt(end.sequence));
						}
					}
			}
			else{
				for(i =0;i< mtrLine.length;i++){
					//look for nearby line
					if(c==0 && mtrLine[i].interchange != null && 
						mtrLine[i].interchange == end.line){

						console.log("1next line:" + nextLine[0].line);
						console.log("interchange:" + mtrLine[i].name);

						nextLine = func.chooseLine(mtrLine[i].interchange);
						for(line of mtrLine){
							if(line.name == start.name){
								console.log("station in line from " + start.line + 
								" and " + mtrLine[i].line + ": " +
								func.absoluteValue(parseInt(line.sequence) - parseInt(mtrLine[i].sequence)));
								return  func.absoluteValue(parseInt(line.sequence) - parseInt(mtrLine[i].sequence))
									+ nextInterchange(mtrLine[i],end,nextLine);
							}
						}
					}

					else if (c==0 && i == mtrLine.length -1){
						i=0;
						c=1;
					}

					else if (c==1 && mtrLine[i].interchange != null && 
						mtrLine[i].interchange != start.line && 
						mtrLine[i].interchange != end.line){
			
				console.log("2next line:" + nextLine[0].line);
				console.log("station in line from " + start.name + " and " + mtrLine[i].name + ": " + 
					func.absoluteValue(parseInt(start.sequence) - parseInt(mtrLine[i].sequence)));
					console.log("interchange:" + mtrLine[i].name);
				nextLine = func.chooseLine(mtrLine[i].interchange);
				return  func.absoluteValue(parseInt(start.sequence) - parseInt(mtrLine[i].sequence))
					+ nextInterchange(mtrLine[i],end,nextLine);
						}
				}
			}
}
/*******************test2*********************/
app.post('/api/suggest/secdule',function(req,res){
	var siteName =[];
	var count = req.body.count;
	var i=0;

	for (i=0;i<count;i++){
		siteName.push(req.body.name[i]);
	}


	var siteArray = [];	
	var distanceList =[];
	var path =[];
	var choosenPath =[];


	func.findObject(siteName ,data, function(result){
		siteArray = result;
//console.log(siteArray);
		func.calculateEachDistance(siteArray,function(output){
			distanceList = output;		
//console.log(distanceList);
				var choosen = [];
				choosen = findPath(siteName, siteName[0], distanceList, choosenPath);
					console.log(choosen);

		
		});//calculateEachDistance

	});//end findObject

		res.end();
})


	function findPath(siteName, name, distanceList, output){
		var i =0;
		var minDis = 999;
		var choosen;

		if(siteName.length ==1){
			console.log(name);
			output.push(name)
			return output;
		}
		else{
			for(i=0; i<distanceList.length; i++){

				if(distanceList[i].distance < minDis && 
					distanceList[i].distance !=0 &&
					siteName.indexOf(distanceList[i].to) >=0 &&
					distanceList[i].from == name
					){
					minDis = distanceList[i].distance; 

					console.log("From: " + distanceList[i].from);
					console.log("To :" + distanceList[i].to);
					choosen = distanceList[i].to;
				}
			}
			console.log(name + "->");
			output.push(name);
			siteName.splice(siteName.indexOf(name),1);
			
			return findPath(siteName, choosen, distanceList, output);
	
		}
	}
/*******************schedule Job*********************/
var Job = require('cron').CronJob;
var scheduleTime = '0 0 0 */1 * *';
var scheduleTime2 = '0 30 */1 * * *';

var weatherAPI = new Job(scheduleTime , function() {	
	var loopCount =1
	var content = "";
	var options = {
    host: 'www.hko.gov.hk',
    port: 80,
    path: '/textonly/v2/forecast/nday.htm',
    method: 'GET'
};

	console.log(Date() + " Create weather API");

  var apiReq = http.request(options, function(apiRes) {
	    apiRes.setEncoding('utf8');

	    apiRes.on('data', function (chunk) {
				if(chunk.includes("Date")){
					content+= chunk.substring(chunk.indexOf("Date/Month"));
				}
				if(content.includes("</pre>")){
					content=content.substring(0,chunk.indexOf("</pre>")-1);
				}
	    });//end apiRes.on('data);

apiRes.on('end', function (chunk) {
	var arg = [];
	var buffer = "";
	var posOfDate=0, endOfDate=0;
	var posOfWind=0, endOfWind=0;
	var posOfWea =0, endOfWea =0;
	var posOfTemp=0, endOfTemp=0;
	var posOfRH  =0, endOfRH  =0;
	var dayint = 1;
	var docArray = [];
	var doc ={};
				
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		db.collection('weather').remove({},
			function(err,result) {//callback after delete
				console.log("Reset weather Database");
					
		while(loopCount >0){
			//get date
			posOfDate = content.indexOf(" ")+1;
			endOfDate = content.indexOf(")")+1;
			buffer = content.substring(posOfDate,endOfDate);
			arg.push(buffer);
			content = content.substring(content.indexOf("Wind: "));
	
			//get wind
			posOfWind = content.indexOf(": ")+2;
			endOfWind = content.indexOf(".");
			buffer = content.substring(posOfWind,endOfWind);
			buffer = buffer.replace("\n", " ");
			arg.push(buffer);
			content = content.substring(content.indexOf("Weather: "));

			//get weather
			posOfWea = content.indexOf(": ")+2;
			endOfWea = content.indexOf(".\n")+1;
			buffer = content.substring(posOfWea,endOfWea);
			buffer = buffer.replace("\n", " ");
			arg.push(buffer);
			content = content.substring(content.indexOf("Temp Range: "));

			//get temp
			posOfTemp = content.indexOf(": ")+2;
			endOfTemp = content.indexOf("C");
			buffer = content.substring(posOfTemp,endOfTemp);
			arg.push(buffer);
			content = content.substring(content.indexOf("R.H. Range: "));

			//get RH
			postOfRH = content.indexOf(": ")+2;
			endOfRH = content.indexOf("\n");
			buffer = content.substring(postOfRH, endOfRH);
			buffer = buffer.replace("Per Cent", "%");
			arg.push(buffer);

			//get icon
			var str = "Day " + dayint +" cartoon no. "
			dayint++;
			buffer = content.substring(content.indexOf(str) + str.length ,content.indexOf(str) + str.length+2);
			arg.push(buffer);
			//end one Date	

			doc = {	"Date" : arg[0],
						"Wind" : arg[1],
						"Weather" : arg[2],
						"Temp Range" : arg[3],
						"RH Range" : arg[4],
						"Icon" : arg[5]
						};
			docArray.push(doc);
						
				/******prepare document*****/										
			if(content.indexOf("Date/Month ") >0){
				arg = [];
				content = content.substring(content.indexOf("Date/Month "));
			}
			else {
				console.log("Start Import Data!");
				loopCount=0;
				func.addWeather(db,docArray,function(err,result){
					if (err) {
						console.log("insertOne error: " + JSON.stringify(err));
					} 
					else {
						console.log("Create success: " + result);
						data =[];
						func.getDistrict(db,function(district){
								data.push(district);
								func.getweather(db,function(weather){
									wea = weather;
									data.push(district);
								})
						})//getDistrict
					}
				})
			}				
		}//end while loop
})//end remove
})//end MongoClient.connect

	    });//end of apiRes.on('end')

	    apiReq.on('error', function(e) {
		console.log('Problem with request: ' + e.message);
	    });
	});
	apiReq.end();
 }
).start();


var bufferAll = new Job(scheduleTime2 , function() {	
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log("Buffer All: " + Date());
		data =[];
		func.getDistrict(db,function(district){
			data.push(district);
			func.getweather(db,function(weather){
				db.close();
				func.sortWeather(weather,function(out){
						weather = out;
						data.push(weather);
					})
			})
		})
	})
}).start();
/*******************end schedule Job*********************/

/*******************Start server*********************/
app.listen(process.env.PORT ||8090, function() {
	console.log("Preparing ...");
	MongoClient.connect(mongourl,function(err,db) {
		data =[];
		assert.equal(err,null);
		func.getDistrict(db,function(district){
			data.push(district);
			func.getweather(db,function(weather){
				db.close();
				
					console.log("Start: " + Date());
 					console.log('Server is on.');
					func.sortWeather(weather,function(out){
						weather = out;
						data.push(weather);
					})
			})
		})
	})
});
