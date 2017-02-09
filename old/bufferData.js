var fs = require('fs');
var assert = require('assert');
var mongourl = 'mongodb://user:123@ds159998.mlab.com:59998/fyp';
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var Job = require('cron').CronJob;

new Job('0 */2 * * * *', function() {	
	console.log(Date() + " Buffer Data");
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		getDistrict(db,function(){
			getweather(db,function(){
				db.close();
			})
		})//getDistrict
	})//mongo
	
}).start();

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
									console.log("District Infomration Buffered!");
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
