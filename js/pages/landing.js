(() => {
	App.initLanding = (tab) => {
		let currentTab = tab;
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear + 1;
		let networkMap;
		let activeCountry;
		let supportType = 'financial' // 'financial' or 'inkind'

		function init() {
            App.setSources();
			initTabs();
			updateTab();

			if (tab === 'network') {
				populateFilters();
				initSlider();
				initNetworkSearch();
				initNetworkCountryBox();
				networkMap = buildNetworkMap();
				$('.submit-data-btn').click(() => hasher.setHash('submit'))
			} else if (tab === 'country') {
				initTableSearch();
				populateTables('.donor-table', '.recipient-table');
			}
			initGhsaToggle(tab);
			initSupportTypeToggle();

			$('.btn-view-ghsa').click(function(){
				hasher.setHash('analysis/ghsa/d');
			});
			$('.btn-view-map').click(function(){
				hasher.setHash('map');
			});
			$('.btn-funders-map').click(function(){
				App.mapSet = 'funded';
				App.mapType = $('input[name=supporttype]:checked').attr('ind');
				hasher.setHash('map');
			});
			$('.btn-recipients-map').click(function(){
				App.mapSet = 'received';
				App.mapType = $('input[name=supporttype]:checked').attr('ind');
				hasher.setHash('map');
			});
			$('.inkind-support-info-img').tooltipster({
				interactive: true,
				content: App.inKindDefinition,
			});
			$('.home-image').click(()=>{
				hasher.setHash('map');
			});
		}

		function initGhsaToggle(tab = 'network') {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`input[type=radio][name="ghsa-toggle-landing"][ind="ghsa"]`).prop('checked',true);
				// $(`input[type=radio][name="ind-${tab === 'network' ? tab : 'ghsa-toggle-landing'}"][ind="ghsa"]`).prop('checked',true);
			}

			if (tab === 'country') {
				$('.global-tab-content[tab="country"] .ind-type-filter-ghsa .radio-option').click(function updateIndType() {
					// Load correct funding data
					indType = $(this).find('input').attr('ind');
					App.showGhsaOnly = indType === 'ghsa';
					App.doNotScroll = true;
					App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

					// Clear tables
					const donorSelector = '.donor-table';
					const recSelector = '.recipient-table';
					// $(`${donorSelector} tbody, ${recSelector} tbody`).html('');

					// check right radio
					$(this).find('input').prop('checked',true);

					// Repopulate tables with chosen data
					populateTables(donorSelector, recSelector);
				});
			} else if (tab === 'network') {
				$('.global-tab-content[tab="network"] .ind-type-filter-ghsa .radio-option').click(function updateIndType() {
					// Load correct funding data
					indType = $(this).find('input').attr('ind');
					App.showGhsaOnly = indType === 'ghsa';
					App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

					// Update chord diagram (network map)
					updateNetworkMap();
				});
			}

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
		}

		function initSupportTypeToggle(){
			const donorSelector = '.donor-table';
			const recSelector = '.recipient-table';
			$('input[name=supporttype]').change(function () {
				supportType = $(this).attr('ind');

				// Repopulate tables with chosen data
				populateTables(donorSelector, recSelector);
			});
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
				.show()
				.siblings().hide();
		}

		// populates the filters in the map options box
		function populateFilters() {
			// populate dropdowns
			App.populateCcDropdown('.cc-select');
			$('.cc-select').on('change', updateNetworkMap);

			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$('input[type=radio][name="ind"][ind="ghsa"]').prop('checked',true);
			}

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
				if (result.item !== undefined) result = result.item;
				hasher.setHash(`analysis/${result.ISO2}`);
			}, {
				width: 400,
				includeNonCountries: true,
			});
		}

		/**
		 * Returns true if project is not in-kind support, false otherwise
		 * @param  {Object} p             A project
		 * @return {Boolean} true if p is not in-kind, false otherwise
		 */
		function excludeInkindFilter (p) {
			if (p.assistance_type.toLowerCase() === "in-kind support") return false;
			return true;
		};

		function exportTotals (role = 'd', type = 'd') {
			const roleField = role === 'd' ? 'donor_code' : 'recipient_country';
			const roleName  = role === 'd' ? 'Funder' : 'Recipient';
			const multName  = role === 'd' ? 'Multiple funders' : 'Multiple recipients';
			const roleSectr = role === 'd' ? 'donor_sector' : 'recipient_sector';
			const unspField = role === 'd' ? 'donor_amount_unspec' : 'recipient_amount_unspec';
			const typeField = type === 'd' ? 'spent_by_year' : 'committed_by_year';
			const typeTotal = type === 'd' ? 'total_spent' : 'total_committed';
			const typeName  = type === 'd' ? 'Disbursed' : 'Committed';
			const uniqProjs = Util.uniqueCollection(App.fundingData, 'project_id');
			// TODO create a funder/recipient called Multiple here
			const projRoles = _.groupBy(uniqProjs, roleField);
			const roleLists = _.keys(projRoles);
			let output = [];
			roleLists.forEach(role => {
				const row = {};
				const roleProjs = projRoles[role].filter(d => d[unspField] !== true);
				if (roleProjs.length === 0) return;
					console.log('role = ' + role)
				if (role !== 'undefined') {
					row[roleName] = App.codeToNameMap.get(role);
					row.Sector = roleProjs[0][roleSectr];
				} else {
					row[roleName] = 'Unspecified';
					row.Sector = 'Unspecified';
				}
				for (let year = App.dataStartYear; year <= App.dataEndYear; year++) {
					row['CY' + year.toString()] = d3.sum(roleProjs, d => d[typeField][year]);
				}
				row[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`] = d3.sum(roleProjs, d => d[typeTotal]);
				if (row[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`] > 0) output.push(row);
			});
			// Add mult funder/recip row
			const multProjs = Util.uniqueCollection(App.fundingData.filter(d => d[unspField]),'project_id');
			const multRow = {};
			multRow[roleName] = multName;
			multRow.Sector = 'n/a';
			for (let year = App.dataStartYear; year <= App.dataEndYear; year++) {
				multRow['CY' + year.toString()] = d3.sum(multProjs, d => d[typeField][year]);
			}
			multRow[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`] = d3.sum(multProjs, d => d[typeTotal]);
			if (multRow[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`] > 0) output.push(multRow);

			// Sort from most to least $
			output = _.sortBy(output, 'total');

			// Add total row
			const totalRow = {};
			totalRow[roleName] = "Total";
			totalRow.Sector = 'n/a';
			for (let year = App.dataStartYear; year <= App.dataEndYear; year++) {
				totalRow['CY' + year.toString()] = d3.sum(output, d => d['CY' + year]);
			}
			totalRow[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`] = d3.sum(output, d => d[`Total (CY${App.dataStartYear} - CY${App.dataEndYear})`]);
			output.push(totalRow);
			console.log(output);
			Util.JSONToCSVConvertor(output);
		}
		App.exportTotals = exportTotals;



		function populateTables(donorSelector, recSelector) {
			const taBlue = '#082b84';
			const taRed = '#c91414';
			const numRows = Infinity;
			const fundColor = App.fundColorPalette;
			const receiveColor = App.receiveColorPalette;

			$(`${donorSelector}, ${recSelector}`).DataTable().destroy();
			$(`${donorSelector} tbody tr, ${recSelector} tbody tr`).remove();

			// get top funded countries
			const fundedFunc = (supportType === 'financial') ? App.getTotalFunded : App.getInkindFunded;
			const formatFunc = (supportType === 'financial') ? App.formatMoney : App.formatInkind;
			const receivedFunc = (supportType === 'financial') ? App.getTotalReceived : App.getInkindReceived;
			const funderNoun = (supportType === 'financial') ? 'Funder' : 'Provider';
			const dNoun = (supportType === 'financial') ? 'Disbursed' : 'Provided';
			$('.fund-table-title .text').text(`Top ${funderNoun}s (${App.dataStartYear} - ${App.dataEndYear})`);
			$('.rec-table-title .text').text(`Top Recipients (${App.dataStartYear} - ${App.dataEndYear})`);
			$('.fund-col-name').text(funderNoun);
			$('.d-col-name').text(dNoun);

			const countriesByFunding = [];
			for (const iso in App.fundingLookup) {
				if (iso !== 'Not reported' && iso !== 'ghsa' && iso !== 'General Global Benefit') {
					const newObj = {
						iso,
						name: App.codeToNameMap.get(iso),
						total_committed: fundedFunc(iso, {committedOnly: true}),
						total_spent: fundedFunc(iso),
					};
					if (newObj.total_committed !== 0 || newObj.total_spent !== 0) {
						countriesByFunding.push(newObj);
					}
				}
			}
			Util.sortByKey(countriesByFunding, 'total_spent', true);

			// get top recipient countries
			const countriesByReceived = [];
			for (const iso in App.recipientLookup) {
				if (iso !== 'Not reported' && iso !== 'ghsa' && iso !== 'General Global Benefit') {
					const newObj = {
						iso,
						name: App.codeToNameMap.get(iso),
						total_committed: receivedFunc(iso, {committedOnly: true}),
						total_spent: receivedFunc(iso),
					};
					if (newObj.total_committed !== 0 || newObj.total_spent !== 0) {
						countriesByReceived.push(newObj);
					}
				}
			}
			Util.sortByKey(countriesByReceived, 'total_spent', true);

			// populate funding table
			const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
				.data(countriesByFunding.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', '#eaeaea')
					// .style('background-color', (d, i) => fundColor[Math.floor(i / 2)])
					.style('color', 'black')
					// .style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							hasher.setHash(`analysis/${d.iso}/d`);
						}
					});
			dRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				const name = App.codeToNameMap.get(d.iso);

				return `<div class="flag-container">${flagHtml}</div>` +
					`<div class="name-container">${name}</div>`;
			});
			dRows.append('td').text(d => formatFunc(d.total_committed));
			dRows.append('td').text(d => formatFunc(d.total_spent));

			// populate recipient table
			const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
				.data(countriesByReceived.slice(0, numRows))
				.enter().append('tr')
					.style('background-color', '#eaeaea')
					.style('color', 'black')
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							hasher.setHash(`analysis/${d.iso}/r`);
						}
					});
			rRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				const name = country ? country.NAME : d.iso;
				return `<div class="flag-container">${flagHtml}</div>` +
						`<div class="name-container">${name}</div>`;
			});
			rRows.append('td').text(d => formatFunc(d.total_committed));
			rRows.append('td').text(d => formatFunc(d.total_spent));
			$(`${donorSelector}, ${recSelector}`).DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: false,
					ordering: false,
					searching: false,
					pagingType: 'simple',
					// order: [[1, 'asc']],
					// columnDefs: [
					// 	{ targets: [1,2,3], orderable: false},
					// ],
					bLengthChange: false,
				});
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
				const fundedPayments = (fundedPaymentsTmp) ? fundedPaymentsTmp : undefined;
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

		function toggleNetworkContent (networkData) {
			const noContentMessage = App.showGhsaOnly ? 'Not enough GHSA funding data to show network.' : 'There are no data with the combination of filters chosen.';
			$('.network-map-no-content > span.text').text(noContentMessage);
			if (!networkData.length || App.showGhsaOnly === true) {
				$('.network-map-content').hide();
				$('.network-map-no-content').show();
			} else {
				$('.network-map-content').show();
				$('.network-map-no-content').hide();
			}
		}

		function buildNetworkMap() {
			const networkData = getNetworkData();
			const chart = App.buildNetworkMap('.network-map-content', networkData, {
				countryClickFn: displayCountryInNetwork,
				regionPadding: 1,
			});
			chart.select('.overlay').on('click', unselectNetworkCountry);
			toggleNetworkContent(networkData);
			return chart;
		}

		function updateNetworkMap() {
			const moneyType = $('.money-type-filter input:checked').attr('ind');
			const networkData = getNetworkData();
			toggleNetworkContent(networkData);
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
