var http = require('http');
var assert = require('assert');
var mongourl = 'mongodb://user:123@ds159998.mlab.com:59998/fyp';
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var app = express();
var fs = require('fs');

var content = "";
var options = {
    host: 'www.hko.gov.hk',
    port: 80,
    path: '/textonly/v2/forecast/nday.htm',
    method: 'GET'
};
var loopCount ;
var Job = require('cron').CronJob;

var weatherAPI = new Job('0 */20 * * * *', function() {	
	loopCount =1
	content = "";
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
			//end addWeather
										
			if(content.indexOf("Date/Month ") >0){
				arg = [];
				content = content.substring(content.indexOf("Date/Month "));
			}
			else {
				console.log("Start Import Data!");
				loopCount=0;
				addWeather(db,docArray,function(err,result){
					if (err) {
						console.log("insertOne error: " + JSON.stringify(err));
					} 
					else {
						console.log("Create success: " + result);
						getDistrict(db,function(){
								getweather(db,function(){
									db.close();
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

var bufferData = new Job('0 0 0 */1 * *', function() {	
	console.log(Date() + " Buffer Data");
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
			
	})//mongo
}).start();

//function
function addWeather(db,jsonDoc,callback){
	db.collection('weather').insert(jsonDoc,
		function(err,result){
			callback(err,result);
	})
}

function getDistrict(db,callback){
		var district = [];
		var str="exports.dis = dis;";
		var cursor = db.collection('district').find();
			cursor.each(function(err,doc){
				if(doc!= null){
					district.push(doc);
				}
				else
				{
					var buffer = "var dis = " + JSON.stringify(district) + "\n";
					fs.writeFile("data.js",buffer,function(err){
						if(err) {
							console.log(err);
						}
						else {
							fs.appendFile("data.js",str,function(err){
								if(err){
									console.log(err);
								}
								else {
									console.log("District Information Buffered!");
									callback();
								}
							})//fs.appendFile
						}
					})//fs.writeFile
				}
		});
}

function getweather(db,callback){
		var weather = [];
		var str="exports.weather = weather;";
		var cursor = db.collection('weather').find().sort({"Date" : 1}).limit(9);
			cursor.each(function(err,doc){
				if(doc!= null){
					weather.push(doc);
				}
				else
				{
					var buffer = "\nvar weather = " + JSON.stringify(weather) + "\n";
					fs.appendFile("data.js",buffer,function(err){
						if(err) {
							console.log(err);
						}
						else {
							fs.appendFile("data.js",str,function(err){
								if(err){
									console.log(err);
								}
								else {
									console.log("Weather Infomration Buffered!");
									callback();
								}
							})//fs.appendFile
						}
						})//fs.writeFile
					}
			});
}
