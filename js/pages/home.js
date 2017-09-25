(() => {
	App.initHome = () => {
		// variables used throughout home page
		let map;  // the world map
		let activeCountry = d3.select(null);  // the active country
		let currentDataMap = d3.map();  // the current data map

		// other variables
		let infoTableHasBeenInit = false;
		let infoDataTable;

		// colors
		const purples = ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8',
			'#807dba', '#6a51a3'];


		// function for initializing the page
		function init() {
			// build map and initialize search
			map = buildMap();
			initSearch();
			initFilters();
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

		// gets the lookup object currently being used
		function getDataLookup() {
			if (getMoneyType() === 'received') return App.recipientLookup;
			return App.fundingLookup;
		}

		// update everything if any parameters change
		function updateAll() {
			// update data map and actual map
			updateDataMap();
			updateMap();

			// update info box if showing
			if ($('.info-container').is(':visible')) {
				displayCountryInfo();
			}
		}

		// updates the country to value data map based on user settings
		function updateDataMap() {
			// get lookup (has all data)
			const dataLookup = getDataLookup();

			// TODO get filter values; need to incorporate parent/child structure correctly
			let functions = $('.function-select').val();
			let diseases = $('.disease-select').val();
			if (!functions.length) {
				functions = App.functions.map(d => d.tag_name);
				App.functions.forEach((d) => {
					d.children.forEach((c) => {
						functions.push(c.tag_name);
					});
				});
			}
			if (!diseases.length) {
				diseases = App.diseases.map(d => d.tag_name);
				App.diseases.forEach((d) => {
					d.children.forEach((c) => {
						diseases.push(c.tag_name);
					});
				});
			}

			// filter data and only use data with valid country values
			currentDataMap.clear();
			App.countries.forEach((c) => {
				const payments = dataLookup[c.ISO2];
				if (payments) {
					const filteredPayments = payments
						//.filter(p => Util.hasCommonElement(functions, p.project_function))
						//.filter(p => Util.hasCommonElement(diseases, p.project_disease));
					const value = d3.sum(filteredPayments, p => p.total_committed);
					currentDataMap.set(c.ISO2, value);
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
			d3.selectAll('.country').transition()
				.duration(500)
				.style('fill', (d) => {
					const isoCode = d.properties.ISO2;
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
		function displayCountryInfo() {
			const moneyType = getMoneyType();
			const dataLookup = getDataLookup();
			const d = activeCountry.datum();
			const payments = dataLookup[d.properties.ISO2];

			// define info close button behavior
			$('.info-close-button').on('click', resetMap);

			// populate info title
			$('.info-title').text(d.properties.NAME);

			// if there are no payments, return
			if (!payments) {
				const valueText = (moneyType === 'received') ? 
					'No data for payments received by this country' :
					'No data for money donated by this country';
				$('.info-total-value').html(valueText);
				$('.info-table-container').hide();
				$('.info-container').slideDown();
				return;
			} else {
				$('.info-table-container').show();
			}

			// populate info total value
			let totalValue = 0;
			if (currentDataMap.has(d.properties.ISO2)) {
				totalValue = currentDataMap.get(d.properties.ISO2);
			}
			const valueLabel = (moneyType === 'received') ?
				'Total Received' : 'Total Donated';
			const valueText = App.formatMoney(totalValue);
			$('.info-total-value').html(`${valueLabel}: <b>${valueText}</b>`);

			// define column data for info table
			const headerData = [
				{ name: 'Donor', value: 'donor_name' },
				{ name: 'Recipient', value: 'recipient_name' },
				{ name: 'Name', value: 'project_name' },
				{ name: 'Value', value: 'total_disbursed', format: App.formatMoneyFull },
			];

			// clear DataTables plugin from table
			if (infoTableHasBeenInit) infoDataTable.destroy();

			// populate table
			const infoTable = d3.select('.info-table');
			const infoThead = infoTable.select('thead tr');
			const headers = infoThead.selectAll('th')
				.data(headerData);
			headers.exit().remove();
			headers.enter().append('th')
				.merge(headers)
				.text(d => d.name);

			const infoTbody = infoTable.select('tbody');
			const rows = infoTbody.selectAll('tr')
				.data(payments);
			rows.exit().remove();
			const newRows = rows.enter().append('tr');

			const cells = newRows.merge(rows).selectAll('td')
				.data(d => headerData.map(c => ({ rowData: d, colData: c })));
			cells.exit().remove();
			cells.enter().append('td')
				.merge(cells)
				.text((d) => {
					const cellValue = d.rowData[d.colData.value];
					if (d.colData.format) return d.colData.format(cellValue);
					return cellValue;
				});

			// show info
			$('.info-container').slideDown();

			// initialize DataTables plugin, if not already
			infoDataTable = $('.info-table').DataTable({
				scrollY: '30vh',
				scrollCollapse: false,
				order: [3, 'desc'],
				columnDefs: [
					{ type: 'money', targets: 3 },
				],
			});
			infoTableHasBeenInit = true;
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.country-search-input', (result) => {
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

		// populates the filters in the map options box
		function initFilters() {
			// populate dropdowns
			populateSelect('.function-select', App.functions);
			populateSelect('.disease-select', App.diseases);

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				dropRight: true,
				includeSelectAllOption: true,
				enableClickableOptGroups: true,
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

		function populateSelect(selector, data) {
			const optgroups = d3.select(selector).selectAll('optgroup')
				.data(data)
				.enter().append('optgroup')
					.attr('label', d => d.tag_name)
					.text(d => d.tag_name);
			optgroups.selectAll('option')
				.data(d => d.children)
				.enter().append('option')
					.attr('selected', true)
					.attr('value', d => d.tag_name)
					.text(d => d.tag_name);
		}

		init();
	};
})();
