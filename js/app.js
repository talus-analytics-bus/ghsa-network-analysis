const App = {};

(() => {
	App.initialize = (callback) => {
		// initialize nav menu items
		$('.nav a').on('click', function(){
			const menuOption = $(this);
			const page = menuOption.attr('page');
			const hashArr = hasher.getHash().split('?');
			if (hashArr.length > 1) {
				hasher.setHash(`#${page}?${hashArr[1]}`);
			} else {
				hasher.setHash(`#${page}`);
			}
		});

		// data definition variables
		App.dataStartYear = 2014;
		App.dataEndYear = 2018;

		// Settings
		App.showGhsaOnly = false;

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
			.defer(d3.json, 'data/funding_data.json') // VERSION 14, created 4 May 2018
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
					if (c.ISO2 === "XK" || c.country === false) return;
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
					App.addOtherRecipients(d);
				});

				// save funding data
				fundingData = fundingData.filter(d => {
					if (d.assistance_type === undefined) {
						return true;
					} else if (d.assistance_type === "In-kind support") {
						return false;
					} else {
						return true;
					}
				});
				App.fundingData = fundingData;
				App.fundingDataFull = fundingData.map(d => $.extend(true, {}, d));
				
				// // save funding data
				// App.fundingData = fundingData.filter(d => d.ghsa_funding);
				// App.fundingDataFull = fundingData.map(d => $.extend(true, {}, d)).filter(d => d.ghsa_funding);

				// Prepare funding lookup tables, etc.
				App.loadFundingData({showGhsaOnly: false});

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

				// Create convenience variable for non-country funder/recipients
				App.nonCountries = App.countries.filter(d => d.country === false && d.NAME !== undefined);

				// call callback and finish progress bar
				if (callback) callback();
				NProgress.done();
			});

		// links
		$('.navbar-brand span').click(() => hasher.setHash(''));
	};


	/* ------------------ Data Functions ------------------- */
	// reloads the funding data to use GHSA Only or All
	App.loadFundingData = (params = {}) => {
		App.fundingLookup = {ghsa: [], };
		App.recipientLookup = {ghsa: [], };
		const ghsaFilter = params.showGhsaOnly ? (p) => p.ghsa_funding === true : (p) => p;
		// populate lookup variables from funding data
		App.fundingData = App.fundingDataFull.filter(ghsaFilter);
		App.fundingData.forEach((p) => {
			const donor = p.donor_code;
			const recipient = p.recipient_country;

			// store payments in lookup objects
			if (!App.fundingLookup[donor]) App.fundingLookup[donor] = [];
			App.fundingLookup[donor].push(p);
			if (!App.recipientLookup[recipient]) App.recipientLookup[recipient] = [];
			App.recipientLookup[recipient].push(p);
		
			// GHSA funding: store in 'ghsa' key
			// for both dictionaries
			if (p.ghsa_funding === true) {
				App.fundingLookup['ghsa'].push(p);
				App.recipientLookup['ghsa'].push(p);
			}

			// calculate per year spending/commits
			App.getFundsByYear(p);
		});
	};

	// returns the total amount of money donated by a given country
	App.getTotalFunded = (iso, params = {}) => {
		if (!App.fundingLookup[iso]) return 0;
		if (params.includeCommitments === true) {
			return d3.sum(App.fundingLookup[iso], d => d.total_spent + d.total_committed);
		}
		else {
			return d3.sum(App.fundingLookup[iso], d => d.total_spent);
		}
	};

	// returns the total amount of money received by a given country
	App.getTotalReceived = (iso, params = {}) => {
		if (!App.recipientLookup[iso]) return 0;
		if (params.includeCommitments === true) {
			return d3.sum(App.recipientLookup[iso], d => d.total_spent + d.total_committed);
		}
		else {
			return d3.sum(App.recipientLookup[iso], d => d.total_spent);
		}
	};

	App.getFundsByYear = (project) => {
		// console.log(project.transactions)
		const transactions = project.transactions;
		const spendTrans = transactions.filter(d => { return d.type === "disbursement" || d.type === "expenditure"; });
		const commitmentTrans = transactions.filter(d => { return d.type === "commitment"; });
		
		project.total_spent = 0.0;
		project.total_committed = 0.0;
		// const curYear = new Date().getFullYear();
		const curYear = App.dataEndYear;
		const minYear = App.dataStartYear;

		project.spent_by_year = {
			2014: 0.0,
			2015: 0.0,
			2016: 0.0,
			2017: 0.0,
			2018: 0.0,
		};
		spendTrans.forEach(transaction => {
			const transCy = transaction.cy;
			if (project.spent_by_year[transCy] === undefined) {
				project.spent_by_year[transCy] = transaction.amount;
			} else {
				project.spent_by_year[transCy] = project.spent_by_year[transCy] + transaction.amount;
			}
			if (parseInt(transCy) <= curYear && parseInt(transCy) >= minYear) project.total_spent = project.total_spent + transaction.amount;
		});

		project.committed_by_year = {
			2014: 0.0,
			2015: 0.0,
			2016: 0.0,
			2017: 0.0,
			2018: 0.0,
		};
		commitmentTrans.forEach(transaction => {
			const transCy = transaction.cy;
			if (project.committed_by_year[transCy] === undefined) {
				project.committed_by_year[transCy] = transaction.amount;
			} else {
				project.committed_by_year[transCy] = project.committed_by_year[transCy] + transaction.amount;
			}
			if (parseInt(transCy) <= curYear && parseInt(transCy) >= minYear) project.total_committed = project.total_committed + transaction.amount;
		});

		// set negative funds to zero
		transactions.forEach((transaction) => {
			if (transaction.amount < 0) transaction.amount = 0;
		});
	};

	App.addOtherRecipients = (codeObj) => {
		// if not a country
		if (codeObj.donor_sector === "Government") return;
		const code = codeObj.donor_code;
		const name = codeObj.donor_name;

		// add as a "country"
		App.countries = App.countries.concat(
			{
			  "FIPS": code,
			  "ISO2": code,
			  "NAME": name,
			  "acronym": codeObj.acronym,
			  "POP2005": 0,
			  "regionName": "Other Funders / Recipients",
			  "subRegionName": "Other Funders / Recipients",
			  "intermediateRegionName": "Other Funders / Recipients",
			  "country": false,
			}
		);
	};


	/* ------------------ Misc Functions ------------------- */
	App.getCountryName = (iso) => {
		if (App.codeToNameMap.has(iso)) return App.codeToNameMap.get(iso);
		return iso;
	};

	App.getFlagHtml = (iso) => {
		
		// If GGB, return the global image
		if (iso === "General Global Benefit") {
			return `<img class="flag globe" src="img/flags/ggb.png" />`;
		}

		// is this country?
		const match = App.countries.find(d => d.ISO2 === iso);
		if (match === undefined || match.country === false) {
			return '';
		} else {
			return `<img class="flag" src="img/flags/${iso.toLowerCase()}.png" />`;
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

	const sourceNames = [
		"International Aid Transparency Initiative (IATI)",
		"Article X Compendium",
		"2018 US GHSA Progress and Impact Report",
		"Ebola Recovery Tracking Initiative",
		"Nuclear Threat Initiative Commitment Tracker",
		"WHO Contingency Fund for Emergencies",
	];
    App.setSources = () => {

        const linkHtml = '<a href="#about" class="source-text">Data Sources</a>';
        let tooltipContent = '<a href="#about#sources" class="no-link data-source-header">Data Sources</a><div class="data-source-sep"></div><ul>';
        	sourceNames.forEach((sourceName) => {
        		tooltipContent += `<li>${sourceName}</li>`;
        	});
		tooltipContent += '</ul></div>';
        $('.source-text,.funds-source-text').html(linkHtml)
            .tooltipster({
                minWidth: 400,
                content: tooltipContent,
				contentAsHTML: true,
				interactive: true,
                side: 'bottom',
            });
    };

    App.setGhsaOnly = (ghsaOnly) => {
    	App.showGhsaOnly = ghsaOnly;
    }

    App.ghsaInfoTooltipContent = 'The Global Health Security Agenda (GHSA) is a partnership of nations, international organizations, and non-governmental stakeholders to help build countries’ capacity to help create a world safe and secure from infectious disease threats. Only resources that have specifically been identified as being committed or disbursed under the GHSA are identified as GHSA financial resources in the GHS Tracking Dashboard.';
    // App.ghsaInfoTooltipContent = 'The Global Health Security Agenda (GHSA) is a partnership of over 64 nations, international organizations, and non-governmental stakeholders to help build countries’ capacity to help create a world safe and secure from infectious disease threats and elevate global health security as a national and global priority. Only resources that have specifically been identified as being committed or disbursed under the GHSA are identified as GHSA financial resources in the GHS Tracking Dashboard';

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
