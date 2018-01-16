const App = {};

(() => {
	App.initialize = (callback) => {
		// data definition variables
		App.dataStartYear = 2014;
		App.dataEndYear = 2017;

		// (purple, orange) color scheme
		/* App.fundColor = '#283375';
		App.receiveColor = '#aa4e2a';
		App.fundColorPalette = ['#283375', '#535c91', '#7e85ac', '#a9adc8', '#d4d6e3'];
		App.receiveColorPalette = ['#aa4e2a', '#bb7155', '#cc957f', '#ddb8aa', '#eedcd4'];*/

		// (purple, green) color scheme
		/*App.fundColor = '#762a83';
		App.receiveColor = '#1b7837';
		App.fundColorPalette = ['#40004b','#762a83','#9970ab','#c2a5cf','#e7d4e8', '#f7f7f7'];
		App.receiveColorPalette = ['#00441b', '#1b7837', '#5aae61', '#a6dba0', '#d9f0d3', '#f7f7f7'];*/

		// (blue, red) color scheme
		App.fundColor = '#053061';
		App.receiveColor = '#67001f';
		App.fundColorPalette = ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0'];
		App.receiveColorPalette = ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7'];

		// define global variables used throughout
		App.geoData = null;  // geographic data of the world
		App.countries = [];  // an array of all countries and their properties
		App.codeToNameMap = d3.map();  // a lookup map of a donor_code to the country name
		App.scoresByCountry = {};  // a lookup object of a donor_code to the country scores

		// funding variables
		App.fundingData = [];  // an array of all funding data
		App.currencies = {};  // a lookup of all global currencies
		App.currencyIso = 'USD';  // the default currency
		App.fundingLookup = {};  // a lookup of money funded for each country
		App.recipientLookup = {};  // a lookup of money received for each country
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
			{ id: 'PoE', name: 'PoE - Point of Entry (PoE)' },
			{ id: 'CE', name: 'CE - Chemical Events' },
			{ id: 'RE', name: 'RE - Radiation Emergencies' },
			{ id: 'General IHR Implementation', name: 'General IHR Implementation' },
		];


		// front-load all the data
		NProgress.start();
		d3.queue()
			.defer(d3.json, 'data/world.json')
			.defer(d3.csv, 'data/unsd_data.csv')
			.defer(d3.json, 'data/donor_codes.json')
			.defer(d3.json, 'data/funding_data_v13.json')
			.defer(d3.json, 'data/jee_score_data.json')
			.defer(d3.json, 'data/currencies.json')
			.await((error, worldData, unsdData, donorCodeData, fundingData, jeeData, currencies) => {
				if (error) throw error;

				/* -------- Populate global variables -------- */
				// save geo data; save list of countries in namespace
				App.geoData = worldData;
				App.countries = worldData.objects.countries.geometries
					.map(c => c.properties);

				// Add "General" as a country
				const general = {
				  "FIPS": "GEN",
				  "ISO2": "GEN",
				  "ISO3": "GEN",
				  "NAME": "General Global Benefit",
				  "regionName": "General",
				  "subRegionName": "General",
				  "intermediateRegionName": "General"
				};
				App.countries.push(general);

				// save region names to countries
				const regionMap = d3.map();
				unsdData.forEach((d) => {
					regionMap.set(d['ISO-alpha3 Code'], d);
				});
				App.countries.forEach((c) => {
					// if (c.regionName === "General") return;
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

				// DEBUG change iso of general
				App.fundingData.forEach((d) => {
					if (d.recipient_country === 'General') d.recipient_country = 'GEN';
				});

				// DEBUG crank up Canada donations to general global benefit
				App.fundingData.forEach((d, i) => {
					if (d.project_name === "Strengthening Export Controls and Border Security in the Americas and the Caribbean") {
						console.log('replacing data')
						App.fundingData[i] = {"project_name":"Strengthening Export Controls and Border Security in the Americas and the Caribbean","project_desc":"Canada is supporting the enhancement of export controls and border security measures to prevent the proliferation and trafficking of weapons of mass destruction (WMDs), their means of delivery and related materials, including enhanced implementation of strategic trade domestic controls of chemical, biological, radiological and nuclear (CBRN) materials. In the global fight against WMD proliferation, full and effective national implementation of all obligations under multilateral arms control agreements (including the adoption and application of effective export controls and border security measures) plays a critical role. ; To address these vulnerabilities, this Project is assisting partner states to establish or enhance domestic controls, adopt effective laws and implement comprehensive measures to prevent the proliferation of CBRN weapons and their means of delivery. Tailored activities include national needs assessments, development of legislative application plans and the provision of requisite equipment, training and related technical assistance to strengthen national and regional capacity to prevent, detect and respond to CBRN incidents. ; The Project is also supporting the development and/or enhancement of cargo targeting systems at select, high-volume Latin American and/or Caribbean ports of entry to strengthen capabilities to identify and track shipments of CBRN and other illicit goods and trade flows in and through the region.  It also directly support States Parties to the BTWC to fulfill their national obligations, including by facilitating participation at BTWC Meetings (e.g. Meetings of Experts and States Parties) and convening BTWC workshops and events.","core_capacities":["P.1","D.2","D.4","R.3","PoE"],"donor_sector":"Government","donor_code":"CA","donor_name":"Canada","recipient_sector":"Country","recipient_country":"GEN","recipient_name":"General","transactions":[{"type":"commitment","amount":3769008.5,"cy":2015,"currency":"USD"},{"type":"disbursement","amount":1256336.1666666667,"cy":2015,"currency":"USD"},{"type":"disbursement","amount":500000000,"cy":2016,"currency":"USD"},{"type":"disbursement","amount":1256336.1666666667,"cy":2017,"currency":"USD"}],"project_id":"proj.30093","total_spent":503769008,"total_committed":3769008.5,"spent_by_year":{"2014":0,"2015":1256336.1666666667,"2016":500000000,"2017":1256336.1666666667},"committed_by_year":{"2014":0,"2015":3769008.5,"2016":0,"2017":0},"total_currency":"USD","source":{"name":"GP BTWC Article X Assistance Compendium 2017","id":"","added_by":"Talus","mmddyyyy_added":"01032018"}};
					}
				});

				// save indicator scores by country
				jeeData.forEach((sRow) => {
					const indId = sRow.indicator.split(' ')[0];
					let capId = indId.split('.').slice(0, 2).join('.');
					if (capId.split('.')[0] === 'PoE') capId = 'O.1';

					// check that capacity id is valid
					if (!App.capacities.some(cc => cc.id === capId)) return;

					// add to array in lookup object
					// TODO this all assumes there's only ONE set of data for each country
					if (!App.scoresByCountry[sRow.code]) {
						App.scoresByCountry[sRow.code] = {
							month: sRow.month,
							year: sRow.year,
							avgScore: null,
							avgCapScores: [],
							indScores: {},
						};
					}
					const c = App.scoresByCountry[sRow.code];
					if (!c.indScores[capId]) c.indScores[capId] = [];
					c.indScores[capId].push({
						indId,
						score: sRow.score,
					});
				});

				// roll up indicator scores and write average capacity and overall scores
				for (const iso in App.scoresByCountry) {
					const c = App.scoresByCountry[iso];
					for (const capId in c.indScores) {
						const capScore = d3.mean(c.indScores[capId], d => d.score);
						c.avgCapScores.push({
							capId,
							score: capScore,
						});
					}
					c.avgScore = d3.mean(c.avgCapScores, d => d.score);
				}

				// save currencies in namespace; set default currency
				App.currencies = Object.assign({}, currencies);
				App.currencyIso = 'USD';

				// populate lookup variables from funding data
				App.fundingData.forEach((p) => {
					const donor = p.donor_code;
					const recipient = p.recipient_country;

					// store payments in lookup objects
					if (!App.fundingLookup[donor]) App.fundingLookup[donor] = [];
					App.fundingLookup[donor].push(p);
					if (!App.recipientLookup[recipient]) App.recipientLookup[recipient] = [];
					App.recipientLookup[recipient].push(p);
				});

				// call callback and finish progress bar
				if (callback) callback();
				NProgress.done();
			});

		// links
		$('.navbar-brand span').click(() => hasher.setHash(''));
	};


	/* ------------------ Data Functions ------------------- */
	// returns the total amount of money donated by a given country
	App.getTotalFunded = (iso) => {
		if (!App.fundingLookup[iso]) return 0;
		return d3.sum(App.fundingLookup[iso], d => d.total_spent);
	};

	// returns the total amount of money received by a given country
	App.getTotalReceived = (iso) => {
		if (!App.recipientLookup[iso]) return 0;
		return d3.sum(App.recipientLookup[iso], d => d.total_spent);
	};


	/* ------------------ Misc Functions ------------------- */
	App.getCountryName = (iso) => {
		if (App.codeToNameMap.has(iso)) return App.codeToNameMap.get(iso);
		return iso;
	};

	App.getFlagHtml = iso => `<img class="flag" src="img/flags/${iso.toLowerCase()}.png" />`;

	App.getScoreNameHtml = (score) => {
		let className = '';
		if (score >= 3.5) className = 'text-success';
		if (score < 1.5) className = 'text-danger';
		return `<b class="${className}">${App.getScoreName(score)}</b>`;
	};

	App.getScoreName = (score) => {
		if (score < 1.5) return 'No Capacity';
		else if (score < 2.5) return 'Limited Capacity';
		else if (score < 3.5) return 'Developed Capacity';
		else if (score < 4.5) return 'Demonstrated Capacity';
		return 'Sustained Capacity';
	};


	/* ------------------ Format Functions ------------------- */
	App.siFormat = (num) => {
		if (!num) return '0';
		return d3.format(',.3s')(num).replace('G', 'B');
	};
	App.formatMoneyShort = (usdValue) => {
		const multiplier = App.currencies[App.currencyIso].exchange_rates
			.find(er => er.convert_from === 'USD')
			.multiplier;
		const value = usdValue * multiplier;
		if (value < 100) return Math.round(value);
		return App.siFormat(value);
	};
	App.formatMoney = usdValue => `${App.formatMoneyShort(usdValue)} ${App.currencyIso}`;
	App.formatMoneyFull = (usdValue) => {
		if (usdValue < 100) return `${Math.round(usdValue)} ${App.currencyIso}`;
		return `${d3.format(',.3r')(usdValue)} ${App.currencyIso}`;
	};


	/* ------------------ Vendor Defaults ------------------- */
	// change number of paging buttons shown in DataTables
	$.fn.DataTable.ext.pager.numbers_length = 6;

	// add sorting algorithm to DataTables library
	$.fn.dataTableExt.oSort['money-asc'] = (a, b) => {
		const aVal = Util.strToFloat(a);
		const bVal = Util.strToFloat(b);
		if (aVal < bVal) return -1;
		return aVal > bVal ? 1 : 0;
	};
	$.fn.dataTableExt.oSort['money-desc'] = (a, b) => {
		const aVal = Util.strToFloat(a);
		const bVal = Util.strToFloat(b);
		if (aVal < bVal) return 1;
		return aVal > bVal ? -1 : 0;
	};

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
