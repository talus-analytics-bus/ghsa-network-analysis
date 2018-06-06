(() => {
	App.initHome = (params = {}) => {
		// variables used throughout home page
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
		const currentNodeDataMap = d3.map();  // maps country iso to the value on map
		let startYear = App.dataStartYear;  // the start year of the time range shown
		let endYear = App.dataEndYear + 1;  // the end year of the time range shown

		// state variables for current map indicator
		let indType = 'money';  // either 'money' or 'score'
		let moneyFlow = 'received';  // either 'funded' or 'received'
		let moneyType = 'disbursed';  // either 'committed' or 'disbursed'
		let scoreType = 'score';  // either 'score' or 'combined'

		// colors
		const purples = ['#e0ecf4', '#bfd3e6', '#9ebcda',
		'#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'];
		const orangesReverse = ['#fee391', '#fec44f', '#fe9929',
		'#ec7014', '#cc4c02', '#993404', '#662506'].reverse();
		const jeeColors = ['#c91414', '#ede929', '#ede929', '#ede929',
		'#ede929', '#0b6422', '#0b6422', '#0b6422'];


		// function for initializing the page
		function init() {
			App.loadFundingData({ showGhsaOnly: params.showGhsaOnly === 'true' });
			App.setSources();
			
			// build map and initialize search
			map = buildMap();
			initMapOptions();
			initLegend();
			initCountryInfoBox();
			initFunderList('.non-country-list.funder-list');
			initRecipientList('.non-country-list.recipient-list');
			initListScaling('.non-country-list-container.right');
			initListScaling('.non-country-list-container.left');
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
					if (activeCountry.node && activeCountry.node() === this) return resetMap();
					
					d3.selectAll('.country').classed('active', false);
					// activeCountry.classed('active', false);
					activeCountry = d3.select(this).classed('active', true);

					// zoom in to country
					mapObj.zoomTo.call(this, d);

					// display info box
					displayCountryInfo();

					// deselect all list items
					d3.selectAll('.list-item').classed('active',false);

					return true;
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
			d3.selectAll('.country, .list-item').classed('active', false);
			activeCountry = d3.select(null);
			$('.info-container').slideUp();
		}

		function getValueAttrName() {
			if (indType === 'score') {
				if (scoreType === 'combined') return 'combo';
				return 'score';
			}
			if (moneyFlow === 'funded') {
				return moneyType === 'committed' ? 'fundedCommitted' : 'fundedSpent';
			}
			return moneyType === 'committed' ? 'receivedCommitted' : 'receivedSpent';
		}

		function getMoneyTypeLabel(mFlow, mType, isGhsa = false) {
			let flowNoun = (mFlow === 'funded') ? '(Funder)' : '(Recipient)';
			if (isGhsa) {
				flowNoun = '';
			}
			let noun = '';
			if (mType === 'committed') {
				noun = 'Committed';
			} else {
				if (mFlow === 'funded') noun = 'Disbursed';
				else noun = 'Received';
			}
			return `Total <b>${noun}</b>` +
			`<br>from ${startYear} to ${endYear - 1}` +
			`<br>${flowNoun}`;
		}

		// gets the color scale used for the map
		function getColorScale() {
			if (indType === 'score' && scoreType === 'score') {
				return d3.scaleThreshold()
				.domain([1.5, 2, 2.5, 3, 3.5, 4, 4.5])
				.range(jeeColors);
			}

			const valueAttrName = getValueAttrName();
			const domain = currentNodeDataMap.values()
			.map(d => d[valueAttrName])
			.filter(d => d);
			if (domain.length === 1) domain.push(0);
			return d3.scaleQuantile()
			.domain(domain)
			.range(indType === 'money' || indType === 'ghsa' ? purples : orangesReverse);
		}

		// update everything if any parameters change
		function updateAll() {
			// update funding data
			App.loadFundingData({showGhsaOnly: App.showGhsaOnly});

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
			// get filter values
			const ccs = $('.cc-select').val();

			// clear out current data
			currentNodeDataMap.clear();

			// build data map; filter and only use data with valid country values
			App.countries.forEach((c) => {
				const paymentsFunded = App.fundingLookup[c.ISO2];
				const paymentsReceived = App.recipientLookup[c.ISO2];
				const scoreObj = App.scoresByCountry[c.ISO2];

				// only include country in data map if it has a score or rec/don funds
				let fundedCommitted = 0;
				let fundedSpent = 0;
				let receivedCommitted = 0;
				let receivedSpent = 0;
				let score = null;
				let combo = null;

				if (paymentsFunded) {
					({ totalCommitted: fundedCommitted, totalSpent: fundedSpent } =
						getPaymentSum(paymentsFunded, ccs));
				}
				if (paymentsReceived) {
					({ totalCommitted: receivedCommitted, totalSpent: receivedSpent } =
						getPaymentSum(paymentsReceived, ccs));
				}

				if (scoreObj) {
					const capScores = scoreObj.avgCapScores
					.filter(d => ccs.includes(d.capId));
					score = d3.mean(capScores, d => d.score);
					const numerator = 10 + Math.log10(1 + receivedSpent);
					const denominator = 5.01 - score;
					combo = numerator / denominator;
				}

				// set in node map
				currentNodeDataMap.set(c.ISO2, {
					fundedCommitted,
					fundedSpent,
					receivedCommitted,
					receivedSpent,
					score,
					combo,
				});
			});
		}

		// gets the sum of payments for the years and capacities selected
		function getPaymentSum(payments, ccs) {
			let totalCommitted = 0;
			let totalSpent = 0;
			for (let i = 0, n = payments.length; i < n; i++) {
				const p = payments[i];

				// filter by core category
				if (!App.passesCategoryFilter(p.core_capacities, ccs)) continue;

				// add payment values by year
				for (let k = startYear; k < endYear; k++) {
					totalCommitted += p.committed_by_year[k] || 0;
					totalSpent += p.spent_by_year[k] || 0;
				}
			}
			return { totalCommitted, totalSpent };
		}

		/**
		 * Returns the correct info label text based on whether an entity is
		 * a country, the GHSA conceptual entity, and which money flow.
		 * @param  {Boolean} isGhsa        Is the entity the GHSA catch-all? If so, no label.
		 * @param  {string}  moneyFlow     The money flow, either 'funded' or 'received'
		 * @return {string}  The correct text to use as the info label in the map modal.
		 */
		function getInfoLabel(isGhsa, moneyFlow) {
			if (isGhsa) {
				return '';
			} else {
				return (moneyFlow === 'funded') ? 'Funder Information' : 'Recipient Information';
			}
		};

		// updates map colors and country tooltip
		function updateMap() {
			const valueAttrName = getValueAttrName();
			const colorScale = getColorScale();

			// color countries and update tooltip content
			map.element.selectAll('.country').transition()
			.duration(500)
			.style('fill', (d) => {
				const isoCode = d.properties.ISO2;
				if (currentNodeDataMap.has(isoCode)) {
					d.value = currentNodeDataMap.get(isoCode)[valueAttrName];
					d.color = d.value ? colorScale(d.value) : '#ccc';
				} else {
					d.value = null;
					d.color = '#ccc';
				}
				return d.color;
			})
			.each(function updateTooltip(d) {
					// define labels and value to be shown
					let label = getMoneyTypeLabel(moneyFlow, moneyType);
					let value = d.value;

					// value shows received if showing JEE score
					if (indType === 'score') {
						label = getMoneyTypeLabel('received', 'disbursed');
						if (currentNodeDataMap.has(d.properties.ISO2)) {
							value = currentNodeDataMap.get(d.properties.ISO2).receivedSpent;
						}
					}
					// build tooltip
					const container = d3.select(document.createElement('div'));
					container.append('div')
					.attr('class', 'tooltip-title')
					.text(d.properties.NAME);
					if (indType === 'score') {
						let scoreText = 'Avg. JEE Score: ';
						let score = 0;
						if (currentNodeDataMap.has(d.properties.ISO2)) {
							score = currentNodeDataMap.get(d.properties.ISO2).score;
						}
						if (score) {
							scoreText = App.getScoreNameHtml(score);
						} else {
							scoreText = 'No JEE score data available';
						}
						container.append('div')
						.attr('class', 'tooltip-score-text')
						.html(scoreText);
					} else {
						const infoLabel = (moneyFlow === 'funded') ?
						'Funder Information' : 'Recipient Information';
						container.append('div')
						.attr('class', 'tooltip-profile-type')
						.text(infoLabel);
					}
					container.append('div')
					.attr('class', 'tooltip-main-value')
					.text(App.formatMoney(value));
					container.append('div')
					.attr('class', 'tooltip-main-value-label')
					.html(label);

					$(this).tooltipster('content', container.html());
				});

			// update legend
			updateLegend(colorScale);
		}

		// initialize the legend
		function initLegend() {
			const legend = d3.select('.legend g');

			// add starting label
			legend.append('text')
			.attr('class', 'legend-start-label')
			.attr('dy', '.35em');

			// add starting tick line
			legend.append('line')
			.attr('class', 'legend-start-tick legend-tick')
			.attr('x1', 1)
			.attr('x2', 1);

			// add legend title
			legend.append('text').attr('class', 'legend-title');

			// add tooltip for legend title
			legend.append('image')
			.attr('class', 'legend-tooltip')
			.attr('xlink:href', 'img/info.png')
			.each(function addTooltip() { $(this).tooltipster(); });
		}

		// update the map legend
		function updateLegend(colorScale) {
			const valueAttrName = getValueAttrName();
			const isJeeScore = (indType === 'score' && scoreType === 'score');

			const barHeight = 16;
			let barWidth = 70;
			const legendPadding = 20;

			// adjust width for JEE score
			if (isJeeScore) barWidth = 50;

			const colors = colorScale.range();
			const thresholds = indType === 'score' ?
			colorScale.domain() : colorScale.quantiles();
			const maxValue = d3.max(currentNodeDataMap.values()
				.map(d => d[valueAttrName]));

			const legend = d3.select('.legend')
			.attr('width', barWidth * colors.length + 2 * legendPadding)
			.attr('height', barHeight + 50)
			.select('g')
			.attr('transform', `translate(${legendPadding}, 0)`);
			let legendGroups = legend.selectAll('g')
			.data(colors);
			legendGroups.exit().remove();

			// add bars, texts, ticks for each group
			const newLegendGroups = legendGroups.enter().append('g');
			newLegendGroups.append('rect')
			.attr('class', 'legend-bar')
			.attr('height', barHeight);
			newLegendGroups.append('text')
			.attr('class', 'legend-text')
			.attr('dy', '.35em');
			newLegendGroups.append('line')
			.attr('class', 'legend-tick')
			.attr('y1', barHeight)
			.attr('y2', barHeight + 4);

			legendGroups = legendGroups.merge(newLegendGroups)
			.attr('transform', (d, i) => `translate(${barWidth * i}, 0)`);
			legendGroups.select('.legend-bar')
			.attr('width', barWidth)
			.style('fill', d => d);
			const legendText = legendGroups.select('.legend-text')
			.attr('x', barWidth)
			.attr('y', isJeeScore ? barHeight + 14 : barHeight + 12);
			legendGroups.select('.legend-tick')
			.attr('x1', (d, i) => (i === colors.length - 2 ? 2 * barWidth - 1 : 2 * barWidth))
			.attr('x2', (d, i) => (i === colors.length - 2 ? 2 * barWidth - 1 : 2 * barWidth))
			.style('display', (d, i) => {
				if (!isJeeScore) return 'none';
				return (i % 2 === 0) ? 'inline' : 'none';
			});

			// fix starting label position
			const legendStartLabel = legend.select('.legend-start-label')
			.attr('y', barHeight + 12);

			// add starting tick
			legend.select('.legend-start-tick')
			.attr('y1', barHeight)
			.attr('y2', barHeight + 4)
			.style('display', isJeeScore ? 'inline' : 'none');

			if (isJeeScore) {
				legendText
				.style('text-anchor', 'middle')
				.style('display', (d, i) => (i % 2 === 0 ? 'none' : 'inline'))
				.text((d, i) => (i + 3) / 2);
				legendStartLabel
				.style('text-anchor', 'middle')
				.text('1');
			} else if (indType === 'score' && scoreType === 'combined') {
				legendText
				.style('display', 'inline')
				.style('text-anchor', 'end')
				.text((d, i) => {
					if (i === 6) return 'Needs Met';
					return '';
				});
				legendStartLabel
				.style('text-anchor', 'start')
				.text('Needs Unmet');
			} else {
				legendText
				.style('display', 'inline')
				.style('text-anchor', 'middle')
				.text((d, i) => {
					if (i === thresholds.length) return App.formatMoneyShort(maxValue);
					return App.formatMoneyShort(thresholds[i]);
				});
				legendStartLabel
				.style('text-anchor', 'start')
				.text(0);
			}

			// update legend title
			let titleText = '';
			if (indType === 'money' || indType === 'ghsa') {
				if (moneyType === 'committed') {
					titleText = 'Funds Committed';
				} else {
					if (moneyFlow === 'funded') titleText = 'Funds Disbursed';
					else titleText = 'Funds Received';
				}
				titleText += ` (in ${App.currencyIso})`;
			} else if (indType === 'score') {
				if (scoreType === 'score') {
					titleText = 'Average JEE Score for Selected Core Capacities';
				} else if (scoreType === 'combined') {
					titleText = 'Financial Resources / Needs Metric';
				}
			}

			legend.select('.legend-title')
			.attr('x', barWidth * colors.length / 2)
			.attr('y', barHeight + 45)
			.text(titleText);

			legend.select('.legend-tooltip')
			.attr('x', barWidth * colors.length / 2 + 134)
			.attr('y', barHeight + 33.5);

			// if showing combination metric, populate tooltip
			if (indType === 'score' && scoreType === 'combined') {
				$('.legend-tooltip')
				.show()
				.tooltipster('content', 'This metric combines both a country\'s JEE scores and ' +
					'the amount of disbursed funds that the country has received. ' +
					'We use JEE scores as a proxy for country-specific needs, and ' +
					'calculate the ratio of financial resources to need. The goal ' +
					'of this metric is to highlight areas whose needs may still be ' +
					'unmet based on their ratio of financial resources to need.');
			} else {
				$('.legend-tooltip').hide();
			}

			$('.legend-container').slideDown();
		}

		// displays detailed country information
		function displayCountryInfo() {
			const countryTmp = activeCountry.datum();
			const country = countryTmp.properties;
			const flowTmp = countryTmp.flow;
			const isGhsa = country.ISO2 === 'ghsa';

			// determine which flow to show in tooltip
			const flowToShow = (flowTmp !== undefined) ? flowTmp : moneyFlow;

			// populate info title
			$('.info-title').text(country.NAME);
			$('.info-profile-type')
			.css('display', (indType === 'money' || indType === 'ghsa' || country.country === false) ? 'block' : 'none')
			.text(getInfoLabel(isGhsa, flowToShow));

			// define "go to analysis" button behavior
			$('.info-analysis-button')
			.off('click')
			.on('click', () => {
				const activeCountryData = activeCountry.datum();
				if (activeCountryData.flow !== undefined) {
					const flowParam = (activeCountryData.flow === 'funded') ? 'd' : 'r';
					hasher.setHash(`analysis/${country.ISO2}/${flowParam}`);
				} else {
					hasher.setHash(`analysis/${country.ISO2}`);
				}
			});

			// populate info total value
			let totalCommitted = 0;
			let totalSpent = 0;
			if (currentNodeDataMap.has(country.ISO2)) {
				const valueObj = currentNodeDataMap.get(country.ISO2);
				if (indType === 'money' || indType === 'ghsa') {
					$('.info-score-text-container').slideUp();
				} else if (indType === 'score') {
					let scoreText = 'Average JEE Score: ';
					if (valueObj.score) {
						scoreText = App.getScoreNameHtml(valueObj.score);
					} else {
						scoreText = 'No JEE score data currently available';
					}
					$('.info-score-text').html(scoreText);
					if (country.country === false) {
						$('.info-score-text-container').slideUp();
					} else {
						$('.info-score-text-container').slideDown();
					}
				}
				if (flowTmp === 'funded' || ((indType === 'money' || indType === 'ghsa' ) && flowToShow === 'funded')) {
					totalCommitted += valueObj.fundedCommitted;
					totalSpent += valueObj.fundedSpent;
				} else {
					totalCommitted += valueObj.receivedCommitted;
					totalSpent += valueObj.receivedSpent;
				}
			}
			$('.info-committed-value').text(App.formatMoney(totalCommitted));
			$('.info-spent-value').text(App.formatMoney(totalSpent));

			// construct label for value
			const mFlow = (indType === 'score' && country.country !== false) ? 'received' : flowToShow;
			$('.info-committed-value-label').html(getMoneyTypeLabel(mFlow, 'committed', isGhsa));
			$('.info-spent-value-label').html(getMoneyTypeLabel(mFlow, 'disbursed', isGhsa));

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
				if (result.item !== undefined) result = result.item;
				d3.selectAll('.country, .list-item').classed('active', false);
				
				// get country element
				const nonCountry = result.country === false;
				let match;
				if (!nonCountry) {
					match = d3.selectAll('.country')
						.filter(c => result.ISO2 === c.properties.ISO2);
				} else {
					const matchTmp = d3.selectAll('.list-item')
						.filter(c => result.ISO2 === c.entity_data.ISO2);
					const entityData = matchTmp.datum().entity_data;
					match = matchTmp;
					match.datum = () => { return {
						properties: entityData,
						flow: 'funded',
					}; };
					// match.datum2 = () => { return matchTmp.datum().entity_data; };
					console.log('match')
					console.log(match)
				}

				// set country as active
				activeCountry = match.classed('active', true);

				// zoom in to country
				if (!nonCountry) {
					map.zoomTo.call(activeCountry.node(), activeCountry.datum())
				}
				else {
					scrollToListItem(activeCountry);
				};
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
			});
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

			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$('input[type=radio][name="ind"][ind="ghsa"]').prop('checked',true);
			}

			// update indicator type ('money' or 'score') on change
			$('.ind-type-filter .radio-option').click(function updateIndType() {
				indType = $(this).find('input').attr('ind');
				if (indType === 'money') {
					$('.score-filters').slideUp();
					$('.money-filters').slideDown();
					App.showGhsaOnly = false;
				} else if (indType === 'ghsa') {
					$('.score-filters').slideUp();
					$('.money-filters').slideDown();
					App.showGhsaOnly = true;
				} else if (indType === 'score') {
					$('.money-filters').slideUp();
					$('.score-filters').slideDown();
				}
				updateFilters();
			});

			// update money flow type ('funded' or 'received') on change
			$('.money-flow-type-filter .radio-option').click(function updateMoneyFlow() {
				moneyFlow = $(this).find('input').attr('ind');
				updateFilters();

				// update text in country info box based on money flow on change
				$('.info-tab-container .btn[tab="country"]')
				.text(moneyFlow === 'received' ? 'By Donor' : 'By Recipient');
			});

			// update money type ('committed' or 'disbursed') on change
			$('.money-type-filter .radio-option').click(function updateMoneyType() {
				moneyType = $(this).find('input').attr('ind');
				updateFilters();
			});

			// update score type ('score' or 'combined') on change
			$('.jee-score-filter .radio-option').click(function updateScoreType() {
				indType = 'score';
				scoreType = $(this).find('input').attr('ind');
				updateFilters();
			});

			// update map on dropdown change
			$('.map-options-container select').on('change', updateAll);

			// add info tooltips
			$('.score-info-img').tooltipster({
				interactive: true,
				content: 'The average of each country\'s most recent <b>JEE scores</b>,' +
				' for all JEE scores selected in the filter below.',
			});
			$('.combined-info-img').tooltipster({
				content: 'This metric combines both a country\'s JEE scores and ' +
				'the amount of disbursed funds that the country has received. ' +
				'We use JEE scores as a proxy for country-specific needs, ' +
				'and calculate the ratio of financial resources to need. ' +
				'The goal of this metric is to highlight areas whose needs may ' +
				'still be unmet based on their ratio of financial resources to need.',
			});
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});

			// show map options
			$('.map-options-container').show();
		}

		function updateFilters() {
			// update indicator type radio button
			$('.ind-type-filter input').each(function updateInputs() {
				const $this = $(this);
				$this.prop('checked', $this.attr('ind') === indType);
			});

			// update which radio buttons are checked based on state variables
			if (indType === 'money' || indType === 'ghsa') {
				// uncheck score buttons
				$('.jee-score-filter input').prop('checked', false);

				// update money flow type radio buttons
				$('.money-flow-type-filter input').each(function updateInputs() {
					const $this = $(this);
					$this.prop('checked', $this.attr('ind') === moneyFlow);
				});

				// update money type radio buttons
				$('.money-type-filter input').each(function updateInputs() {
					const $this = $(this);
					$this.prop('checked', $this.attr('ind') === moneyType);
				});
			} else if (indType === 'score') {
				// uncheck money radio buttons
				$('.money-type-filter input, .money-flow-type-filter input')
				.prop('checked', false);

				// update jee radio button
				$('.jee-score-filter input').each(function updateInputs() {
					const $this = $(this);
					$this.prop('checked', $this.attr('ind') === scoreType);
				});
			}

			// update the map
			updateAll();
		}

		function initCountryInfoBox() {
			// define info close button behavior
			$('.info-close-button').on('click', resetMap);

			// populate tooltip for avg JEE score text
			$('.score-text-info-img').tooltipster({
				content: 'JEE scores are taken from each country\'s ' +
				'<a href="http://www.who.int/ihr/procedures/mission-reports/en/" target="_blank">' +
				'World Health Organization Joint External Evaluation Report</a>, when available.',
			});
		}


		// Function to set the horizontal offsets of the Non-country Funder/Recipient
		// list items so they flow around the elliptical viewport.
		function setHorizOffsets ($list) {
			let directionSign = 1;
			if ($list.hasClass('funder-list')) {
				directionSign = -1;
			}
			const boxTop = $list.offset().top;
			
			function getMaxHorizOffset () {
				return 120; // TODO dynamically, if it improves rendering.
			}
			
			function getHorizOffsetScale () {
				const domain = {
					min: $list.first('div').position().top,
					max: $list[0].getBoundingClientRect().height,
				};
				const sineScale = Util.sineScale(domain);

				const range = {
					min: 10,
					max: getMaxHorizOffset(), // base case: linear
				};

				const horizOffsetScaleTmp = d3.scaleLinear()
					.domain([0, 1])
					.range([range.min, range.max]);

				const horizOffsetScale = (val) => {
					return horizOffsetScaleTmp(sineScale(val));
				};

				return horizOffsetScale;
			}

			function getHorizOffset (span, scrollTop) {
				const val = span.position().top;
				const scale = getHorizOffsetScale();
				const maxOffset = getMaxHorizOffset();
				return scale(val);
			}

			$list
				.off('scroll')
				.scroll(function(){
					const element = $(this);
					const scrollTop = element.scrollTop();
					const spans = element.find('div');
					spans.each(function(span){
						const $span = $(this);
						const horizOffset = getHorizOffset($span);
						$span.css('left', (directionSign * horizOffset) + 'px');
					})
				});
			$list.trigger('scroll');
		}

		// Make the list of non-country recipients scale and position
		// so it's always next to the elliptical viewport's right edge.
		function initListScaling(selector) {
			const $box = $(selector);
			const $listTitle = $box.find('.list-title');
			const $viewport = $('.viewport-edge');
			const $list = $box.find('.non-country-list');
			

			function onChange() {
				// Scale the size of the box
				// Scale factor = difference between original viewport height and current viewport height
				const viewportHeight = $viewport[0].getBoundingClientRect().height;
				const origViewportHeight = 640;
				const heuristicScaleFactorCorrection = 1.3; // Dividing by this value gets the initial size right
				const scaleFactor = (viewportHeight / origViewportHeight) / heuristicScaleFactorCorrection;
				$box.css('transform',`scale(${scaleFactor})`);
				$box.css('-moz-transform',`scale(${scaleFactor})`);

				// Set top position of box
				const viewportTop = $viewport.offset().top;
				const boxHeight = $box[0].getBoundingClientRect().height;
				const listTitleHeight = $listTitle[0].getBoundingClientRect().height;
				const heuristicTopPositionCorrection = -10 * scaleFactor / heuristicScaleFactorCorrection;
				const yShift = ((viewportHeight / 2) - (boxHeight / 2)) + heuristicTopPositionCorrection;
				// const yShift = ((viewportHeight / 2) - (boxHeight / 2));
				const top = viewportTop + yShift;
				$box.css('top', top + 'px');

				// Set indentations of 'span' elements of list
				setHorizOffsets($list)
			}
			onChange();
			setHorizOffsets($list);
			window.addEventListener("resize", onChange);
		}

		/**
		 * Initializes the list of funders that appears on the left side of the Map.
		 * @param  {string} selector      D3 selector string of div that
		 * 								  contains the list of funders
		 * 								  
		 * @return {null} No return value
		 */
		function initFunderList (selector) {
			const $list = d3.select(selector);

			// get data for funders and group it by funder
			const fundingDataByDonorCode = _.groupBy(App.fundingData, 'donor_code');
			let nonCountryFunderData = App.nonCountries.map((val, key) => {
				return {
					donor_code: val.FIPS,
					entity_data: val,
					projects: fundingDataByDonorCode[val.FIPS],
				};
			}).filter(d => d.projects !== undefined);;


			// Add object representing GHSA
			const ghsa = {
				recipient_code: 'ghsa',
				entity_data: {
				    "FIPS": "ghsa",
				    "ISO2": "ghsa",
				    "NAME": "Global Health Security Agenda",
				    "country": false
				  },
				projects: App.fundingData.filter(d => d.ghsa_funding === true), // TODO
			};
			nonCountryFunderData = nonCountryFunderData.concat(ghsa);

			// sort A-Z by donor name
			nonCountryFunderData = _.sortBy(nonCountryFunderData, (data) => { return data.entity_data.NAME.toLowerCase(); });

			// populate the list with spans representing each entity
			$list.selectAll('.list-item')
				.data(nonCountryFunderData).enter().append('div')
					.attr('class','list-item')
					.text(d => d.entity_data.acronym || d.entity_data.NAME)
					.on('click', function onClick(d) {
						const curListItem = d3.select(this);
						if (curListItem.classed('active')) {
							d3.selectAll('.list-item').classed('active',false);
							return resetMap();
						} else if ($('.list-item.active').length === 0) {
							map.reset();
						}

						d3.selectAll('.list-item').classed('active',false);
						curListItem.classed('active', true);

						activeCountry = {
							datum: () => { return {flow: 'funded', properties: App.nonCountries.find(dd => d.entity_data.FIPS === dd.FIPS) } }
						};

						// display info box
						displayCountryInfo();
						return true;
					})
					.insert('br');
		};

		/**
		 * Initializes the list of recipients that appears on the right side of the Map.
		 * @param  {string} selector      D3 selector string of div that
		 * 								  contains the list of recipients
		 * 								  
		 * @return {null} No return value
		 */
		function initRecipientList (selector) {
			const $list = d3.select(selector);

			// get data for funders and group it by funder
			const fundingDataByRecipientCode = _.groupBy(App.fundingData, 'recipient_country');
			let nonCountryRecipientData = App.nonCountries.map((val, key) => {
				return {
					recipient_code: val.FIPS,
					entity_data: val,
					projects: fundingDataByRecipientCode[val.FIPS],
				};
			}).filter(d => d.projects !== undefined);

			// Add object representing GHSA
			const ghsa = {
				recipient_code: 'ghsa',
				entity_data: {
				    "FIPS": "ghsa",
				    "ISO2": "ghsa",
				    "NAME": "Global Health Security Agenda",
				    "country": false
				  },
				projects: App.fundingData.filter(d => d.ghsa_funding === true), // TODO
			};
			nonCountryRecipientData = nonCountryRecipientData.concat(ghsa);

			// sort A-Z by donor name
			nonCountryRecipientData = _.sortBy(nonCountryRecipientData, (data) => { return data.entity_data.NAME.toLowerCase(); });

			// populate the list with spans representing each entity
			$list.selectAll('.list-item')
				.data(nonCountryRecipientData).enter().append('div')
					.attr('class','list-item')
					.text(d => d.entity_data.acronym || d.entity_data.NAME)
					.on('click', function onClick(d) {
						const curListItem = d3.select(this);
						if (curListItem.classed('active')) {
							d3.selectAll('.list-item').classed('active',false);
							return resetMap();
						} else if ($('.list-item.active').length === 0) {
							map.reset();
						}

						d3.selectAll('.list-item').classed('active',false);
						curListItem.classed('active', true);

						activeCountry = {
							datum: () => { return {flow: 'received', properties: App.nonCountries.find(dd => d.entity_data.FIPS === dd.FIPS) } }
						};

						// display info box
						displayCountryInfo();
						return true;
					})
					.insert('br');



		};

		/**
		 * Scrolls the list div to the item indicated in the argument (animated).
		 * @param  {D3 selection} $item         The list item D3 selection to be scrolled to
		 */
		function scrollToListItem ($item) {
			// get current list

			$item = $($item.node());
			const $list = $item.parent('.non-country-list');
			$list.scrollTop(0);

			// get original list top
			const origListTop = $list.scrollTop();

			// get list top if at scrollTop(0)
			$list.scrollTop(0);
			const baselineListTop = $list.position().top;

			// go back to original list top
			$list.scrollTop(origListTop);

			// get target top
			const itemTop = $item.position().top;

			// get difference between target top and list top at scrollTop(0)
			const diff = itemTop - $list.scrollTop();

			// add this to current scrollTop and scroll to it
			const scrollTopTarget = $list.scrollTop() + diff;
			$list.scrollTop(scrollTopTarget);
		};
		
		init();
	};
})();
