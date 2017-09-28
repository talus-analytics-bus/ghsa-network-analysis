const App = {};

(() => {
	App.initialize = (callback) => {
		// data definition variables 
		App.dataStartYear = 2014;
		App.dataEndYear = 2017;

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
			.defer(d3.json, 'data/funding_data_092817.json')
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


	/* ------------------ Category Functions ------------------- */
	App.initCategorySelect = (selector, data, options) => {
		const $select = $(selector);
		const optgroups = d3.select(selector).selectAll('optgroup')
			.data(data)
			.enter().append('optgroup')
				.attr('label', d => d.tag_name)
				.text(d => d.tag_name);
		optgroups.selectAll('option')
			.data(d => d.children.length ? d.children : [d])
			.enter().append('option')
				.attr('selected', true)
				.attr('value', d => d.tag_name)
				.text(d => d.tag_name);

		// copy options over and initialize multiselect
		const opts = {
			maxHeight: 260,
			includeSelectAllOption: true,
			enableClickableOptGroups: true,
			numberDisplayed: 0,
		};
		for (let ind in options) opts[ind] = options[ind];
		$select.multiselect(opts);

		// hide optgroups with only one option
		// (this is a workaround fix for optgroup bug in bootstrap multiselect)
		const multiselect = $select.next('.btn-group');
		const groups = multiselect.find('.multiselect-group')
			.each(function loop() {
				const $optgroup = $(this);
				const options = $optgroup.nextUntil('.multiselect-group');
				if (options.length === 1) {
					$optgroup.hide();
					options.addClass('primary-option');
				}
			});
	};

	App.getCategorySelectValue = (selector) => {
		const value = [];
		const multiselect = $(selector).next('.btn-group');
		const optgroups = multiselect.find('.multiselect-group');
		optgroups.each(function loop() {
			const $optgroup = $(this);
			const children = [];
			const allOptions = $optgroup.nextUntil('.multiselect-group');
			const activeOptions = allOptions
				.filter('.active')
				.each(function loopChildren() {
					children.push($(this).find('input').attr('value'));
				});
			if (activeOptions.length || ($optgroup.hasClass('active') && !allOptions.length)) {
				value.push({
					tag_name: $optgroup.find('b').text().trim(),
					children,
				});
			}
		});
		return value;
	};

	App.passesCategoryFilter = (values, filterValues) => {
		let pass = false;
		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			const parent = filterValues.find(d => d.tag_name === value.p);
			if (parent) {
				if (!value.c || (value.c && parent.children.includes(value.c))) {
					pass = true;
					break;
				}
			}
		}
		return pass;
	};


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
