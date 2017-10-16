const App = {};

(() => {
	App.initialize = (callback) => {
		// data definition variables 
		App.dataStartYear = 2014;
		App.dataEndYear = 2017;

		// colors
		App.fundColor = '#084594';
		App.receiveColor = '#8c2d04';

		// define global variables used throughout
		App.geoData = null;  // geographic data of the world
		App.countries = [];  // an array of all countries and their properties
		App.fundingData = [];  // an array of all funding data
		App.currencies = {};  // a lookup of all global currencies
		App.currencyIso = 'USD';  // the default currency
		App.fundingLookup = {};  // a lookup of money funded for each country
		App.recipientLookup = {};  // a lookup of money received for each country
		App.codeToNameMap = d3.map();  // a lookup map of a donor_code to the country name
		App.capacities = [
			{ id: 'P.1', name: 'P.1 - National Legislation, Policy, and Financing' },
			{ id: 'P.2', name: 'P.2 - IHR Coordination, Communicaton and Advocacy' },
			{ id: 'P.3', name: 'P.3 - Antimicrobial Resistance (AMR)' },
			{ id: 'P.4', name: 'P.4 - Zoonotic Disease' },
			{ id: 'P.5', name: 'P.5 - Food Safety' },
			{ id: 'P.6', name: 'P.6 - Biosafety and Biosecurity' },
			{ id: 'P.7', name: 'P.7 - Immunization' },
			{ id: 'D.1', name: 'D.1 - National Laboratory System' },
			{ id: 'D.2', name: 'D.2 - Real Time Surveillance' },
			{ id: 'D.3', name: 'D.3 - Reporting' },
			{ id: 'D.4', name: 'D.4 - Workforce Development' },
			{ id: 'R.1', name: 'R.1 - Preparedness' },
			{ id: 'R.2', name: 'R.2 - Emergency Response Operations' },
			{ id: 'R.3', name: 'R.3 - Linking Public Health and Security Authorities' },
			{ id: 'R.4', name: 'R.4 - Medical Countermeasures and Personnel Deployment' },
			{ id: 'R.5', name: 'R.5 - Risk Communication' },
		];


		// front-load all the data
		NProgress.start();
		d3.queue()
			.defer(d3.json, 'data/world.json')
			.defer(d3.csv, 'data/unsd_data.csv')
			.defer(d3.json, 'data/donor_codes.json')
			.defer(d3.json, 'data/funding_data_101317_v9.json')
			.defer(d3.json, 'data/currencies.json')
			.await((error, worldData, unsdData, donorCodeData, fundingData, currencies) => {
				if (error) throw error;

				/* -------- Populate global variables -------- */
				// save geo data; save list of countries in namespace
				App.geoData = worldData;
				App.countries = worldData.objects.countries.geometries
					.map(c => c.properties);

				// save region names to countries
				const regionMap = d3.map();
				unsdData.forEach((d) => {
					regionMap.set(d['ISO-alpha3 Code'], d);
				});
				App.countries.forEach((c) => {
					const regionInfo = regionMap.get(c.ISO3);
					c.regionName = regionInfo['Region Name'];
					c.subRegionName = regionInfo['Sub-region Name'];
					c.intermediateRegionName = regionInfo['Intermediate Region Name'];
					App.codeToNameMap.set(c.ISO2, c.NAME);
				});

				// fill code to name map
				donorCodeData.forEach((d) => {
					if (!App.codeToNameMap.has(d.donor_code)) {
						App.codeToNameMap.set(d.donor_code, d.donor_name);
					}
				});

				// save funding data
				App.fundingData = fundingData;

				// save currencies in namespace; set default currency
				App.currencies = Object.assign({}, currencies);
				App.currencyIso = 'USD';

				// populate lookup variables from funding data
				App.fundingData.forEach((d, j) => {
					const donor = d.donor_code;
					const recipient = d.recipient_country;

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

		// links
		$('.navbar-brand span').click(() => hasher.setHash(''));
	};


	/* ------------------ Global Functions ------------------- */
	App.siFormat = (num) => {
		if (!num) return '0';
		return d3.format(',.3s')(num).replace('G', 'B');
	}
	App.formatMoneyShort = (usdValue) => {
		const multiplier = App.currencies[App.currencyIso].exchange_rates
			.find(er => er.convert_from === 'USD')
			.multiplier;
		const value = usdValue * multiplier;
		if (value < 100) return Math.round(value);
		return App.siFormat(value);
	};
	App.formatMoney = (usdValue) => {
		return `${App.formatMoneyShort(usdValue)} ${App.currencyIso}`;
	}
	App.formatMoneyFull = (usdValue) => {
		if (usdValue < 100) return `${Math.round(usdValue)} ${App.currencyIso}`;
		return `${d3.format(',.3r')(usdValue)} ${App.currencyIso}`;
	}


	/* ------------------ Data Functions ------------------- */
	// returns the total amount of money donated by a given country
	App.getTotalFunded = (iso) => {
		if (!App.fundingLookup[iso]) return 0;
		return d3.sum(App.fundingLookup[iso], d => d.total_spent);
	};
	App.getTotalFunded2 = (iso) => {
		if (!App.fundingLookup[iso]) return 0;
		return d3.sum(App.fundingLookup[iso], (p) => {
			let total = 0;
			for (let i = App.dataStartYear; i < App.dataEndYear + 1; i++) {
				total += p.spent_by_year[i];
			}
			return total;
		});
	};

	// returns the total amount of money received by a given country
	App.getTotalReceived = (iso) => {
		if (!App.recipientLookup[iso]) return 0;
		return d3.sum(App.recipientLookup[iso], d => d.total_spent);
	};


	/* ------------------ Misc Functions ------------------- */
	App.getFlagHtml = (iso) => {
		return `<img class="flag" src="img/flags/${iso.toLowerCase()}.png" />`;
	}


	/* ------------------ Vendor Defaults ------------------- */
	// change number of paging buttons shown in DataTables
	$.fn.DataTable.ext.pager.numbers_length = 6;

	// add sorting algorithm to DataTables library
	$.fn.dataTableExt.oSort['money-asc'] = (a, b) => {
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
