var zipdb = require('zippity-do-dah');
// NodeJS script for starting server and listening to calls to run model
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var axios = require('axios');
var _ = require('underscore');
var fs = require('fs');
var jsonfile = require('jsonfile');


var records = JSON.parse(fs.readFileSync("./data/records.json"));
var county_zip2 = JSON.parse(fs.readFileSync("./data/county_zip2.json"));
var states_hash = JSON.parse(fs.readFileSync("./data/states_hash.json"));
var county_to_fips_dict = JSON.parse(fs.readFileSync("./data/county_to_fips_dict.json"));
var locations = JSON.parse(fs.readFileSync("./data/locations.json"));

// Routing
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get(/^(.+)$/, function(req, res) {
	if (req.params[0] === '/randomLoc') {
		var randomLocs = zipdb.random(100000);

		// get all zips from dict
		var validZips = _.pluck(county_zip2,'ZCTA5');

		var output = [];
		// for each:
		for (var i = 0; i < validZips.length; i++) {
			var tmp = zipdb.zipcode(validZips[i]);
			delete tmp.latitude;
			delete tmp.longitude;
			delete tmp.type;
			output.push(tmp);
		}

		// var validLocs = _.filter(randomLocs,function(d) {
		// 	const isStandard = d.type === 'standard';
		// 	const isState = states_hash[d.state] !== undefined;
		// 	const isValidZip = _.findWhere(county_zip2, {"ZCTA5": d.zipcode}) !== undefined;
		// 	return isStandard && isState && isValidZip;
		// });


		res.send(output);
	}
	// returns client records with locationInfo object appended
	else if (req.params[0] === '/getLocationInfo') {
		var output = [];
		// var records = JSON.parse(req.query.records);
		var surgeAction = ["inc","dec","dec","dec","dec","dec","inc","dec","dec","dec","dec","dec","inc","dec","dec","normal","normal","normal","inc","normal","normal","normal","normal","normal","normal","normal","normal"];		
		var centers = req.query.centers;
		var surgeCenters = [];
		_.each(centers, d => {
			if (surgeAction[d.center_id] === 'inc') {
				surgeCenters.push(d);
				surgeCenters.push(d);
				surgeCenters.push(d);
			} else if (surgeAction[d.center_id] === 'normal') {
				surgeCenters.push(d);
				surgeCenters.push(d);
			} else {
				surgeCenters.push(d);
			}
		});

		for (var i = 0; i < records.length; i++) {
			var client = records[i];
			var agent_names = req.query.agent_names;
			if (i % 1000 === 0) console.log('record = ' + i)
			
			var random_center;
			const isSurgeTime = new Date(client.create_stamp).getTime() >= new Date("6/26/2017").getTime();
			const doSurge = isSurgeTime;

			if (doSurge) {
				random_center = _.sample(surgeCenters);
			} else {
				// get random call center
				random_center = _.sample(centers);
			}

			// get state of call center
			var randomCenterState = random_center.state_abbr;

			// get random agent
			var randomAgent = _.sample(_.filter(agent_names, {center_id: random_center.center_id}));

			// decide whether in state or out
			var runif = Math.random();
			const probOutOfState = 0.15;

			// if in, roll random loc until in
			const inState = runif >= probOutOfState;
			var randomLoc;
			if (inState) {
				var possibleLocs = _.filter(locations,function(d) {
					return d.state === randomCenterState;
				});

				randomLoc = _.sample(possibleLocs);
			} else {
				var possibleLocs = _.filter(locations,function(d) {
					return d.state !== randomCenterState;
				});

				randomLoc = _.sample(possibleLocs);

			}

			// // debug
			// var randomLoc = _.sample(locations);
			var countyTmp = _.findWhere(county_zip2, {"ZCTA5": randomLoc.zipcode});

			// update client params
			client.state_abbr = randomLoc.state;
			client.state = states_hash[randomLoc.state];
			client.city = randomLoc.city;
			client.zip = randomLoc.zipcode;

			// get zip
			var cur_zip = client.zip;
			// find first matching zip in crosswalk
			var county_fips = countyTmp.GEOID; // requires the data file
			// assign fips for that county
			var county_name = _.findWhere(county_to_fips_dict, {"fips": county_fips}).county; // requires the data file
			client.county = county_name;

			// remove create stamp
			var create_stamp = client.create_stamp.toString();
			delete client.create_stamp;

			// push to output arr
			output.push({
				client: client, 
				create_stamp: create_stamp, 
				center: random_center,
				agent: randomAgent,
				inState: inState
			});
		}
		console.log('done!')

		res.send(output);
	} else if (req.params[0] === '/testUnderscore') {

		console.time('underscore');

		var usResult = _.filter(records, function(d){
			return d.race.includes('White') && parseInt(d.age) < 40;
		});
		console.timeEnd('underscore');

		// var jsResult = records.filter(d => d.race.includes('White'));

		res.send(usResult);
		
	
	} else if (req.params[0] === '/testJS') {
		// var usResult = _.filter(records, function(d){
		// 	return d.race.includes('White');
		// });
		console.time('js');

		var jsResult = records.filter(d => d.race.includes('White') && parseInt(d.age) < 40);

		console.timeEnd('js');
		res.send(jsResult);
		
	} else {
		res.sendFile(path.join(__dirname, '/', req.params[0]));
	}
});

// Start the HTTP Server
server.listen(process.env.PORT || 3000, function() {
	console.log('Server set up!');
	console.log(server.address());
});