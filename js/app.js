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
		App.functions = [];  // an array of all functions
		App.diseases = [];  // an array of all diseases


		// front-load all the data
		NProgress.start();
		d3.queue()
			.defer(d3.json, 'data/world.json')
			.defer(d3.json, 'data/funding_data.json')
			.defer(d3.json, 'data/currencies.json')
			.await((error, worldData, fundingData, currencies) => {
				if (error) throw error;

				/* -------- Populate global variables -------- */
				// save geo data; save list of countries in namespace
				App.geoData = worldData;
				App.countries = worldData.objects.countries.geometries
					.map(c => c.properties);

				// save funding data
				App.fundingData = fundingData;

				// save currencies in namespace; set default currency
				App.currencies = Object.assign({}, currencies);
				App.currencyIso = 'USD';

				// populate lookup variables from funding data
				App.fundingData.forEach((d) => {
					const fn = d.project_function;
					const disease = d.project_disease;
					const donor = d.donor_country;
					const recipient = d.recipient_country;

					if (fn && App.functions.indexOf(fn) === -1) {
						App.functions.push(fn);
					}
					if (disease && App.diseases.indexOf(disease) === -1) {
						App.diseases.push(disease);
					}
					if (!App.fundingLookup[donor]) App.fundingLookup[donor] = [];
					App.fundingLookup[donor].push(d);
					if (!App.recipientLookup[recipient]) App.recipientLookup[recipient] = [];
					App.recipientLookup[recipient].push(d);
				});
				App.functions.sort();
				App.diseases.sort();


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

	/* ------------------ Vendor Defaults ------------------- */
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
