(() => {
	App.initAnalysis = (countryIso) => {
		function init() {
			populateFilters();
			initSearch();

			if (countryIso) {
				populateCountryContent();
				$('.analysis-country-content').slideDown();
			} else {
				populateGlobalContent();
				$('.analysis-global-content').slideDown();
			}
		}

		function populateGlobalContent() {
			drawGlobalCharts();
		}

		function populateCountryContent() {
			const country = App.countries.find(c => c.ISO2 === countryIso);
			$('.analysis-country-title').text(country.NAME);
			drawCountryCharts();
		}

		function drawGlobalCharts() {
			// collate the data
			const fundedData = [];
			const receivedData = [];
			const chordData = [];
			const fundsByRegion = {};
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const iso = c.ISO2;
				const fundedPayments = App.fundingLookup[iso];
				const receivedPayments = App.recipientLookup[iso];

				// add country to funding data
				const fc = Object.assign({}, c);
				if (fundedPayments) {
					fc.total_committed = d3.sum(fundedPayments, d => d.total_committed);
					fc.total_spent = d3.sum(fundedPayments, d => d.total_spent);
					fundedData.push(fc);
				}

				// add country to recipient data
				const rc = Object.assign({}, c);
				if (receivedPayments) {
					rc.total_committed = d3.sum(receivedPayments, d => d.total_committed);
					rc.total_spent = d3.sum(receivedPayments, d => d.total_spent);
					receivedData.push(rc);
				}

				// collect funds by region
				if (fundedPayments) {
					const region = c.regionName;
					const sub = c.subRegionName;
					if (!fundsByRegion[region]) fundsByRegion[region] = {};
					if (!fundsByRegion[region][sub]) fundsByRegion[region][sub] = {};
					fundedPayments.forEach((p) => {
						if (p.total_spent) {
							// check that the recipient is a valid country
							const rIso = p.recipient_country;
							const rCountry = App.countries.find(c => c.ISO2 === rIso);
							if (rCountry) {
								// add recipient country to data, if not already
								const rRegion = rCountry.regionName;
								const rSub = rCountry.subRegionName;
								if (!fundsByRegion[rRegion]) fundsByRegion[rRegion] = {};
								if (!fundsByRegion[rRegion][sub]) fundsByRegion[rRegion][sub] = {};
								if (!fundsByRegion[rRegion][sub][rIso]) fundsByRegion[rRegion][sub][rIso] = {};

								// add donor country to data
								if (!fundsByRegion[region][sub][iso]) fundsByRegion[region][sub][iso] = {};
								if (!fundsByRegion[region][sub][iso][rIso]) fundsByRegion[region][sub][iso][rIso] = 0;
								fundsByRegion[region][sub][iso][rIso] += p.total_spent;
							}
						}
					});
				}
			}

			// build chord chart data
			for (let r in fundsByRegion) {
				const region = {
					name: r,
					children: [],
				};
				for (let sub in fundsByRegion[r]) {
					const subregion = {
						name: sub,
						children: [],
					};
					for (let iso in fundsByRegion[r][sub]) {
						const country = App.countries.find(c => c.ISO2 === iso);
						const funds = [];
						for (let rIso in fundsByRegion[r][sub][iso]) {
							const rCountry = App.countries.find(c => c.ISO2 === rIso);
							funds.push({
								recipient: rCountry.NAME,
								value: fundsByRegion[r][sub][iso][rIso],
							});
						}
						subregion.children.push({
							name: country.NAME,
							iso: iso,
							funds,
						});
					}
					region.children.push(subregion);
				}
				chordData.push(region);
			}


			// build the charts
			App.buildCirclePack('.global-funded-container', fundedData, {
				tooltipLabel: 'Total Funded',
				colors: ['#c6dbef', '#084594'],
				onClick: iso => hasher.setHash(`analysis/${iso}`),
			});
			App.buildCirclePack('.global-received-container', receivedData, {
				tooltipLabel: 'Total Received',
				colors: ['#feedde', '#8c2d04'],
				onClick: iso => hasher.setHash(`analysis/${iso}`),
			});
			App.buildChordDiagram('.chord-chart', chordData);
		}

		function drawCountryCharts() {
			if (App.fundingLookup[countryIso]) {
				const fundedData = [];
				const fundedByCountry = {};
				App.fundingLookup[countryIso].forEach((p) => {
					if (!fundedByCountry[p.recipient_country]) {
						fundedByCountry[p.recipient_country] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					fundedByCountry[p.recipient_country].total_committed += p.total_committed;
					fundedByCountry[p.recipient_country].total_spent += p.total_spent;
				});
				App.countries.forEach((c) => {
					if (fundedByCountry[c.ISO2]) {
						const cCopy = Object.assign({}, c);
						cCopy.total_committed = fundedByCountry[c.ISO2].total_committed;
						cCopy.total_spent = fundedByCountry[c.ISO2].total_spent;
						fundedData.push(cCopy);
					}
				});
				App.buildCirclePack('.country-funded-container', fundedData, {
					tooltipLabel: 'Total Funded',
					colors: ['#c6dbef', '#084594'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.country-funded-description')
					.html('<i>There are no data for countries funded by this country.</i>');
			}

			if (App.recipientLookup[countryIso]) {
				const receivedData = [];
				const receivedByCountry = {};
				App.recipientLookup[countryIso].forEach((p) => {
					if (!receivedByCountry[p.donor_country]) {
						receivedByCountry[p.donor_country] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					receivedByCountry[p.donor_country].total_committed += p.total_committed;
					receivedByCountry[p.donor_country].total_spent += p.total_spent;
				});
				App.countries.forEach((c) => {
					if (receivedByCountry[c.ISO2]) {
						const cCopy = Object.assign({}, c);
						cCopy.total_committed = receivedByCountry[c.ISO2].total_committed;
						cCopy.total_spent = receivedByCountry[c.ISO2].total_spent;
						receivedData.push(cCopy);
					}
				});
				App.buildCirclePack('.country-received-container', receivedData, {
					tooltipLabel: 'Total Received',
					colors: ['#feedde', '#8c2d04'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.country-received-description')
					.html('<i>There are no data for funds received by this country.</i>');
			}
		}

		// filters a set of given payments based on filters chosen by user
		function getFilteredPayments(payments) {
			const functions = App.getCategorySelectValue('.function-select');
			const diseases = App.getCategorySelectValue('.disease-select');
			return payments.filter((p) => {
				if (!App.passesCategoryFilter(p.project_function, functions)) return false;
				if (!App.passesCategoryFilter(p.project_disease, diseases)) return false;
				return true;
			});
		}

		// populates the filters in the map options box
		function populateFilters() {
			// populate dropdowns
			App.initCategorySelect('.function-select', App.functions, { selected: true });
			App.initCategorySelect('.disease-select', App.diseases, { selected: true });
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.country-search-input', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			});
		}

		init();
	};
})();
