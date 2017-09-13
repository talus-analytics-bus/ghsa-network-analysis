const App = {};

(() => {
	App.test = () => {
		// console.log(faRaw);
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