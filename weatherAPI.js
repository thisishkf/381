var http = require('http');
var assert = require('assert');
var mongourl = 'mongodb://user:123@ds159998.mlab.com:59998/fyp';
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var app = express();

var content = "";
var options = {
    host: 'www.hko.gov.hk',
    port: 80,
    path: '/textonly/v2/forecast/nday.htm',
    method: 'GET'
};

var Job = require('cron').CronJob;

new Job('00 00 00 * * 1-7', function() {
	content = "";
	console.log(Date());
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
				var loopCount =1;
				var dayint = 1;
				var criteria ={};
				var doc ={};
				
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
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
						
						findExist(db,criteria,doc,function(result,passDoc,passCriteria){
						if(result ==null){
							addWeather(db,passDoc,function(err,result){
								if (err) {
									result = err;
									console.log("insertOne error: " + JSON.stringify(err));
								} 
								else {
									console.log("Create success: " + result.insertedId);
								}
								
							})//end addWeather
						}//end if not found
						else{
							updateWeather(db,passCriteria,passDoc,function(err,result){
								if(err){
									console.log("Update error: " + JSON.stringify(err) );
								}
								else{
									console.log("Update success: " + JSON.stringify(passCriteria));
								}
							})
						}				
					
						})//end findExist
					
					
					if(content.indexOf("Date/Month ") >0){
						arg = [];
						content = content.substring(content.indexOf("Date/Month "));
					}
					else{
						loopCount=0;
					}
					
				}//end while loop

})//end MongoClient.connect

	    });//end of apiRes.on('end')

	    apiReq.on('error', function(e) {
		console.log('Problem with request: ' + e.message);
	    });
	});
	apiReq.end();
 }
).start();

function updateWeather(db,criteria,jsonDoc,callback){
	db.collection('weather').update(criteria,{$set:jsonDoc},
		function(err,result){
			assert.equal(err,null);
			callback(err,result);
	})
}

function addWeather(db,jsonDoc,callback){
	db.collection('weather').insertOne(jsonDoc,
		function(err,result){
			callback(err,result);
	})
}

function findExist(db,criteria,doc,callback) {
	db.collection('weather').findOne(criteria,
		function(err,result) {
			assert.equal(err,null);
			callback(result,doc,criteria);
		}//end function(err,result) 
	)//end find
}


