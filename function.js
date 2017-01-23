var assert = require('assert');
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

	getUserInfo : function(res,db,criteria,doc) {
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

	createUser : function(db,doc){
		db.collection('user').insertOnce(doc,
			function(err,result) {
				assert.equal(err,null);
				res.end("Create Success");
			}//end function(err,result) {
		)//end insertOnce
	},

	getWeatherAPI : function(res,db,dayCount) {
		db.collection('weather').find().limit(2).toArray(
			function(res,err,result){
				assert.equal(err,null);
				console.log(reuslt);
			}
		)
	},

	getDistrictList : function(db,callback){
		db.collection('district').find({},{'name':1,_id:0},
			function(err,result){
				assert.equal(err,null);
				callback(result);
			}
		)
	}

}
