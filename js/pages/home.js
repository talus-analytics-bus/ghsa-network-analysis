(() => {
	App.initHome = () => {
		// lookup variables used throughout
		const fundingLookup = {};  // a lookup of money funded for each country
		const recipientLookup = {};  // a lookup of money received for each country
		let allCountries = [];  // an array of all countries and properties
		const allFunctions = [];  // an array of all functions
		const allDiseases = [];  // an array of all diseases

		// other variables
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
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
				.await((error, worldData, fundingData) => {
					if (error) throw error;

					// populate country data variable
					allCountries = worldData.objects.countries.geometries
						.map(c => c.properties);

					// build map and initialize search
					map = buildMap(worldData);
					initSearch();

					// populate lookups
					populateLookupVariables(fundingData);

					// populate filters and update map
					populateFilters();
					updateMap();

					NProgress.done();
				});
		}


		/* ---------------------- Functions ----------------------- */
		// builds the map and attaches tooltips to countries
		function buildMap(worldData) {
			// add map to map container
			const mapObj = Map.createWorldMap('.map-container', worldData);

			// clicking overlay resets map
			mapObj.element.select('.overlay').on('click', resetMap);

			// define country click behavior and attach tooltips
			d3.selectAll('.country')
				.on('click', function onClick(d) {
					// set country as active
					if (activeCountry.node() === this) return resetMap();
					activeCountry.classed('active', false);
					activeCountry = d3.select(this).classed('active', true);

					// zoom in to country
					mapObj.zoomTo.call(this, d);

					// display info box
					displayCountryInfo(activeCountry.datum());
				})
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						delay: 100,
						minWidth: 200,
						content: d.properties.NAME,
					});
				});

			return mapObj;
		}

		function resetMap() {
			map.reset();
			activeCountry.classed('active', false);
			activeCountry = d3.select(null);
			$('.info-container').slideUp();
		}

		// gets the money type being displayed (donor vs recipient)
		function getMoneyType() {
			return $('.money-type-filter input:checked').attr('ind');
		}

		// returns the proper country lookup object based on type (donor vs recipient)
		function getDataLookup() {
			if (getMoneyType() === 'funded') return fundingLookup;
			return recipientLookup;
		}

		// given a set of payments, returns the sum value after applying filters
		function getCountryDataValue(payments) {
			if (!payments) return 0;
			return d3.sum(payments, p => p.total_committed);
		}

		// returns color scale based on map settings
		function getColorScale() {
			return d3.scaleQuantile().range(purples);
		}

		// updates map colors
		function updateMap() {
			const currencyIso = $('.currency-select').val();
			const moneyType = getMoneyType();
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

			// color countries and update tooltip content
			d3.selectAll('.country')
				.style('fill', (d) => {
					const isoCode = d.properties.ISO3;
					if (dataMap.has(isoCode)) {
						d.value = dataMap.get(isoCode);
						d.color = colorScale(d.value);
					} else {
						d.value = null;
						d.color = '#ccc';
					}
					return d.color;
				})
				.each(function updateTooltip(d) {
					const container = d3.select(document.createElement('div'));
					container.append('div')
						.attr('class', 'tooltip-title')
						.text(d.properties.NAME);
					container.append('div')
						.attr('class', 'tooltip-main-value')
						.text(App.formatMoney(d.value, currencyIso));
					container.append('div')
						.attr('class', 'tooltip-main-value-label')
						.text(moneyType === 'funded' ? 'Donated' : 'Received');

					$(this).tooltipster('content', container.html());
				});

			updateLegend(colorScale);
		}

		// update the map legend
		function updateLegend(colorScale) {
			const barHeight = 16;
			const barWidth = 70;
			const legendPadding = 20;

			const colors = colorScale.range();
			const quantiles = colorScale.quantiles();
			const currencyIso = $('.currency-select').val();

			const legend = d3.select('.legend')
				.attr('width', barWidth * colors.length + 2 * legendPadding)
				.attr('height', barHeight + 50)
				.select('g')
					.attr('transform', `translate(${legendPadding}, 0)`);
			let legendGroups = legend.selectAll('g')
				.data(colors);
			legendGroups.exit().remove();

			const newLegendGroups = legendGroups.enter().append('g');
			newLegendGroups.append('rect')
				.attr('class', 'legend-bar');
			newLegendGroups.append('text')
				.attr('class', 'legend-text');

			legendGroups = legendGroups.merge(newLegendGroups)
				.attr('transform', (d, i) => `translate(${barWidth * i}, 0)`);
			legendGroups.select('.legend-bar')
				.attr('width', barWidth)
				.attr('height', barHeight)
				.style('fill', d => d);
			legendGroups.select('.legend-text')
				.attr('x', barWidth)
				.attr('y', barHeight + 12)
				.attr('dy', '.35em')
				.text((d, i) => {
					if (i >= quantiles.length) return '';
					return App.siFormat(quantiles[i]);
				});

			// update legend title
			let titleText = getMoneyType() === 'funded' ?
				'Funds Donated' : 'Funds Received';
			titleText += ` (in ${currencyIso})`;
			const legendTitle = legend.selectAll('.legend-title')
				.data([titleText]);
			const nlt = legendTitle.enter().append('text')
				.attr('class', 'legend-title');
			legendTitle.merge(nlt)
				.attr('x', barWidth * colors.length / 2)
				.attr('y', barHeight + 48)
				.text(d => d);

			$('.legend-container').slideDown();
		}

		// displays detailed country information
		function displayCountryInfo(d) {
			// get total value
			const currencyIso = $('.currency-select').val();
			const dataLookup = getDataLookup();
			const payments = dataLookup[d.properties.ISO3];
			const totalValue = getCountryDataValue(payments);

			$('.info-title').text(d.properties.NAME);
			$('.info-value').text(App.formatMoney(totalValue, currencyIso));
			$('.info-container').slideDown();
		}

		// initializes search functionality
		function initSearch() {
			// set search bar behavior
			$('.country-search-input')
				.on('focus', function focus() { searchForCountry($(this).val()); })
				.on('blur', () => {
					clearTimeout(liveSearchTimeout);
					$('.live-search-results-container').hide();
				})
				.on('keyup', function keyUp(ev) {
					clearTimeout(liveSearchTimeout);
					const searchVal = $(this).val();
					if (ev.which === 13) {
						// enter: perform search immediately
						searchForCountry(searchVal);
					} else {
						// perform search when user stops typing for 250ms
						liveSearchTimeout = setTimeout(() => {
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
			const fuse = new Fuse(allCountries, {
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

				boxes = boxes.merge(newBoxes).on('mousedown', (d) => {
					// clear input
					$('.country-search-input').val('');

					// get country element
					const country = d3.selectAll('.country')
						.filter(c => d.ISO3 === c.properties.ISO3);

					// set country as active
					activeCountry.classed('active', false);
					activeCountry = country.classed('active', true);

					// zoom in to country
					map.zoomTo.call(activeCountry.node(), activeCountry.datum());
					displayCountryInfo(activeCountry.datum());
				});
				boxes.select('.live-search-results-title')
					.text(d => `${d.NAME} (${d.ISO3})`);
				boxes.select('.live-search-results-subtitle')
					.text(d => `Population: ${Util.comma(d.POP2005)}`);
			}
		}

		// populates the filters in the map options box
		function populateFilters() {
			// get unique values from data
			const currencies = Object.values(App.currencies)
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
	};
})();
