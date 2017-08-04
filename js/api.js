const Api = {};

(() => {
	/* ------------------------------------ VisionLink API ----------------------------------- */
	//Api.test
	//Tests whether api.js was loaded successfully.
	Api.test = () => {
		console.log("Hello, world! I'm Api.js.");
	}
	
	//Api.realData - TO DO
	//Makes remote API call to VisionLink with API key and grabs a JSON that contains
	//the following data:
	//Call centers
	//Call records
	Api.getRealData = (callback, params={}) => {

		// // if requesting simulation data, limit results to calls made on that
		// // day (6/28/2017)
		// // otherwise do not limit the results
		// let apiFilters = JSON.stringify({});
		// if (App.useSimData) {
		// 	// apiFilters = 
		// 	// 				{
		// 	// 					"Client_CreateStamp": {
		// 	// 						value: "6/28/2017", // date of simulation
		// 	// 						operator: "date_equals"
		// 	// 					}
		// 	// 				};
		// 	apiFilters = JSON.stringify(
		// 					{
		// 						"Client_CreateStamp": {
		// 							value: "6/28/2017", // date of simulation
		// 							operator: "date_equals"
		// 						}
		// 					}
		// 				);

		// // if filters were specified and we're not looking at the simulation
		// // data, use those filters
		// } else if (params.filters) {
		// 	apiFilters = param.filters;
		// }

		// console.log(apiFilters);

		// // TODO load API key via ajax HTTP GET
		// console.log('retrieving keyJson')
		// $.get('php/apiKey.php', (keyJson) => {
		// 	console.log('keyJson retrieved')
		// 	console.log(keyJson);
		// 	App.test = keyJson
		// });

		// $.ajax({
	 //         url: "php/apiKey.php",
	 //         type: "POST",
	 //         data: { node: selectnod, option: "delete" },
	 //         cache: false,
	 //         success: function (response) {
	 //             $('#thenode').html(response);
	 //         }
	 //     });
	 // $.ajax({
		// 	url: "php/apiKey.php",
		// 	type: "POST",
	 //         success: function (auth) {
	 //         	console.log(JSON.parse(auth));
	 //         }
	 //     });

		$.ajax({
			type: 'get',
			// data: params.filters,
			// data: apiFilters,
			headers: {'Authorization-Token': '20lQLz13fgES56ngXYqnGDQTRPqY5bF7'},
			url: 'https://fluoncallproject.communityos.org/api/talus_client_search',
			success: function(data) {
				// if using simulation data, ignore any calls from before the day of the sim at 8am
				const filterSimData = true;
				if (App.useSimData && filterSimData) {
					let simEarliestTime = new Date('6/28/2017');
					simEarliestTime.setHours(0);
					simEarliestTime.setMinutes(0);
					simEarliestTime.setSeconds(0);

					let simLatestTime = new Date('6/28/2017');
					simLatestTime.setHours(23);
					simLatestTime.setMinutes(59);
					simLatestTime.setSeconds(59);

					let tempData = data;
					let outputData = [];
					tempData.data.forEach(d => {
						const curStamp = new Date(d.Client_CreateStamp);
						if ( curStamp >= simEarliestTime && curStamp <= simLatestTime) outputData.push(d);
					});
					// console.log(outputData)
					tempData.data = outputData;
					callback(tempData);

				} else {
					// console.log(data)
					callback(data);
					// callback(JSON.parse(data));
				}
			},
			error: function(){
				console.log('error');
			}
		});
		// $.ajax({
		// 	type: 'get',
		// 	data: {
		// 		account_api_key: '20lQLz13fgES56ngXYqnGDQTRPqY5bF7',
		// 		filters: {}
		// 	},
		// 	url: '/visionlink',
		// 	success: function(data) {
		// 		callback(data);
		// 	}
		// });
	}
	
	//Api.nasaData - TEST ONLY
	//Makes remote API call to NASA data and calls 'success' function if successful
	Api.getNasaData = (callback) => {

		// EXAMPLE: Retrieve NASA data (JSON)
		$.ajax({
			type: 'get',
			url: '/nasa',
			success: function(data) {
				//TO DO: Add code/function to post-process the data we receive
				//from the VisionLink API call so it can be plugged into the website.
				//But for now just print it to the console as a test.			
				App.nasaData = data;
				callback();
			}
		});
	}


	/* ------------------------------------ Fake Call Data API ----------------------------------- */
	// gets all calls but only within 60 days
	Api.getCalls = (filterFunc, callback) => {
		const callData = App.callData.filter((d) => {
			if (new Date(d.create_stamp) < App.earliestDate) return false;

			return filterFunc ? filterFunc(d) : true;
		});
		callback(callData);
	};

	// get all calls within a certain date range (must be within 60 days)
	Api.getCallsInRange = (dateRange, filterFunc, callback) => {
		Api.getCalls((d) => {
			const date = new Date(d.create_stamp);
			const inDateRange = date < dateRange[1] && date > dateRange[0];
			return inDateRange && filterFunc(d);
		}, callback);
	};

	// get all calls within this week for a certain region (i.e. national, state, center)
	Api.getThisWeekCallsInRegion = (resolution, id, callback) => {
		// define how calls should be filtered depending on resolution
		const filterFunc = App.getFilterFunc(resolution, id);
		Api.getCallsInRange([App.pwDate, App.cwDate], filterFunc, callback);
	};

	// get client data for a set of client ids
	Api.getClientData = (clientIds, callback) => {
		const subClientData = App.clientData.filter(d => clientIds.indexOf(d.client_id) > -1);
		callback(subClientData);
	};

	// for a given array of calls, returns a metric stored in client data
	Api.getClientMetricFromCalls = (callData, metric, callback) => {
		const clientValues = [];
		_.each(callData, (call) => {
			const clientId = call.client_id;
			const clientObj = App.clientData[parseInt(clientId)];
			// const clientObj = _.find(App.clientData, d => d.client_id === clientId);
			if (clientObj) clientValues.push(clientObj[metric]);
			else console.log('none found')
		});
		callback(clientValues);
	};

	// synchronous version of the above function
	Api.getClientMetricFromCallsSync = (callData, metric) => {
		const clientValues = [];
		callData.forEach((call) => {
			const clientId = call.client_id;
			const clientObj = App.clientData[parseInt(clientId)];
			// const clientObj = _.find(App.clientData, d => d.client_id === clientId);
			if (clientObj) clientValues.push(clientObj[metric]);
		});
		return(clientValues);
	};

})();
