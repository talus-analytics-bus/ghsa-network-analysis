(() => {
	App.initAnalysis = () => {
		let currentTab = 'global';
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear + 1;
		let networkMap;
		let activeCountry;

		function init() {
			initTabs();
			populateFilters();
			initSlider();
			initSearch();
			updateTab();
			populateTables('.donor-table', '.recipient-table');
			initNetworkCountryBox();
			networkMap = buildNetworkMap();
		}

		function initTabs() {
			// define info table tab behavior
			$('.analysis-global-tab-container .btn').on('click', function changeTab() {
				currentTab = $(this).attr('tab');
				updateTab();
			});
		}

		function updateTab() {
			// make correct tab active
			$(`.analysis-global-tab-container .btn[tab="${currentTab}"]`)
				.addClass('active')
				.siblings().removeClass('active');
			$(`.global-tab-content-container .tab-content[tab="${currentTab}"]`)
				.slideDown()
				.siblings().slideUp();
		}

		// populates the filters in the map options box
		function populateFilters() {
			// populate dropdowns
			Util.populateSelect('.cc-select', App.capacities, {
				valKey: 'id',
				nameKey: 'name',
				selected: true,
			});
			$('.cc-select').multiselect({
				maxHeight: 260,
				includeSelectAllOption: true,
				enableClickableOptGroups: true,
				numberDisplayed: 0,
			});
			$('.cc-select').on('change', updateNetworkMap);

			// initialize radio button functionality
			$('.network-map-options .radio-option').click(function clickedRadio() {
				const $option = $(this);
				$option.find('input').prop('checked', true);
				$option.siblings().find('input').prop('checked', false);
				updateNetworkMap();
			});
			
			// add info tooltips
			$('.committed-info-img').tooltipster({
				content: 'The <b>amount committed</b> refers to the amount of money committed.',
			});
			$('.disbursed-info-img').tooltipster({
				content: 'The <b>amount disbursed</b> refers to the amount of money the ' +
					'recipient country has received.',
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
					updateNetworkMap();
				}
			});
			return slider;
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.network-country-search', (result) => {
				displayCountryInNetwork(result.NAME);
			});
			App.initCountrySearchBar('.table-country-search', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			});
		}

		function populateTables(donorSelector, recSelector) {
			const numRows = 10;

			// get top funded countries
			const countriesByFunding = [];
			for (let iso in App.fundingLookup) {
				if (iso !== 'Not reported') {
					const country = App.countries.find(c => c.ISO2 === iso);
					countriesByFunding.push({
						iso,
						name: country ? country.NAME : iso,
						total_committed: d3.sum(App.fundingLookup[iso], d => d.total_committed),
						total_spent: d3.sum(App.fundingLookup[iso], d => d.total_spent),
					});
				}
			}
			Util.sortByKey(countriesByFunding, 'total_spent', true);

			// get top recipient countries
			const countriesByReceived = [];
			for (let iso in App.recipientLookup) {
				if (iso !== 'Not reported') {
					const country = App.countries.find(c => c.ISO2 === iso);
					countriesByReceived.push({
						iso,
						name: country ? country.NAME : iso,
						total_committed: d3.sum(App.recipientLookup[iso], d => d.total_committed),
						total_spent: d3.sum(App.recipientLookup[iso], d => d.total_spent),
					});
				}
			}
			Util.sortByKey(countriesByReceived, 'total_spent', true);

			// populate funding table
			const blues = ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff'];
			const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
				.data(countriesByFunding.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', (d, i) => blues[Math.floor(i / 2)])
					.style('color', (d, i) => (i < 4) ? '#fff' : 'black')
					.on('click', (d) => {
						if (d.iso.length === 2) hasher.setHash(`analysis/${d.iso}`);
					});
			dRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				return `<div class="flag-container">${flagHtml}</div><b>${d.name}</b>`;
			});
			dRows.append('td').text(d => App.formatMoney(d.total_committed));
			dRows.append('td').text(d => App.formatMoney(d.total_spent));

			// populate recipient table
			const oranges = ['#993404', '#d95f0e', '#fe9929', '#fed98e', '#ffffd4'];
			const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
				.data(countriesByReceived.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', (d, i) => oranges[Math.floor(i / 2)])
					.style('color', (d, i) => (i < 4) ? '#fff' : 'black')
					.on('click', (d) => {
						if (d.iso.length === 2) hasher.setHash(`analysis/${d.iso}`);
					});
			rRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				return `<div class="flag-container">${flagHtml}</div><b>${d.name}</b>`;
			});
			rRows.append('td').text(d => App.formatMoney(d.total_committed));
			rRows.append('td').text(d => App.formatMoney(d.total_spent));
		}

		function getTotalFunc() {
			const ccs = $('.cc-select').val();
			const ind = $('.money-type-filter input:checked').attr('ind');
			const indName = (ind === 'committed') ? 'committed_by_year' : 'spent_by_year';
			return (p) => {
				// run through filter first
				if (!App.passesCategoryFilter(p.core_capacities, ccs)) return 0;

				// get total for years
				let total = 0;
				for (let i = startYear; i < endYear; i++) {
					total += p[indName][i];
				}
				return total;
			};			
		}

		function getNetworkData() {
			// get data function
			const totalFunc = getTotalFunc();

			// separate the data by region, subregion, country
			const fundedData = [];
			const receivedData = [];
			const chordData = [];
			const fundsByRegion = {};
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const iso = c.ISO2;
				const fundedPayments = App.fundingLookup[iso];
				const receivedPayments = App.recipientLookup[iso];

				// construct chord data; sort by region and subregion
				let totalFunded = 0;
				let totalReceived = 0;
				if (fundedPayments) totalFunded = d3.sum(fundedPayments, d => totalFunc(d));
				if (receivedPayments) totalReceived = d3.sum(receivedPayments, d => totalFunc(d));
				if (totalFunded || totalReceived) {
					const region = c.regionName;
					const sub = c.subRegionName;
					if (!fundsByRegion[region]) fundsByRegion[region] = {};
					if (!fundsByRegion[region][sub]) fundsByRegion[region][sub] = {};
					if (!fundsByRegion[region][sub][iso]) {
						fundsByRegion[region][sub][iso] = {
							totalFunded,
							totalReceived,
							fundsByC: {},
						};
					}
					
					if (fundedPayments) {
						fundedPayments.forEach((p) => {
							const value = totalFunc(p);
							if (value) {
								// check that the recipient is a valid country
								const rIso = p.recipient_country;
								const rCountry = App.countries.find(c => c.ISO2 === rIso);
								if (rCountry) {
									const rName = rCountry.NAME;
									if (!fundsByRegion[region][sub][iso].fundsByC[rName]) {
										fundsByRegion[region][sub][iso].fundsByC[rName] = 0;
									}
									fundsByRegion[region][sub][iso].fundsByC[rName] += value;
								}
							}
						});
					}
				}
			}

			// build chord chart data
			for (let r in fundsByRegion) {
				const region = {
					name: r,
					children: [],
					totalFunded: 0,
					totalReceived: 0,
					totalFlow: 0,
				};
				for (let sub in fundsByRegion[r]) {
					const subregion = {
						name: sub,
						children: [],
						totalFunded: 0,
						totalReceived: 0,
						totalFlow: 0,
					};
					for (let iso in fundsByRegion[r][sub]) {
						const country = App.countries.find(c => c.ISO2 === iso);
						const funds = [];
						for (let rName in fundsByRegion[r][sub][iso].fundsByC) {
							funds.push({
								donor: country.NAME,
								recipient: rName,
								value: fundsByRegion[r][sub][iso].fundsByC[rName],
							});
						}
						const totalFunded = fundsByRegion[r][sub][iso].totalFunded;
						const totalReceived = fundsByRegion[r][sub][iso].totalReceived;
						subregion.children.push({
							name: country.NAME,
							iso: iso,
							totalFunded,
							totalReceived,
							totalFlow: totalFunded + totalReceived,
							funds,
						});
						subregion.totalFunded += totalFunded;
						subregion.totalReceived += totalReceived;
						subregion.totalFlow += totalFunded + totalReceived;
					}
					region.children.push(subregion);
					region.totalFunded += subregion.totalFunded;
					region.totalReceived += subregion.totalReceived;
					region.totalFlow += subregion.totalFlow;
				}
				chordData.push(region);
			}
			return chordData;
		}

		function buildNetworkMap() {
			const networkData = getNetworkData();
			const networkMap = App.buildNetworkMap('.network-map-content', networkData, {
				countryClickFn: displayCountryInNetwork,
			});
			networkMap.select('.overlay').on('click', unselectNetworkCountry);
			return networkMap;
		}

		function updateNetworkMap() {
			const networkData = getNetworkData();
			if (!networkData.length) {
				$('.network-map-content').hide();
				$('.network-map-no-content').show();
			} else {
				$('.network-map-content').show();
				$('.network-map-no-content').hide();
			}
			networkMap.update(networkData);
			if ($('.network-country-info').is(':visible')) {
				displayCountryInNetwork(activeCountry);
			}
		}

		function initNetworkCountryBox() {
			$('.info-close-button').click(unselectNetworkCountry);
		}

		function unselectNetworkCountry() {
			unhighlightNetwork();

			// hide country info display
			$('.network-country-info').slideUp();
		}

		function unhighlightNetwork() {
			// unhighlight arcs and links
			d3.selectAll('.country-arc, .link').classed('active', false);
		}

		function displayCountryInNetwork(countryName) {
			unhighlightNetwork();

			// highlight arc and links
			const arc = d3.selectAll('.country-arc')
				.filter(c => c.name === countryName)
				.classed('active', true);
			d3.selectAll('.link')
				.filter(l => l.donor === countryName || l.recipient === countryName)
				.classed('active', true);

			// if not found, display warning message
			if (arc.empty()) {
				noty({
					text: `<b>There are no funding data for ${countryName} in this time range.`,
				});
				return;
			}

			// populate country info
			const data = arc.datum();
			activeCountry = countryName;
			$('.nci-title').text(countryName);
			if (data.totalFunded) {
				$('.nci-donor-value').text(App.formatMoney(data.totalFunded));
				$('.nci-donor-section').slideDown();
			} else {
				$('.nci-donor-section').slideUp();
			}
			if (data.totalReceived) {
				$('.nci-recipient-value').text(App.formatMoney(data.totalReceived));
				$('.nci-recipient-section').slideDown();
			} else {
				$('.nci-recipient-section').slideUp();
			}

			// display country info
			$('.network-country-info').slideDown();
		}

		init();
	};
})();
