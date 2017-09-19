(() => {
	App.initHome = () => {
		// lookup variables used throughout
		const fundingLookup = {};  // a lookup of money funded for each country
		const recipientLookup = {};  // a lookup of money received for each country
		let allCountries = [];  // an array of all countries and properties
		const allFunctions = [];  // an array of all functions
		const allDiseases = [];  // an array of all diseases

		// other variables
		let map;
		let liveSearchTimeout;  // timeout for country search

		// colors
		const purples = ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8',
			'#807dba', '#6a51a3'];


		// function for initializing the page
		function init() {
			NProgress.start();

			// load world data
			d3.queue()
				.defer(d3.json, 'data/world.json')
				.defer(d3.json, 'data/funding_data.json')
				.defer(d3.json, 'data/currencies.json')
				.await((error, worldData, fundingData, currencyData) => {
					if (error) throw error;
					console.log(fundingData);

					// populate country data variable
					allCountries = worldData.objects.countries.geometries.map((c) => {
						return c.properties;
					});

					// build map and initialize search
					map = buildMap(worldData);
					initSearch(worldData);

					// populate lookups
					populateLookupVariables(fundingData);

					// populate filters and update map
					populateFilters(fundingData, currencyData);
					updateMap();

					NProgress.done();
				});
		}


		/* ---------------------- Functions ----------------------- */
		// builds the map and attaches tooltips to countries
		function buildMap(worldData) {
			// add map to map container
			const map = Map.createWorldMap('.map-container', worldData);

			// TODO attach tooltips to countries
			d3.selectAll('.country').each(function addTooltip(d) {
				$(this).tooltipster({
					plugins: ['follower'],
					delay: 100,
					content: d.properties.NAME,
				});
			});

			return map;
		}

		// returns the proper country lookup object based on type (donor vs recipient)
		function getDataLookup() {
			const moneyType = $('.money-type-filter input:checked').attr('ind');
			if (moneyType === 'funded') return fundingLookup;
			return recipientLookup;
		}

		// given a set of payments, returns the sum value after applying filters
		function getCountryDataValue(payments) {
			return d3.sum(payments, p => p.total_committed);
		}

		// returns color scale based on map settings
		function getColorScale() {
			return d3.scaleQuantile().range(purples);
		}

		// updates map colors
		function updateMap() {
			const dataLookup = getDataLookup();

			// transfer lookup to data map, and only include valid country codes
			const dataMap = d3.map();
			allCountries.forEach((c) => {
				if (dataLookup[c.ISO3]) {
					const payments = dataLookup[c.ISO3];
					const value = getCountryDataValue(payments);
					dataMap.set(c.ISO3, value);
				}
			});

			// get color scale and set domain
			const colorScale = getColorScale();
			colorScale.domain(dataMap.values());

			// color countries
			d3.selectAll('.country').style('fill', (d) => {
				const isoCode = d.properties.ISO3;
				if (dataMap.has(isoCode)) {
					return d.color = colorScale(dataMap.get(isoCode));
				}
				return d.color = '#ccc';
			});
		}

		// initializes search functionality
		function initSearch(worldData) {
			// set search bar behavior
			$('.country-search-input')
				.on('focus', function() { searchForCountry($(this).val()); })
				.on('blur', function() {
					clearTimeout(liveSearchTimeout);
					$('.live-search-results-container').hide();
				})
				.on('keyup', function(ev) {
					clearTimeout(liveSearchTimeout);
					const searchVal = $(this).val();
					if (ev.which === 13) {
						// enter: perform search immediately
						searchForCountry(searchVal);
					} else {
						// perform search when user stops typing for 250ms
						liveSearchTimeout = setTimeout(function() {
							searchForCountry(searchVal);
						}, 250);
					}
				});
		}

		// displays country search results
		function searchForCountry(searchVal) {
			const $resultsBox = $('.live-search-results-container');
			if (searchVal.trim() === '') {
				$resultsBox.hide();
				return;
			}
			
			// show live search box under search bar
			const fuse = new Fuse(countries, {
				threshold: 0.3,
				distance: 1e5,
				keys: ['ISO2', 'ISO3', 'FIPS', 'NAME'],
			});
			const results = fuse.search(searchVal);
			
			// show results in boxes under search input
			$resultsBox.show();
			if (results.length === 0) {
				$resultsBox.find('.live-search-no-results-text').show();
				$resultsBox.find('.live-search-results-contents').hide();
			} else {
				$resultsBox.find('.live-search-no-results-text').hide();
				$resultsBox.find('.live-search-results-contents').show();

				let boxes = d3.select($resultsBox[0])
					.select('.live-search-results-contents')
					.selectAll('.live-search-results-box')
						.data(results.slice(0, 4));
				boxes.exit().remove();

				const newBoxes = boxes.enter().append('div')
					.attr('class', 'live-search-results-box');
				newBoxes.append('div')
					.attr('class', 'live-search-results-title');
				newBoxes.append('div')
					.attr('class', 'live-search-results-subtitle');
					
				boxes = boxes.merge(newBoxes)
					.attr('code', d => d.abbreviation)
					.on('mousedown', (d) => {
						// clear input
						$('.country-search-input').val('');

						// TODO
					});
				boxes.select('.live-search-results-title')
					.text(d => `${d.NAME} (${d.ISO3})`);
				boxes.select('.live-search-results-subtitle')
					.text(d => `Population: ${Util.comma(d.POP2005)}`);
			}
		}

		// populates the filters in the map options box
		function populateFilters(fundingData, currencyData) {
			// get unique values from data
			const currencies = Object.values(currencyData)
				.sort((a, b) => d3.ascending(a.name, b.name));

			// populate dropdowns
			Util.populateSelect('.function-select', allFunctions, { selected: true });
			Util.populateSelect('.disease-select', allDiseases, { selected: true });
			Util.populateSelect('.currency-select', currencies, {
				nameKey: d => `${Util.capitalize(d.name)} (${d.iso.code})`,
				valKey: d => d.iso.code,
			});

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				dropRight: true,
				includeSelectAllOption: true,
				numberDisplayed: 0,
			});

			// select USD as default
			$('.currency-select').val('USD');

			// attach change behavior
			$('.map-options-container .radio-option').click(function clickedRadio() {
				const $option = $(this);
				$option.find('input').prop('checked', true);
				$option.siblings().find('input').prop('checked', false);
				updateMap();
			});
			$('.map-options-container select').on('change', updateMap);

			// show map options
			$('.map-options-container').show();
		}

		// populates lookup objects based on funding data
		function populateLookupVariables(fundingData) {
			fundingData.forEach((d) => {
				const fn = d.project_function;
				const disease = d.project_disease;
				const donor = d.donor_country;
				const recipient = d.recipient_country;

				if (fn && allFunctions.indexOf(fn) === -1) {
					allFunctions.push(fn);
				}
				if (disease && allDiseases.indexOf(disease) === -1) {
					allDiseases.push(disease);
				}
				if (!fundingLookup[donor]) fundingLookup[donor] = [];
				fundingLookup[donor].push(d);
				if (!recipientLookup[recipient]) recipientLookup[recipient] = [];
				recipientLookup[recipient].push(d);
			});
			allFunctions.sort();
			allDiseases.sort();
		}

		init();
	}
})();
