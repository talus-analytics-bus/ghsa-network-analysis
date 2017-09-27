const App = {};

(() => {
	// Keeps only those transactions associated with a project AID that has
	// a health sector group
	App.filterTransactionsBySector = () => {
		console.log('Loading transactions data...');
		d3.queue()
			.defer(d3.json, 'data/test.json')
			.await((error, data) => {
				console.log('test complete:');
				console.log(data);


				// Get list of activities with right sectors
				console.log("Getting list of 'aid' that are correct sector...")
				const sectorAid = _.unique(_.pluck(iatiActivities.rows,'aid'));
				console.log("Filtering transactions data by sector...");
				const dataBySector = data.filter(d => sectorAid.indexOf(d.aid) > -1);
				console.log(dataBySector);
			});
	};

	/* getIatiTransactions
	*  tests the IATI data downloaded into JSON format
	*/
	App.getIatiTransactions = () => {
		console.log('Running App.getIatiTransactions');

		$.ajax({
			type: 'post',
			url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=900000&from=trans,act,country&day_start_gt=2014-01-01&select=aid,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=trans,act,country&day_start_gt=2014-01-01&select=aid,reporting_ref,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=trans,sector,act,country&sector_group=121&sector_group=122&day_start_gt=2014-01-01&select=aid,reporting_ref,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			success: function(data) {
				console.log('got it!');
				console.log(data)
			},
			error: function(){
				console.log('error');
			}
		});
	};

	/* getIatiActivities
	*  tests the IATI data downloaded into JSON format
	*/
	App.getIatiActivities = () => {
		console.log('Running App.getIatiActivities');

		$.ajax({
			type: 'post',
			url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=sector,act&sector_group=121&sector_group=122&flags=0&select=aid,sector_code,day_start,day_end,spend,commitment,flags',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=sector,act&sector_group=121&sector_group=122&select=aid,sector_code,day_start,day_end,spend,commitment',
			success: function(data) {
				console.log('got it!');
				console.log(data)
			},
			error: function(){
				console.log('error');
			}
		});
	};


	/* getFunctionTags
	*  gets the function tags for the data
	*/
	App.getFunctionTags = (input) => {
		if (input === null || input === []) return [];
		// for each tag in the input arr
		outputTags = [];
		for (let i = 0; i < input.length; i++) {
			// get sector code text
			const sectorTag = Util.iatiSectorCodeHash[input[i]];
			if (sectorTag === undefined) continue;
			const outputTmp = Util.iatiDiseaseFunctionHash[sectorTag].function_tags;
			if (outputTmp === undefined) continue;
			if (outputTmp !== "") outputTags = _.union(outputTags, outputTmp.split('; '));
			else continue;
		}
		return outputTags;
	};

	/* getDiseaseTags
	*  gets the disease tags for the data
	*/
	App.getDiseaseTags = (input) => {
		if (input === null || input === []) return [];
		// for each tag in the input arr
		outputTags = [];
		for (let i = 0; i < input.length; i++) {
			// get sector code text
			const sectorTag = Util.iatiSectorCodeHash[input[i]];
			if (sectorTag === undefined) continue;
			const outputTmp = Util.iatiDiseaseFunctionHash[sectorTag].disease_tags;
			if (outputTmp === undefined) continue;
			if (outputTmp !== "") outputTags = _.union(outputTags, outputTmp.split('; '));
			else continue;
		}
		return outputTags;
	};

	/* getDonorData
	*  gets name, sector, and country of donor
	*/
	App.undefinedDonorNames = [];
	App.getDonorData = (input) => {
		// input is funder_ref (cross-reference with ctrack data)
		output = {};
		if (input === null) return {name: "Not reported", sector: "Not reported", country: "Not reported"};
		let donorData = publishers_data.find(d => d.publisher_iati_id === input);
		if (donorData === undefined) {
			donorData = Util.funder_aux_hash[input];
			if (donorData === undefined) App.undefinedDonorNames.push(input);
			// donorData = {name: 'error', sector: 'error', country:'error'};
			output.donor_name = donorData.name;
			output.donor_sector = donorData.sector;
			const donor_country_tmp = countries_json.find(d => d.NAME === donorData.country);
			if (donor_country_tmp !== undefined) output.donor_country = donor_country_tmp.ISO2;
			else output.donor_country = "Not reported";
			// output.donor_country = donorData.country;
		} else {
			output.donor_name = Util.publisher_names[input];
			output.donor_sector = Util.organization_type["OrganisationType"].find(d => d.code === donorData.publisher_organization_type).name;
			const donor_country_tmp = countries_json.find(d => d.ISO2 === donorData.publisher_country);
			if (donor_country_tmp === undefined) {
				output_donor_country = "International";
			} else {
				output.donor_country = donor_country_tmp.ISO2;
			}
		}
		if (output.donor_name === undefined) output.donor_name = "Not reported";
		if (output.donor_country === undefined) output.donor_country = "Not reported";
		if (output.donor_sector === undefined) output.donor_sector = "Not reported";
		return output;
	};

	/* getRecipientData
	*  gets name, sector, and country of recipient
	*/
	App.getRecipientData = (input) => {
		// input is country code, 2-char (cross-reference with country data)
		output = {};

		const country_data = countries_json.find(d => d.ISO2 === input);



		if (country_data === undefined) {
			const aux_country_hash = {
				"XK":"Kosovo",
				"SS":"South Sudan",
				"KES":"Kenya",
				"UK":"United Kingdom",
				"LBR":"Liberia",
				"TP":"Timor-Leste",
				"YV":"Venezuela",
				"QNB":"Venezuela"
			};
			output.recipient_name = aux_country_hash[input];
			if (output.recipient_name === undefined) {
				output = {recipient_name: "Not reported", recipient_sector: "Not reported", recipient_country: "Not reported" };
			}
		} else {
			output.recipient_name = country_data.NAME;
			output.recipient_sector = "Country";
			output.recipient_country = input; // country_code, 2-char
		}
		if (output.recipient_name === undefined) output.recipient_name = "Not reported";
		if (output.recipient_sector === undefined) output.recipient_sector = "Not reported";
		if (output.recipient_country === undefined) output.recipient_country = "Not reported";
		return output;
	};

	/* getTransType
	*  gets transaction type based on trans_code
	*/
	App.allTransTypes = [];
	App.getTransType = (input) => {
		App.allTransTypes.push(input);
		if (input === null) return 'not reported';

		// input is trans_code
		const output = Util.old_transaction_type[input].toLowerCase();
		return output;
	};


	/* mapDataIati
	*  map the IATI data downloaded into JSON format into the app data structure
	*/
	App.mapDataIati = () => {
		console.log('Running App.mapDataIati');

		// // check data
		// console.log(iatiRaw);

		// grab transactions
		let transactions = iatiRaw;

		const output = [];
		let projId = 0;
		
		// Grab unique project names
		let projNames = _.unique(_.pluck(transactions, 'aid'));
		
		for (let i  = 0; i < projNames.length; i++) {


			// get current project name ("aid" data field)
			const curProj_aid = projNames[i];

			// get all transactions associated with this project
			const projTrans = transactions.filter(d => d.aid === curProj_aid);

			// Grab unique recipient country codes
			let projCountryCodes = _.unique(_.pluck(projTrans, 'country_code'));

			// create project entry obj for each 'aid' and 'country_code' combo
			for (let j = 0; j < projCountryCodes.length; j++) {

				// Create new project for each recipient country
				const proj = {};

				// Get current country code (2-char)
				const curCountryCode = projCountryCodes[j];

				// Get transactions for this project 'aid' for this 'country_code'
				const projCountryTrans = projTrans.filter(d => d.country_code === curCountryCode);
				
				// project_id
				proj.project_id = 'proj.' + projId.toString();
				projId++;

				// grab the first transaction so we can reference its project-level data fields
				const firstProjTrans = projCountryTrans[0];

				// DEBUG store aid data
				proj.aid = firstProjTrans.aid;

				// project_name
				proj.project_name = firstProjTrans.title;
				
				// project_function
				// get sector codes for this activity (project)
				const curSectorCodes = _.unique(_.pluck(iatiActivities.rows.filter(d => d.aid === firstProjTrans.aid), 'sector_code'));
				// if (firstProjTrans.aid === "CA-3-D000514001") console.log(curSectorCodes);
				proj.project_function = App.getFunctionTags(curSectorCodes);

				// project_disease
				proj.project_disease = App.getDiseaseTags(curSectorCodes);

				// donor_country
				const curDonorData = App.getDonorData(firstProjTrans.funder_ref);
				proj.donor_country = curDonorData.donor_country;

				// donor_sectors
				proj.donor_sector = curDonorData.donor_sector;

				// donor_name
				proj.donor_name = curDonorData.donor_name;

				// channel
				// placeholder

				// recipient_country
				const curRecipientData = App.getRecipientData(firstProjTrans.country_code); // TODO
				proj.recipient_country = curRecipientData.recipient_country;

				// recipient_sector
				proj.recipient_sector = curRecipientData.recipient_sector;

				// recipient_name
				proj.recipient_name = curRecipientData.recipient_name;

				// process transactions data
				proj.transactions = [];

				for (let j = 0; j < projCountryTrans.length; j++) {
					const curTrans = {};

					// transactions[0].type
					curTrans.type = App.getTransType(projCountryTrans[j].trans_code);
					
					// transactions[0].amount
					curTrans.amount = parseFloat(projCountryTrans[j].trans_usd) * parseFloat(projCountryTrans[j].country_percent) / 100.0;

					// transactions[0].cy
					curTrans.cy = Util.SqlDayToYYYY(projCountryTrans[j].trans_day);

					// transactions[0].currency
					curTrans.currency = 'USD'; // always USD for IATI data

					// add transaction
					proj.transactions.push(curTrans);
				}

				let someCommitments = false;
				let someSpent = false;
				
				proj.total_committed = 0.0;
				proj.total_spent = 0.0;
				proj.transactions.forEach(d => {
					if (d.type === "commitment") {
						someCommitments = true;
						proj.total_committed += d.amount;
					} else if (d.type === "disbursement" || d.type === "expenditure") {
						someSpent = true;
						proj.total_spent += d.amount;
					}
				});

				if (!someCommitments) proj.total_committed = null;
				if (!someSpent) proj.total_spent = null;

				// total_currency
				proj.total_currency = 'USD'; // always USD for IATI for now

				// add project to output
				output.push(proj);
			}
		}

		console.log(output);

	};

	/* getData
	*  gets data from CSV file
	*/
	App.getData = (dataFn, callback) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/getCsvData', true);
		xhr.responseType = 'application/json';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				// console.log(JSON.parse(this.response)[0]);
				callback(JSON.parse(this.response)); // do stuff with the returned data
				// const blob = new Blob([this.response], {type: 'application/json'});
				// const downloadUrl = URL.createObjectURL(blob);
				// const a = document.createElement("a");
				// a.href = downloadUrl;

				// // // set file name
				// // const today = new Date();
				// // const year = today.getFullYear();
				// // let month = String(today.getMonth() + 1);
				// // if (month.length === 1) month = `0${month}`;
				// // let day = String(today.getDate());
				// // if (day.length === 1) day = `0${day}`;
				// // const yyyymmdd = `${year}${month}${day}`;
				// // const filenameStr = yyyymmdd + ' ' + App.whoAmI.abbreviation;

				// // a.download = "mvm_rules.json";
				// // // a.download = "IHR Costing Tool - Detailed Report - " + filenameStr + ".xlsx";
				// // document.body.appendChild(a);
				// // a.click();
				// // if (callback) callback(null);
				// return;
			}
			if (callback) callback(this.status);
		};
		xhr.send(JSON.stringify({
			dataFn: dataFn
		}));
	};

	App.hashDisease = {
		"Health - General": "General",
		"Maternal and Child Health": "Maternal and child health",
		"Nutrition": "Nutrition",
		"Water Supply and Sanitation": "Water supply and sanitation",
		"HIV/AIDS": "HIV/AIDS",
		"Malaria": "Malaria",
		"Other Public Health Threats": "Other",
		"Pandemic Influenza and Other Emerging Threats (PIOET)": "Pandemic influenza",
		"Tuberculosis": "Tuberculosis"
	};

	App.hashFunction = {
		"Project-type interventions": "Project-type interventions"
	};

	App.hashAidType = {
		"Contributions to specific-purpose programmes and funds managed by international organisations (multilateral, INGO)": "Contributions to specific-purpose programmes and funds managed by international organisations (multilateral, INGO)",
		"Core contributions to multilateral institutions": "Core contributions to multilateral institutions",
		"Donor country personnel": "Donor country personnel",
		"Other technical assistance": "Other technical assistance",
		"Project-type interventions": "Project-type interventions",
		"Sector budget support": "Sector budget support"
	};

	App.mapDisease = (input) => {
		const outputTmp = App.hashDisease[input];

		if (outputTmp !== undefined) return outputTmp;
		else return input; // TODO don't return input here, since it should throw an error
	};

	App.mapFunction = (input) => {
		const outputTmp = App.hashFunction[input];

		if (outputTmp !== undefined) return outputTmp;
		else return input; // TODO don't return input here, since it should throw an error
	};

	App.tagFaRecipient = (record, transaction) => {
		const specifiesCountry = transaction['Award Transaction - Recipient Country - Name'] !== "";
		const specifiesRegion = transaction['Award Transaction - Recipient Region - Name'] !== "";
		if (specifiesCountry) {
			const recipient_country = transaction['Award Transaction - Recipient Country - Name'];
			record.recipient_country = recipient_country;
			record.recipient_sector = "Country";
			record.recipient_name = recipient_country;
		} else if (specifiesRegion) {
			const recipient_region = transaction['Award Transaction - Recipient Region - Name'];
			if (recipient_region === "Worldwide") {
				// worldwide case
				record.recipient_country = 'Multiple countries (unspecified)';
				record.recipient_sector = "Country";
				record.recipient_name = 'Multiple countries (unspecified)';
			} else if (recipient_region === "Developing countries, unspecified") {
				// multiple countries case without region
				record.recipient_country = 'Multiple countries (unspecified)';
				record.recipient_sector = "Country";
				record.recipient_name = 'Multiple countries (unspecified)';
			} else {
				// region specified and really is region
				record.recipient_country = 'Multiple countries (regional)';
				record.recipient_sector = "Region";
				record.recipient_name = recipient_region;
			}
		}
	};


	App.mapDataFa = (rawData) => {
		console.log('record count = ' + rawData.length);

		// // EXAMPLE do AID-680-A-11-00001
		// const proj = rawData.filter(d => d['Award Identifier'] === "AID-680-A-11-00001");

		// get unique project IDs
		const uniqueProjectIds = _.unique(_.pluck(rawData, 'Award Identifier'));
		let id = 0;
		const allRecords = [];
		for (let i = 0; i < uniqueProjectIds.length; i++) {
			const proj = rawData.filter(d => d['Award Identifier'] === uniqueProjectIds[i]);
			if (proj.length === 0) continue;

			// match award location
			// write new record			
			const newRecord = {"project_id":"","project_name":"","project_function":"","project_disease":"","donor_country":"","donor_sector":"","donor_name":"","recipient_country":"","recipient_sector":"","recipient_name":"","cy_award_start":"","cy_award_end":"","total_committed":"","total_disbursed":"","transactions":[],"source":{"dataset_name":"","date_added_mmddyyyy":""}};
			id++;
			proj.forEach(transaction => {
				// get the transactions that match this one's recipient country
				const recipient_country = transaction['Award Transaction - Recipient Country - Name'];
				const this_country_transactions = proj.filter(d => d['Award Transaction - Recipient Country - Name'] === recipient_country && d.processed === undefined);
				
				if (this_country_transactions.length === 0) return;

				
				newRecord.donor_country = "United States of America";
				newRecord.donor_sector = "Government";
				newRecord.donor_name = transaction['Award Accountable Organization - Name'];

				// tag recipient country or region
				App.tagFaRecipient(newRecord, transaction);
				
				const cy_award_start = new Date(transaction['Award Date - Start Date - Date']).getFullYear().toString();
				const cy_award_end = new Date(transaction['Award Date - Start Date - Date']).getFullYear().toString();
				newRecord.cy_award_start = (cy_award_start !== "NaN") ? cy_award_start : "";
				newRecord.cy_award_end = (cy_award_end !== "NaN") ? cy_award_start : "";

				newRecord.source.dataset_name = "ForeignAssistance.gov";
				newRecord.source.date_added_mmddyyyy = "09122017"; // TODO auto date

				newRecord.project_disease = App.mapDisease(transaction['Award Transaction - Sector']);
				// newRecord.project_function = App.mapFunction(transaction['Award Transaction - Aid Type']);
				newRecord.project_function = App.hashAidType[transaction['Award Transaction - Aid Type']];
				newRecord.project_name = transaction['Award Title'];
				newRecord.project_id = id.toString(); // TODO find better ID to use
				newRecord.award_id = transaction['Award Identifier']; // TODO find better ID to use


				let total_committed_tmp = null;
				let total_disbursed_tmp = null;

				this_country_transactions.forEach(curTransaction => {
					curTransaction.processed = true;
					let cyForTransaction = new Date(transaction['Award Transaction - Value Date']).getFullYear().toString();
					if (cyForTransaction === "NaN") cyForTransaction = "";
					
					const newTransactionBlob = {
						type: curTransaction['Award Transaction - Type'].toLowerCase().trim(),
						amount: parseFloat(curTransaction['Award Transaction - Value']),
						cy: cyForTransaction
					};
					if (newTransactionBlob.type === 'disbursement') {
						if (total_disbursed_tmp === null) total_disbursed_tmp = newTransactionBlob.amount;
						else total_disbursed_tmp = total_disbursed_tmp + newTransactionBlob.amount;
					} else if (newTransactionBlob.type === 'commitment') {
						if (total_committed_tmp === null) total_committed_tmp = newTransactionBlob.amount;
						else total_committed_tmp = total_committed_tmp + newTransactionBlob.amount;
					}
					newRecord.transactions.push(newTransactionBlob);
				});

				newRecord.total_committed = total_committed_tmp;
				newRecord.total_disbursed = total_disbursed_tmp;
			});
			allRecords.push(newRecord);
		}
		console.log(allRecords);
	};
})();