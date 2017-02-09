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
var loopCount =1;
var Job = require('cron').CronJob;

var count =0;

new Job('0 */7 * * * *', function() {	

	content = "";
	console.log(Date() + " Create weather API");
  var apiReq = http.request(options, function(apiRes) {
	    apiRes.setEncoding('utf8');

	    apiRes.on('data', function (chunk) {

		/****target html*****/
		if(chunk.includes("Date")){
			content+= chunk.substring(chunk.indexOf("Date/Month"));
		}//end if
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
	var criteria ={};
	var doc ={};
				
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		db.collection('weather').remove({},
			function(err,result) {
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

			criteria = {"Date" : arg[0]};
			doc = {	"Date" : arg[0],
						"Wind" : arg[1],
						"Weather" : arg[2],
						"Temp Range" : arg[3],
						"RH Range" : arg[4],
						"Icon" : arg[5]
						};
						
				/******prepare document*****/
						

			addWeather(db,doc,function(err,result){
				if (err) {
					result = err;
					console.log("insertOne error: " + JSON.stringify(err));
				} 
				else {
					console.log("Create success: " + result.insertedId);
				}
			})//end addWeather
										
			if(content.indexOf("Date/Month ") >0){
				arg = [];
				content = content.substring(content.indexOf("Date/Month "));
			}
			else {
				loopCount=0;
				dayint=0;
			}
					
		}//end while loop
	})//end callback of remove
})//end MongoClient.connect

	    });//end of apiRes.on('end')

	    apiReq.on('error', function(e) {
		console.log('Problem with request: ' + e.message);
	    });
	});
	apiReq.end();
 }
).start();

//function
function addWeather(db,jsonDoc,callback){
	db.collection('weather').insertOne(jsonDoc,
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
		var cursor = db.collection('weather').find().sort({"Date" : 1}).limit(5);
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
