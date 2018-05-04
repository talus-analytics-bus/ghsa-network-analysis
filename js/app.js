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
			.defer(d3.json, 'data/updated_funding_data.json') // VERSION 13, created 23 March 2018
			.defer(d3.json, 'data/jee_score_data.json')
			.defer(d3.json, 'data/currencies.json')
			.await((error, worldData, unsdData, donorCodeData, fundingData, jeeData, currencies) => {
				if (error) throw error;

				/* -------- Populate global variables -------- */
				// save geo data; save list of countries in namespace
				App.geoData = worldData;
				App.countries = worldData.objects.countries.geometries
					.map(c => c.properties);

				// append Kosovo to countries data
				App.countries = App.countries.concat(
					{
					  "FIPS": "XK",
					  "ISO2": "XK",
					  "NAME": "Kosovo",
					  "POP2005": 1706000,
					  "regionName": "Europe",
					  "subRegionName": "Southern Europe",
					  "intermediateRegionName": ""
					}
				);

				// save region names to countries
				const regionMap = d3.map();
				unsdData.forEach((d) => {
					regionMap.set(d['ISO-alpha3 Code'], d);
				});
				App.countries.forEach((c) => {
					App.codeToNameMap.set(c.ISO2, c.NAME);
					if (c.ISO2 === "XK") return;
					const regionInfo = regionMap.get(c.ISO3);
					c.regionName = regionInfo['Region Name'];
					c.subRegionName = regionInfo['Sub-region Name'];
					c.intermediateRegionName = regionInfo['Intermediate Region Name'];
				});
				App.codeToNameMap.set('General Global Benefit', 'General Global Benefit');

				// fill code to name map
				donorCodeData.forEach((d) => {
					if (!App.codeToNameMap.has(d.donor_code)) {
						App.codeToNameMap.set(d.donor_code, d.donor_name);
					}
				});

				// save funding data
				App.fundingData = fundingData;

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

	App.getFlagHtml = (iso) => {
		if (iso !== "General Global Benefit") {
			return `<img class="flag" src="img/flags/${iso.toLowerCase()}.png" />`;
		} else {
			return `<img class="flag globe" src="img/flags/ggb.png" />`;
		}
	};

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

    App.setSources = () => {
        const content = '<a href="#about" style="font-size: 0.7em;">Data Sources</a>';
		// const tooltipContent = '<b>Sources</b><br>' +
		// 	'<a target="_blank" href="https://iatiregistry.org/">IATI</a><br>' +
		// 	'BTWC Article X Compendium<br>' +
		// 	'<a target="_blank" href="https://www.ghsagenda.org/docs/default-source/default-document-library/global-health-security-agenda-2017-progress-and-impact-from-u-s-investments.pdf">US GHSA Investment Report</a>';
        const tooltipContent = '<a href="#about" class="no-link"><u>Data Sources</u></a><br>' +
			'<div class="sources-tooltip-div">' +
			'IATI<br>' +
			'BTWC Article X Compendium<br>' +
			'US GHSA Investment Report' +
			'</div>';
        $('.source-text,.funds-source-text').html(content)
            .tooltipster({
                content: tooltipContent,
				contentAsHTML: true,
				interactive: true,
                side: 'bottom',
            });
    };


	/* ------------------ Format Functions ------------------- */
	App.siFormat = (num) => {
		if (!num) return '0';
		return d3.format(',.3s')(num).replace('G', 'B');
	};
	App.percentFormat = (num) => {
		return d3.format('.0%')(num);
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
