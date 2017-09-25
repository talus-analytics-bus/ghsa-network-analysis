const App = {};

(() => {
	App.initialize = (callback) => {
		// define global variables used throughout
		App.geoData = null;  // geographic data of the world
		App.countries = [];  // an array of all countries and their properties
		App.fundingData = [];  // an array of all funding data
		App.currencies = {};  // a lookup of all global currencies
		App.currencyIso = 'USD';  // the default currency
		App.fundingLookup = {};  // a lookup of money funded for each country
		App.recipientLookup = {};  // a lookup of money received for each country


		// front-load all the data
		NProgress.start();
		d3.queue()
			.defer(d3.json, 'data/world.json')
			.defer(d3.json, 'data/funding_data_092117.json')
			.defer(d3.json, 'data/project_diseases.json')
			.defer(d3.json, 'data/project_functions.json')
			.defer(d3.json, 'data/currencies.json')
			.await((error, worldData, fundingData, diseases, functions, currencies) => {
				if (error) throw error;

				/* -------- Populate global variables -------- */
				// save geo data; save list of countries in namespace
				App.geoData = worldData;
				App.countries = worldData.objects.countries.geometries
					.map(c => c.properties);

				// save funding data
				App.fundingData = fundingData;

				// save diseases and functions
				App.diseases = diseases;
				App.functions = functions;

				// save currencies in namespace; set default currency
				App.currencies = Object.assign({}, currencies);
				App.currencyIso = 'USD';

				// populate lookup variables from funding data
				App.fundingData.forEach((d) => {
					const donor = d.donor_country;
					const recipient = d.recipient_country;

					// if datum has a parent value for fn or disease, convert to children
					// TODO this should be done in data
					/*for (let i = d.project_function.length - 1; i >= 0; i++) {
						const fnObj = App.functions.find(f => f.tag_name === d.project_function[i]);
						if (fnObj && fnObj.children.length) {
							d.project_function.splice(i, 1);
							d.project_function = d.project_function.concat(fnObj.children.map(f => f.tag_name));
						}
					}
					for (let i = d.project_disease.length - 1; i >= 0; i++) {
						const fnObj = App.functions.find(f => f.tag_name === d.project_disease[i]);
						if (fnObj && fnObj.children.length) {
							d.project_disease.splice(i, 1);
							d.project_disease = d.project_disease.concat(fnObj.children.map(f => f.tag_name));
						}
					}*/

					// store payments in lookup objects
					if (!App.fundingLookup[donor]) App.fundingLookup[donor] = [];
					App.fundingLookup[donor].push(d);
					if (!App.recipientLookup[recipient]) App.recipientLookup[recipient] = [];
					App.recipientLookup[recipient].push(d);
				});


				// call callback and finish progress bar
				if (callback) callback();
				NProgress.done();
			});
	};

	/* ------------------ Global Functions ------------------- */
	App.siFormat = num => d3.format(',.3s')(num).replace('G', 'B');
	App.formatMoneyShort = (usdValue) => {
		const multiplier = App.currencies[App.currencyIso].exchange_rates
			.find(er => er.convert_from === 'USD')
			.multiplier;
		return App.siFormat(usdValue * multiplier);
	};
	App.formatMoney = (usdValue) => {
		return `${App.formatMoneyShort(usdValue)} ${App.currencyIso}`;
	}
	App.formatMoneyFull = (usdValue) => {
		if (usdValue < 100) return `${Math.round(usdValue)} ${App.currencyIso}`;
		return `${d3.format(',.3r')(usdValue)} ${App.currencyIso}`;
	}

	/* ------------------ Vendor Defaults ------------------- */
	// change number of paging buttons shown in DataTables
	$.fn.DataTable.ext.pager.numbers_length = 6;

	// add sorting algorithm to DataTables library
	$.fn.dataTableExt.oSort['money-asc'] = (a, b) => {
		console.log(b);
		const aVal = Util.strToFloat(a);
		const bVal = Util.strToFloat(b);
		return (aVal < bVal) ? -1 : ((aVal > bVal) ? 1 : 0);
	}
	$.fn.dataTableExt.oSort['money-desc'] = (a, b) => {
		const aVal = Util.strToFloat(a);
		const bVal = Util.strToFloat(b);
		return (aVal < bVal) ? 1 : ((aVal > bVal) ? -1 : 0);
	}

	// tooltipster defaults
	$.tooltipster.setDefaults({
		contentAsHTML: true,
		trigger: 'hover',
		offset: [5, -25],
		theme: 'tooltipster-shadow',
		maxWidth: 320,
	});

	// noty defaults
	$.noty.defaults.type = 'warning';
	$.noty.defaults.layout = 'center';
	$.noty.defaults.timeout = 2000;
})();
