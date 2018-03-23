(() => {
	App.initAnalysis = (tab) => {
		let currentTab = tab;
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear + 1;
		let networkMap;
		let activeCountry;

		function init() {
			initTabs();
			updateTab();

			if (tab === 'network') {
				populateFilters();
				initSlider();
				initNetworkSearch();
				initNetworkCountryBox();
				networkMap = buildNetworkMap();
			} else if (tab === 'country') {
				initTableSearch();
				populateTables('.donor-table', '.recipient-table');
			}
		}

		function initTabs() {
			// define info table tab behavior
			$('.analysis-global-tab-container .btn').on('click', function changeTab() {
				currentTab = $(this).attr('tab');
				if (currentTab === 'network') hasher.setHash('analysis');
				else hasher.setHash(`analysis/${currentTab}`);
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
			App.populateCcDropdown('.cc-select');
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
			});
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
		function initNetworkSearch() {
			App.initCountrySearchBar('.network-country-search', (result) => {
				displayCountryInNetwork(result.ISO2);
			}, {
				includeNonCountries: true,
			});
		}

		function initTableSearch() {
			App.initCountrySearchBar('.table-country-search', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			}, {
				width: 400,
				includeNonCountries: true,
			});
		}

		function populateTables(donorSelector, recSelector) {
			const numRows = 10;
			const fundColor = App.fundColorPalette;
			const receiveColor = App.receiveColorPalette;

			// get top funded countries
			const countriesByFunding = [];
			for (const iso in App.fundingLookup) {
				if (iso !== 'Not reported') {
					countriesByFunding.push({
						iso,
						name: App.codeToNameMap.get(iso),
						total_committed: d3.sum(App.fundingLookup[iso], d => d.total_committed),
						total_spent: d3.sum(App.fundingLookup[iso], d => d.total_spent),
					});
				}
			}
			Util.sortByKey(countriesByFunding, 'total_spent', true);

			// get top recipient countries
			const countriesByReceived = [];
			for (const iso in App.recipientLookup) {
				if (iso !== 'Not reported') {
					countriesByReceived.push({
						iso,
						name: App.codeToNameMap.get(iso),
						total_committed: d3.sum(App.recipientLookup[iso], d => d.total_committed),
						total_spent: d3.sum(App.recipientLookup[iso], d => d.total_spent),
					});
				}
			}
			Util.sortByKey(countriesByReceived, 'total_spent', true);

			// populate funding table
			const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
				.data(countriesByFunding.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', (d, i) => fundColor[Math.floor(i / 2)])
					.style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							hasher.setHash(`analysis/${d.iso}`);
						}
					});
			dRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				const name = App.codeToNameMap.get(d.iso);
				return `<div class="flag-container">${flagHtml}</div>` +
					`<div class="name-container">${name}</div>`;
			});
			dRows.append('td').text(d => App.formatMoney(d.total_committed));
			dRows.append('td').text(d => App.formatMoney(d.total_spent));

			// populate recipient table
			const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
				.data(countriesByReceived.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', (d, i) => receiveColor[Math.floor(i / 2)])
					.style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							hasher.setHash(`analysis/${d.iso}`);
						}
					});
			rRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				const name = country ? country.NAME : d.iso;
				return `<div class="flag-container">${flagHtml}</div>` +
					`<div class="name-container">${name}</div>`;
			});
			rRows.append('td').text(d => App.formatMoney(d.total_committed));
			rRows.append('td').text(d => App.formatMoney(d.total_spent));
		}

		function getTotalFunc() {
			const ccs = $('.cc-select').val();
			const ind = $('.money-type-filter input:checked').attr('ind');
			const indName = (ind === 'committed') ? 'committed_by_year' : 'spent_by_year';
			return (p) => {
				// for network map, no "Not reported" recipients
				if (p.recipient_country === 'Not reported') return 0;

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
			const networkData = [];
			const fundsByRegion = {};

			// add each country with non-zero donated or received funds
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const iso = c.ISO2;
				// remove general global benefit
				const fundedPaymentsTmp = App.fundingLookup[iso];
				const receivedPayments = App.recipientLookup[iso];
				const fundedPayments = (fundedPaymentsTmp) ? fundedPaymentsTmp.filter((project) => project.recipient_name !== "General Global Benefit") : undefined;

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
								const rIso = p.recipient_country;
								if (!fundsByRegion[region][sub][iso].fundsByC[rIso]) {
									fundsByRegion[region][sub][iso].fundsByC[rIso] = 0;
								}
								fundsByRegion[region][sub][iso].fundsByC[rIso] += value;
							}
						});
					}
				}
			}

			// add non-countries
			fundsByRegion['Other Funders'] = { 'Other Funders': {} };
			for (const iso in App.fundingLookup) {
				if (!App.countries.find(c => c.ISO2 === iso)) {
					fundsByRegion['Other Funders']['Other Funders'][iso] = {
						totalFunded: d3.sum(App.fundingLookup[iso], d => totalFunc(d)),
						totalReceived: 0,
						fundsByC: {},
					};
					App.fundingLookup[iso].forEach((p) => {
						const value = totalFunc(p);
						if (value) {
							const rIso = p.recipient_country;
							if (!fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso]) {
								fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso] = 0;
							}
							fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso] += value;
						}
					});
				}
			}

			// build chord chart data
			for (const r in fundsByRegion) {
				const region = {
					name: r,
					children: [],
					totalFunded: 0,
					totalReceived: 0,
					totalFlow: 0,
				};
				for (const sub in fundsByRegion[r]) {
					const subregion = {
						name: sub,
						children: [],
						totalFunded: 0,
						totalReceived: 0,
						totalFlow: 0,
					};
					for (const iso in fundsByRegion[r][sub]) {
						const funds = [];
						for (const rIso in fundsByRegion[r][sub][iso].fundsByC) {
							funds.push({
								donor: iso,
								recipient: rIso,
								value: fundsByRegion[r][sub][iso].fundsByC[rIso],
							});
						}
						const totalFunded = fundsByRegion[r][sub][iso].totalFunded;
						const totalReceived = fundsByRegion[r][sub][iso].totalReceived;
						subregion.children.push({
							name: App.codeToNameMap.get(iso),
							iso,
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
				networkData.push(region);
			}
			return networkData;
		}

		function buildNetworkMap() {
			const networkData = getNetworkData();
			const chart = App.buildNetworkMap('.network-map-content', networkData, {
				countryClickFn: displayCountryInNetwork,
			});
			chart.select('.overlay').on('click', unselectNetworkCountry);
			return chart;
		}

		function updateNetworkMap() {
			const moneyType = $('.money-type-filter input:checked').attr('ind');
			const networkData = getNetworkData();
			if (!networkData.length) {
				$('.network-map-content').hide();
				$('.network-map-no-content').show();
			} else {
				$('.network-map-content').show();
				$('.network-map-no-content').hide();
			}
			networkMap.update(networkData, moneyType);
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
			d3.selectAll('.country-arc').classed('active', false);
			d3.selectAll('.link').classed('search-hidden', false);
		}

		function displayCountryInNetwork(countryIso) {
			unhighlightNetwork();

			const countryName = App.codeToNameMap.get(countryIso);

			// highlight arc and links
			const arc = d3.selectAll('.country-arc')
				.filter(c => c.iso === countryIso)
				.classed('active', true);
			d3.selectAll('.link')
				.filter(l => l.donor !== countryIso && l.recipient !== countryIso)
				.classed('search-hidden', true);

			// if not found, display warning message
			if (arc.empty()) {
				noty({
					text: `<b>There are no funding data for ${countryName} in this time range.`,
				});
				unhighlightNetwork();
				return;
			}

			// populate country info
			const data = arc.datum();
			activeCountry = countryIso;
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

			// clicking the "show more" button takes user to country page
			$('.nci-more-button').off('click').on('click', () => {
				hasher.setHash(`analysis/${data.iso}`);
			});

			// display country info
			$('.network-country-info').slideDown();
		}

		init();
	};
})();
