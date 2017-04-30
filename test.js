var Job = require('cron').CronJob;
var http = require('http');

var weatherSchedule2 = '* 19 22 * * *';

var weatherAPI = new Job(weatherSchedule2 , function() {	
	var loopCount =1
	var content = "";

	var options = {
    host: 'www.hko.gov.hk',
    port: 80,
    path: '/textonly/v2/warning/warn.htm',
    method: 'GET'
	};

	console.log(Date() + " Create weather API");

  var apiReq = http.request(options, function(apiRes) {
		apiRes.setEncoding('utf8');

	  apiRes.on('data', function (chunk) {
			console.log("-" + chunk);
			content+=chunk;
			content = content.substring(content.indexOf("</h1>"+1),content.indexOf("<hr>"));
			console.log("#" + content);
   	}).end();

	});

	

}).start();

