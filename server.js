// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var fs = require('fs');


var formidable = require('formidable');
const useHTTPSRedirection = true;



// Set the useHTTPSRedirection to false if you don't want the auto-redirection from HTTP to HTTPS
if (useHTTPSRedirection === true) {
    // Redirect HTTP to HTTPS
    app.use(function(req, res, next) {
        if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
            res.redirect('https://' + req.get('Host') + req.url);
        }
        else
            next();
    });
}

// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	res.sendFile(path.join(__dirname, '/', req.params[0]));
});

// If enableS3 is true, then the aws-sdk package will be loaded (can cause some
// Mac machines to crash). This package is required for the "Submit Data" page
// and functions on that page will fail unless it is true.
var enableS3 = true;
if (enableS3) {
	var aws = require('aws-sdk');
	aws.config.loadFromPath('./config/config.json');
	var s3 = new aws.S3({ apiVersion: '2006-03-01' });

	// uploading report to s3 bucket
	app.post('/upload-s3', function(req, res) {
		var form = new formidable.IncomingForm();

		form.on('error', function(err) {
			console.log('Error processing file...', err);
		});

		// parse form and upload to S3 bucket
		form.parse(req, function(err, fields, files) {
			var file = files.upload;

			// construct tags
			var tags = 'firstname=' + fields.firstname;
			tags += '&lastname=' + fields.lastname;
			tags += '&organization=' + fields.org;
			tags += '&email=' + fields.email;

			// validate file type and size
			var fileNameArr = file.name.split('.');
			var fileType = fileNameArr[fileNameArr.length - 1];
			if (fileType !== 'xls' && fileType !== 'xlsx') {
				res.status(500).json({ error: 'File type is not valid: ' + fileType });
				return;
			}
			if (file.size > 100e6) {
				res.status(500).json({ error: 'File size is over 100 MB: ' + file.size });
				return;
			}

			// set up parameters object
			console.log(file);
			var uploadParams = {
				Bucket: 'ghs-tracking-dashboard',
				Tagging: tags,
				Key: path.basename(file.path) + '.' + fileType,
				Body: '',
			};

			// read file
			var fileStream = fs.createReadStream(file.path);
			fileStream.on('error', (err) => {
				console.log('File Error', err);
			});
			uploadParams.Body = fileStream;

			// start upload to s3
			s3.upload(uploadParams, (err, data) => {
				if (err) {
					console.log('Error uploading to S3: ', err);
					res.status(500).json({ error: err });
				}
				if (data) {
					console.log('Success uploading to S3: ', data.Location);
					res.status(200).json({ location: data.Location });
				}
			});
		});
	});
} 


// Start the HTTP Server
server.listen(process.env.PORT || 8800, function() {
	console.log('Server set up!');
	console.log(server.address());
});
