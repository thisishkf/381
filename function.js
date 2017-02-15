var assert = require('assert');
var fs = require('fs');
module.exports ={
	loginUser : function(db, user,status){
		var doc = {"Name" : user};
		db.collection('user').update(doc,
			{$set:{"Active" : status}},
			function(err,result) {
				assert.equal(err,null);
			}//end function(err,result) {
		)//end find
	},

	findUser : function(db,criteria,callback) {
		db.collection('user').findOne(criteria,
			function(err,result) {
				assert.equal(err,null);
				callback(result);
			}//end function(err,result) {
		)//end findOne
	},

	getUserInfo : function(res,db,criteria) {
		db.collection('user').findOne(criteria,{"Password": 0},
			function(err,result) {
				assert.equal(err,null);
				res.send(result);
				res.end();
			}//end function(err,result) {
		)//end findOne
	},

	updateUserInfo : function(db,criteria,doc) {
		db.collection('user').update(criteria,{$set:doc},
			function(err,result) {
				assert.equal(err,null);
				res.end("Update Success");
			}//end function(err,result) {
		)//end findOne
	},

	createUser : function(db,doc,callback){
		db.collection('user').insertOne(doc,
			function(err,result) {
				assert.equal(err,null);
				callback();
			}//end function(err,result) {
		)//end insertOnce
	},

	getDistrictList : function(db,callback){
		var district = [];
		var cursor = db.collection('district').find({},{'name':1,_id:1});
			cursor.each(function(err,doc){
				if(doc!= null){
					district.push(doc);
				}
				else{
					callback(district);
				}
			});
	},

	addDistrict : function(db,criteria,doc,callback){
		db.collection('district').update(criteria,{$push: doc},
			function(err,result) {
				if (err) {
					result = err;
					console.log("update: " + JSON.stringify(err));
				}
				callback(result);
			}
		);
	},

	addDistrictComment : function(db,criteria,doc,callback){
		db.collection('district').update(criteria,{$push: doc},
			function(err,result) {
				if (err) {
					result = err;
					console.log("update: " + JSON.stringify(err));
				}
				callback(result);
			}
		);
	},

	getDistrictInfo : function(db,name,callback){
		var district = [];
		var cursor = db.collection('district').aggregate([
			{$match: {"site": { $elemMatch :{"title" :name} } } },
			{$unwind : "$site"},
			]);
			cursor.each(function(err,doc){
				if(doc!= null){
					district.push(doc);
				}
				else{
					callback(district);
				}
			});
	}



}
