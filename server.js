// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var aws = require('aws-sdk');
var S3_BUCKET = process.env.S3_BUCKET;

// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	if (req.params[0] === '/upload-s3') {
		// upload file to Amazon S3 bucket
		var s3 = new aws.S3();
		var fileName = req.query('file-name');
		var fileType = req.query('file-type');

		s3.getSignedUrl('putObject', {
			Bucket: S3_BUCKET,
			Key: fileName,
			Expires: 60,
			ContentType: fileType,
			ACL: 'public-read',
		}, function(err, data) {
			if (err) {
				console.log(err);
				return res.end();
			}

			var returnData = {
				signedRequest: data,
				url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileName,
			};
			res.write(JSON.stringify(returnData));
			res.end();
		});
	} else {
		res.sendFile(path.join(__dirname, '/', req.params[0]));
	}
});	

// Start the HTTP Server
server.listen(process.env.PORT || 8888, function() {
	console.log('Server set up!');
	console.log(server.address());
});
