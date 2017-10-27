(() => {
	App.initHome = () => {
		// variables used throughout home page
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
		const currentNodeDataMap = d3.map();  // maps country iso to the value on map
		let startYear = App.dataStartYear;  // the start year of the time range shown
		let endYear = App.dataEndYear + 1;  // the end year of the time range shown

		// state variables for current map indicator
		let indType = 'money';  // either 'money' or 'score'
		let moneyFlow = 'funded';  // either 'funded' or 'received'
		let moneyType = 'disbursed';  // either 'committed' or 'disbursed'
		let scoreType = 'score';  // either 'score' or 'combined'

		// colors
		const purples = ['#e0ecf4', '#bfd3e6', '#9ebcda',
			'#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'];
		const blues = ['#deebf7', '#c6dbef', '#9ecae1',
			'#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
		const reds = ['#fee0d2', '#fcbba1', '#fc9272',
			'#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'];
		const orangesReverse = ['#fee391', '#fec44f', '#fe9929',
			'#ec7014', '#cc4c02', '#993404', '#662506'].reverse();
		const jeeColors = ['#c91414', '#ede929', '#ede929', '#ede929', '#ede929', '#0b6422', '#0b6422', '#0b6422'];


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
			activeCountry.classed('active', false);
			activeCountry = d3.select(null);
			$('.info-container').slideUp();
		}

		function getValueAttrName() {
			if (indType === 'score') {
				if (scoreType === 'combined') return 'combo'
				return 'score';
			}
			if (moneyFlow === 'funded') {
				return moneyType === 'committed' ? 'fundedCommitted' : 'fundedSpent';
			}
			return moneyType === 'committed' ? 'receivedCommitted' : 'receivedSpent';
		}

		function getMoneyTypeLabel(moneyFlow, moneyType) {
			let noun = '';
			if (moneyType === 'committed') {
				noun = 'Committed';
			} else {
				if (moneyFlow === 'funded') noun = 'Disbursed';
				else noun = 'Received';
			}
			return `Total <b>${noun}</b>` +
				`<br>from ${startYear} to ${endYear - 1}`;
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
				.range(indType === 'money' ? purples : orangesReverse);
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
				if (paymentsFunded || paymentsReceived || scoreObj) {
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
					}

					// check if country has received funds and has a score
					if (paymentsReceived && scoreObj) {
						combo = Math.log10(receivedSpent) / (5.001 - score);
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
				}
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
					const isJeeScore = (indType === 'score' && scoreType === 'score');

					// define labels and value to be shown
					let label = getMoneyTypeLabel(moneyFlow, moneyType);
					let infoLabel = (moneyFlow === 'funded') ?
							'Funder Information' : 'Recipient Information';
					let value = d.value;

					// labels and value are custom if showing JEE score
					if (isJeeScore) {
						label = getMoneyTypeLabel('received', 'disbursed');
						infoLabel = 'Recipient Information';
						if (currentNodeDataMap.has(d.properties.ISO2)) {
							value = currentNodeDataMap.get(d.properties.ISO2).receivedSpent;
						}
					}

					// build tooltip
					const container = d3.select(document.createElement('div'));
					container.append('div')
						.attr('class', 'tooltip-title')
						.text(d.properties.NAME);
					container.append('div')
						.attr('class', 'tooltip-profile-type')
						.text(infoLabel);
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
				.attr('x1', (d, i) => (i === colors.length - 2) ? 2 * barWidth - 1 : 2 * barWidth)
				.attr('x2', (d, i) => (i === colors.length - 2) ? 2 * barWidth - 1 : 2 * barWidth)
				.style('display', (d, i) => {
					if (!isJeeScore) return 'none';
					return (i % 2 === 0) ? 'inline' : 'none';
				});

			// add starting label for legend
			let legendStartLabel = legend.selectAll('.legend-start-label')
				.data([true]);
			legendStartLabel = legendStartLabel.enter().append('text')
				.attr('class', 'legend-start-label')
				.attr('y', barHeight + 12)
				.attr('dy', '.35em')
				.merge(legendStartLabel);

			// add starting tick
			let legendStartTick = legend.selectAll('.legend-start-tick')
				.data([true]);
			legendStartTick.exit().remove();
			legendStartTick.enter().append('line')
				.attr('class', 'legend-start-tick legend-tick')
				.attr('x1', 1)
				.attr('x2', 1)
				.attr('y1', barHeight)
				.attr('y2', barHeight + 4)
				.merge(legendStartTick)
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
			if (indType === 'money') {
				titleText = (moneyFlow === 'funded' ? 'Funds Donated' : 'Funds Received');
				titleText += ` (in ${App.currencyIso})`;
			} else if (indType === 'score') {
				if (scoreType === 'score') {
					titleText = 'Average JEE Score for Selected Core Capacities';
				} else if (scoreType === 'combined') {
					titleText = 'Financial Resources / Needs Metric';
				}
			}

			const legendTitle = legend.selectAll('.legend-title')
				.data([titleText]);
			legendTitle.enter().append('text')
				.attr('class', 'legend-title')
				.merge(legendTitle)
					.attr('x', barWidth * colors.length / 2)
					.attr('y', barHeight + 45)
					.html(d => d);

			const legendTooltip = legend.selectAll('.legend-tooltip')
				.data([true]);
			legendTooltip.enter().append('image')
				.attr('class', 'legend-tooltip')
				.merge(legendTooltip)
					.attr('xlink:href', 'img/info.png')
					.attr('x', barWidth * colors.length / 2 + 134)
					.attr('y', barHeight + 33.5);

			// if showing combination metric, populate tooltip
			if (indType === 'score' && scoreType === 'combined') {
				$('.legend-tooltip')
					.show()
					.tooltipster({
						content: `This metric combines both the amount of funds a country has <b>received</b> and the country's <b>need</b>. The goal of this metric is to highlight low-scoring countries with a low number of funds received.<br><br><b>Need</b> is defined by taking (5 - "Avg. JEE Score"). The overall metric is calculated by dividing the logarithm of the funds received by a country (in USD) by the needs of the country (i.e. <i>log("Funds received") / (5 - "JEE score")</i>).`,
					});
			} else {
				$('.legend-tooltip').hide();
			}

			$('.legend-container').slideDown();
		}

		// displays detailed country information
		function displayCountryInfo() {
			const country = activeCountry.datum().properties;

			// populate info title
			$('.info-title').text(country.NAME);
			$('.info-profile-type')
				.css('display', indType === 'money' ? 'block' : 'none')
				.text(moneyFlow === 'funded' ? 'Funder Information' : 'Recipient Information');

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
				
				if (indType === 'money') {
					$('.info-score-text-container').slideUp();
				} else if (indType === 'score') {
					let scoreText = 'Average JEE Score: ';
					if (valueObj.score) {
						let className = 'text-warning';
						if (valueObj.score >= 4) className = 'text-success';
						if (valueObj.score < 2) className = 'text-danger';

						scoreText += `<b class="${className}">`;
						if (valueObj.score < 2) scoreText += 'No Capacity';
						else if (valueObj.score < 3) scoreText += 'Limited Capacity';
						else if (valueObj.score < 4) scoreText += 'Developed Capacity';
						else if (valueObj.score < 5) scoreText += 'Demonstrated Capacity';
						else scoreText += 'Sustained Capacity';
						scoreText += '</b>';
					} else {
						scoreText = 'No JEE score data currently available';
					}
					$('.info-score-text').html(scoreText);
					$('.info-score-text-container').slideDown();
				}

				if (indType === 'money' && moneyFlow === 'funded') {
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
			const mFlow = (indType === 'score') ? 'received' : moneyFlow;
			$('.info-committed-value-label').html(getMoneyTypeLabel(mFlow, 'committed'));
			$('.info-spent-value-label').html(getMoneyTypeLabel(mFlow, 'disbursed'));

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

			// update indicator type ('money' or 'score') on change
			$('.ind-type-filter .radio-option').click(function updateIndType() {
				indType = $(this).find('input').attr('ind');
				if (indType === 'money') {
					$('.score-filters').slideUp();
					$('.money-filters').slideDown();
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
			$('.committed-info-img').tooltipster({
				content: 'The <b>amount committed</b> refers to the amount of money committed.',
			});
			$('.disbursed-info-img').tooltipster({
				content: 'The <b>amount disbursed</b> refers to the amount of money the ' +
					'recipient country has received.',
			});
			$('.score-info-img').tooltipster({
				interactive: true,
				content: 'The most recent <b>JEE score</b> for each country is used when available. JEE score data are taken from the <a href="http://www.who.int/ihr/procedures/mission-reports/en/" target="_blank">World Health Organization Joint External Evaluation Reports</a>.',
			});
			$('.combined-info-img').tooltipster({
				content: `This metric combines both the country's <b>JEE score</b> and the amount of funds that the country has <b>received</b>. The goal of this metric is to highlight low-scoring countries with a low number of funds received.<br><br>This metric is calculated by dividing the logarithm of the funds received by a country (in USD) by 5 minus the country's JEE score (i.e. <i>log("Funds received") / (5 - "JEE score")</i>).`,
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
			if (indType === 'money') {
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
				content: 'The current status for the country is shown for the selected core capacities. Status is calculated by averaging available JEE scores for indicators in each selected core capacity.',
			});
		}

		init();
	};
})();
