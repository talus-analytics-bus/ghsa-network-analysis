// NodeJS script for starting server and listening to calls to run model
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var csv = require('csvtojson');
var bodyParser = require('body-parser');
var jsontocsv = require('jsontocsv')
 
//support parsing of application/json type post data
app.use(bodyParser.json({limit: '50Mb'}));

// Routing
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.post('/getCsvData', function(req, res) {
	console.log("getCsvData!");
	const dataFn = req.body.dataFn;
	var result = [];
	const csvFilePath = `./data/${dataFn}`;
	csv()
	.fromFile(csvFilePath)
	.on('json',(jsonObj)=>{
		result.push(jsonObj);
	})
	.on('done',(error)=>{
		console.log('end')
		res.send(result);
	})
});

app.post('/jsontocsv', function(req, res) {
	console.log("running jsontocsv");
	jsontocsv(inputStream, outputStream, {header: false, whitelist: whitelistFields, separator: ','}, function (err) {
	  if (!err) console.log('Success.')
	});
});

const translate = require('google-translate-api');

app.post('/translate', function(req, res) {
	// console.log("running translate POST");
	translate(req.body.text, {to: 'en'}).then(res2 => {
	    res.send(res2);
	}).catch(err => {
	    console.error(err);
	});
});

app.post('/translateBatch', function(req, res) {
	let toTranslate = require('./data/descs_arr.json');
	toTranslate = toTranslate.slice(8000,8017);
	const output = [];

	const translateBatch = (i) => {
		console.log(i);
		if (i >= toTranslate.length) {
			console.log(output);
			res.send(output);
			return;
		}
		if (toTranslate[i] === null || toTranslate[i].length > 4000) {
			output.push(['', '']);
			translateBatch(i + 1);
			return;
		}
		// console.log(toTranslate[i])
		translate(toTranslate[i], {to: 'en'}).then(res2 => {
		    output.push([res2.text, res2.from.language.iso]);
		    translateBatch(i + 1);
		}).catch(err => {
		    console.error(err);
		});
	};
	translateBatch(0);
	
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	if (req.params[0] === '/translate') {
		console.log("running translate");
		console.log("loading data to translate")
		let data = require('./data/activity_descs.json');
		// data = [data[0]];
		let n  = 0;
		data.forEach(d => {
			console.log(n++);
			if (d.title === null) return;
			// console.log(n++);
			translate(d.title, {to: 'en'}).then(res2 => {
			    // console.log(res.text);
			    if (res2.from.language.iso === 'en') return;
			    d.title_eng = res2.text;
			    d.title_lang = res2.from.language.iso;
			    if (n === 138) res.send(data);
			}).catch(err => {
			    console.error(err);
			});
		});
		// res.send(data);
	} else {
		res.sendFile(path.join(__dirname, '/', req.params[0]));
	} 
});	

// Start the HTTP Server
server.listen(process.env.PORT || 3000, function() {
	console.log('Server set up!');
	console.log(server.address());
});