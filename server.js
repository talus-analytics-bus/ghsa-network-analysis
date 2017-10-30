// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var fs = require('fs');

var aws = require('aws-sdk');
aws.config.loadFromPath('./config/config.json');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });

var formidable = require('formidable');

// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	res.sendFile(path.join(__dirname, '/', req.params[0]));
});

// uploading report to s3 bucket
app.post('/upload-s3', function(req, res) {
	var form = new formidable.IncomingForm();

	form.on('error', function(err) {
		console.log('Error processing file...', err);
	});

	// parse form and upload to S3 bucket
	form.parse(req, function(err, fields, files) {
		// construct tags
		var tags = 'firstname=' + fields.firstname;
		tags += '&lastname=' + fields.lastname;
		tags += '&organization=' + fields.org;
		tags += '&email=' + fields.email;

		var file = files.upload;
		console.log(file);
		var uploadParams = {
			Bucket: 'ghs-tracking-dashboard',
			Tagging: tags,
			Key: file.name,
			Body: '',
		};
		var fileStream = fs.createReadStream(file.path);
		fileStream.on('error', (err) => {
			console.log('File Error', err);
		});
		uploadParams.Body = fileStream;

		s3.upload(uploadParams, (err, data) => {
			if (err) console.log('Error uploading to S3', err);
			if (data) console.log('Success uploading to S3', data.Location);
		});
		res.status(200).json([]);
	});
});

// Start the HTTP Server
server.listen(process.env.PORT || 8888, function() {
	console.log('Server set up!');
	console.log(server.address());
});
