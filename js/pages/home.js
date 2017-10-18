(() => {
	App.initHome = () => {
		// variables used throughout home page
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
		const currentNodeDataMap = d3.map();  // maps country iso to the value on map
		let startYear = App.dataStartYear;  // the start year of the time range shown
		let endYear = App.dataEndYear + 1;  // the end year of the time range shown

		// colors
		const purples = ['#e0ecf4', '#bfd3e6', '#9ebcda',
			'#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'];


		// function for initializing the page
		function init() {
			// build map and initialize search
			map = buildMap();
			initMapOptions();
			initCountryInfoBox();
			updateAll();
		}


		/* ---------------------- Functions ----------------------- */
		// builds the map, attaches tooltips to countries, populates coordinates dict
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
					displayCountryInfo();
				})
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						delay: 100,
						minWidth: 200,
						content: d.properties.NAME,
					});
				});

			// define legend display toggle behavior
			$('.legend-display-tab').click(function toggleLegendDIsplay() {
				const $arrow = $(this).find('.collapse-arrow').toggleClass('rotated');
				$(this).find('span').text($arrow.hasClass('rotated') ? 'show legend' : 'hide legend');
				$('.legend-content').slideToggle();
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
		function getMoneyFlowType() {
			return $('.money-flow-type-filter input:checked').attr('ind');
		}

		function getMoneyType() {
			return $('.money-type-filter input:checked').attr('ind');
		}

		function getValueAttrName() {
			const moneyType = getMoneyType();
			return (moneyType === 'committed') ? 'total_committed' : 'total_spent';
		}

		function getMoneyTypeLabel(moneyFlow, moneyType) {
			let noun = '';
			if (moneyFlow === 'funded' && moneyType === 'committed') {
				noun = 'Committed Funds';
			} else if (moneyFlow === 'funded' && moneyType === 'disbursed') {
				noun = 'Disbursed Funds';
			} else if (moneyFlow === 'received' && moneyType === 'committed') {
				noun = 'Committed<br>Funds to Receive';
			} else if (moneyFlow === 'received' && moneyType === 'disbursed') {
				noun = 'Received Funds';
			}
			return `Total ${noun}` +
				`<br>from <b>${startYear}</b> to <b>${endYear - 1}</b>`;
		}

		// gets the lookup object currently being used
		function getDataLookup() {
			if (getMoneyFlowType() === 'received') return App.recipientLookup;
			return App.fundingLookup;
		}

		// update everything if any parameters change
		function updateAll() {
			// update data map and actual map
			updateDataMaps();
			updateMap();

			// update info box if showing
			if ($('.info-container').is(':visible')) {
				displayCountryInfo();
			}
		}

		// updates the country to value data map based on user settings
		function updateDataMaps() {
			// get lookup (has all data)
			const moneyFlow = getMoneyFlowType();
			const dataLookup = getDataLookup();

			// get filter values
			const ccs = $('.cc-select').val();

			// clear out current data
			currentNodeDataMap.clear();

			// filter and only use data with valid country values
			App.countries.forEach((c) => {
				const payments = dataLookup[c.ISO2];
				if (payments) {
					let totalCommitted = 0;
					let totalSpent = 0;
					for (let i = 0, n = payments.length; i < n; i++) {
						const p = payments[i];

						// filter by core category
						if (!App.passesCategoryFilter(p.core_capacities, ccs)) continue;

						// add payment values by year
						for (let i = startYear; i < endYear; i++) {
							totalCommitted += p.committed_by_year[i] || 0;
							totalSpent += p.spent_by_year[i] || 0;
						}
					}

					// set in node map
					currentNodeDataMap.set(c.ISO2, {
						total_committed: totalCommitted,
						total_spent: totalSpent,
					});
				}
			});
		}

		// updates map colors
		function updateMap() {
			const moneyFlow = getMoneyFlowType();
			const moneyType = getMoneyType();
			const valueAttrName = getValueAttrName();
			d3.selectAll('.country-arc, .link').classed('active', false);

			// get color scale and set domain
			const domain = currentNodeDataMap.values()
				.map(d => d[valueAttrName])
				.filter(d => d);
			if (domain.length === 1) domain.push(0);
			const nodeColorScale = d3.scaleQuantile()
				.domain(domain)
				.range(purples);

			// color countries and update tooltip content
			map.element.selectAll('.country').transition()
				.duration(500)
				.style('fill', (d) => {
					const isoCode = d.properties.ISO2;
					if (currentNodeDataMap.has(isoCode)) {
						d.value = currentNodeDataMap.get(isoCode)[valueAttrName];
						d.color = d.value ? nodeColorScale(d.value) : '#ccc';
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
						.attr('class', 'tooltip-profile-type')
						.text(moneyFlow === 'funded' ? 
							'Funder Information' : 'Recipient Information');
					container.append('div')
						.attr('class', 'tooltip-main-value')
						.text(App.formatMoney(d.value));
					container.append('div')
						.attr('class', 'tooltip-main-value-label')
						.html(getMoneyTypeLabel(moneyFlow, moneyType));

					$(this).tooltipster('content', container.html());
				});

			// update legend
			updateLegend(nodeColorScale);
		}

		// update the map legend
		function updateLegend(colorScale) {
			const valueAttrName = getValueAttrName();

			const barHeight = 16;
			const barWidth = 70;
			const legendPadding = 20;

			const colors = colorScale.range();
			const quantiles = colorScale.quantiles();
			const maxValue = d3.max(currentNodeDataMap.values()
				.map(d => d[valueAttrName]));

			const legend = d3.select('.legend')
				.attr('width', barWidth * colors.length + 2 * legendPadding)
				.attr('height', barHeight + 48)
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
					if (i === quantiles.length) return App.formatMoneyShort(maxValue);
					return App.formatMoneyShort(quantiles[i]);
				});
			legend.selectAll('.legend-start-label')
				.data([true])
				.enter().append('text')
					.attr('class', 'legend-start-label')
					.attr('y', barHeight + 12)
					.attr('dy', '.35em')
					.text(0);

			// update legend title
			let titleText = getMoneyFlowType() === 'funded' ?
				'Funds Donated' : 'Funds Received';
			titleText += ` (in ${App.currencyIso})`;
			const legendTitle = legend.selectAll('.legend-title')
				.data([titleText]);
			const nlt = legendTitle.enter().append('text')
				.attr('class', 'legend-title');
			legendTitle.merge(nlt)
				.attr('x', barWidth * colors.length / 2)
				.attr('y', barHeight + 45)
				.text(d => d);

			$('.legend-container').slideDown();
		}

		// displays detailed country information
		function displayCountryInfo() {
			const country = activeCountry.datum().properties;
			const moneyFlow = getMoneyFlowType();
			const moneyType = getMoneyType();

			// populate info title
			$('.info-title').text(country.NAME);
			$('.info-profile-type').text(moneyFlow === 'funded' ?
				'Funder Information' : 'Recipient Information');

			// define "go to analysis" button behavior
			$('.info-analysis-button')
				.off('click')
				.on('click', () => {
					hasher.setHash(`analysis/${country.ISO2}`);
				});

			// populate info total value
			let totalCommitted = 0;
			let totalSpent = 0;
			if (currentNodeDataMap.has(country.ISO2)) {
				const valueObj = currentNodeDataMap.get(country.ISO2);
				totalCommitted += valueObj.total_committed;
				totalSpent += valueObj.total_spent;
			}
			$('.info-committed-value').text(App.formatMoney(totalCommitted));
			$('.info-spent-value').text(App.formatMoney(totalSpent));

			// construct label for value
			$('.info-committed-value-label').html(getMoneyTypeLabel(moneyFlow, 'committed'));
			$('.info-spent-value-label').html(getMoneyTypeLabel(moneyFlow, 'disbursed'));

			// display content
			$('.info-container').slideDown();
		}

		// initalizes components in the map options, incl. search and display toggle
		function initMapOptions() {
			// define display toggle behavior
			$('.map-options-title').click(function toggleContent() {
				$(this).find('.collapse-arrow').toggleClass('rotated');
				$('.map-options-content').slideToggle();
			});

			// initialize components
			initFilters();
			initSlider();
			initSearch();
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.search-container', (result) => {
				// get country element
				const country = d3.selectAll('.country')
					.filter(c => result.ISO2 === c.properties.ISO2);

				// set country as active
				activeCountry.classed('active', false);
				activeCountry = country.classed('active', true);

				// zoom in to country
				map.zoomTo.call(activeCountry.node(), activeCountry.datum());
				displayCountryInfo();
			});
		}

		// initializes slider functionality
		function initSlider() {
			const slider = App.initSlider('.time-slider', {
				min: App.dataStartYear,
				max: App.dataEndYear + 1,
				value: [startYear, endYear],
				tooltip: 'hide',
			})
			slider.on('change', (event) => {
				const years = event.target.value.split(',');
				if (+years[0] !== startYear || +years[1] !== endYear) {
					startYear = +years[0];
					endYear = +years[1];
					updateAll();
				}
			});
			return slider;
		}

		// populates and initializes behavior for map options
		function initFilters() {
			// populate dropdowns
			App.populateCcDropdown('.cc-select', { dropRight: true });

			// attach radio button behavior
			$('.map-options-container .radio-option').click(function clickedRadio() {
				const $option = $(this);
				$option.find('input').prop('checked', true);
				$option.siblings().find('input').prop('checked', false);
			});

			// attach change behavior
			$('.money-flow-type-filter .radio-option').click(() => {
				// change button title in country info box
				const moneyFlow = getMoneyFlowType();
				$('.info-tab-container .btn[tab="country"]')
					.text(moneyFlow === 'received' ? 'By Donor' : 'By Recipient');

				updateAll();
			});
			$('.money-type-filter .radio-option').click(updateAll);
			$('.links-filter .radio-option').click(() => {
				$('.country-link').toggle();
			});
			$('.map-options-container select').on('change', updateAll);

			// add info tooltips
			$('.committed-info-img').tooltipster({
				content: 'The <b>amount committed</b> refers to the amount of money committed.',
			});
			$('.disbursed-info-img').tooltipster({
				content: 'The <b>amount disbursed</b> refers to the amount of money the ' +
					'recipient country has received.',
			});

			// show map options
			$('.map-options-container').show();
		}

		function initCountryInfoBox() {
			// define info close button behavior
			$('.info-close-button').on('click', resetMap);
		}

		init();
	};
})();
