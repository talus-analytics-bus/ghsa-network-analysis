(() => {
	App.initHome = () => {
		// lookup variables used throughout
		const fundingLookup = {};  // a lookup of money funded for each country
		const recipientLookup = {};  // a lookup of money received for each country
		const allFunctions = [];  // an array of all functions
		const allDiseases = [];  // an array of all diseases

		// other variables
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
		let currentDataMap = d3.map();  // the current data map

		// colors
		const purples = ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8',
			'#807dba', '#6a51a3'];


		// function for initializing the page
		function init() {
			// build map and initialize search
			map = buildMap();
			initSearch();

			// populate lookups and filters
			populateLookupVariables();
			populateFilters();

			// update map
			updateAll();
		}


		/* ---------------------- Functions ----------------------- */
		// builds the map and attaches tooltips to countries
		function buildMap() {
			// add map to map container
			const mapObj = Map.createWorldMap('.map-container', App.geoData);

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

		// returns color scale based on map settings
		function getColorScale() {
			return d3.scaleQuantile().range(purples);
		}

		// updates data map and map
		function updateAll() {
			updateDataMap();
			updateMap();
		}

		// updates the country to value data map based on user settings
		function updateDataMap() {
			// get lookup (has all data)
			let dataLookup = fundingLookup;
			if (getMoneyType() === 'received') dataLookup = recipientLookup;

			// get filter values
			let functions = $('.function-select').val();
			let diseases = $('.disease-select').val();
			if (!functions.length) functions = allFunctions;
			if (!diseases.length) diseases = allDiseases;

			// filter data and only use data with valid country values
			currentDataMap.clear();
			App.countries.forEach((c) => {
				const payments = dataLookup[c.ISO3];
				if (payments) {
					const filteredPayments = payments
						.filter(p => functions.includes(p.project_function))
						.filter(p => diseases.includes(p.project_disease));
					const value = d3.sum(filteredPayments, p => p.total_committed);
					currentDataMap.set(c.ISO3, value);
				}
			});
		}

		// updates map colors
		function updateMap() {
			const moneyType = getMoneyType();

			// get color scale and set domain
			const colorScale = getColorScale();
			colorScale.domain(currentDataMap.values());

			// color countries and update tooltip content
			d3.selectAll('.country')
				.style('fill', (d) => {
					const isoCode = d.properties.ISO3;
					if (currentDataMap.has(isoCode)) {
						d.value = currentDataMap.get(isoCode);
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
						.text(App.formatMoney(d.value));
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
					return App.formatMoneyShort(quantiles[i]);
				});

			// update legend title
			let titleText = getMoneyType() === 'funded' ?
				'Funds Donated' : 'Funds Received';
			titleText += ` (in ${App.currencyIso})`;
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
			let totalValue = 0;
			if (currentDataMap.has(d.properties.ISO3)) {
				totalValue = currentDataMap.get(d.properties.ISO3);
			}

			// populate info container
			$('.info-title').text(d.properties.NAME);
			$('.info-value').text(App.formatMoney(totalValue));
			$('.info-container').slideDown();
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.country-search-input', App.countries, (result) => {
				// get country element
				const country = d3.selectAll('.country')
					.filter(c => result.ISO3 === c.properties.ISO3);

				// set country as active
				activeCountry.classed('active', false);
				activeCountry = country.classed('active', true);

				// zoom in to country
				map.zoomTo.call(activeCountry.node(), activeCountry.datum());
				displayCountryInfo(activeCountry.datum());
			});
		}

		// populates the filters in the map options box
		function populateFilters() {
			// populate dropdowns
			Util.populateSelect('.function-select', allFunctions, { selected: true });
			Util.populateSelect('.disease-select', allDiseases, { selected: true });

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				dropRight: true,
				includeSelectAllOption: true,
				numberDisplayed: 0,
			});

			// attach change behavior
			$('.map-options-container .radio-option').click(function clickedRadio() {
				const $option = $(this);
				$option.find('input').prop('checked', true);
				$option.siblings().find('input').prop('checked', false);
				updateAll();
			});
			$('.map-options-container select').on('change', updateAll);

			// show map options
			$('.map-options-container').show();
		}

		// populates lookup objects based on funding data
		function populateLookupVariables() {
			App.fundingData.forEach((d) => {
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
