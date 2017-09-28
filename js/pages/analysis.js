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
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const fc = Object.assign({}, c);
				if (App.fundingLookup[c.ISO2]) {
					fc.total_committed = d3.sum(App.fundingLookup[c.ISO2], d => d.total_committed);
					fc.total_spent = d3.sum(App.fundingLookup[c.ISO2], d => d.total_spent);
					fundedData.push(fc);
				}

				const rc = Object.assign({}, c);
				if (App.recipientLookup[c.ISO2]) {
					rc.total_committed = d3.sum(App.recipientLookup[c.ISO2], d => d.total_committed);
					rc.total_spent = d3.sum(App.recipientLookup[c.ISO2], d => d.total_spent);
					receivedData.push(rc);
				}
			}

			// build the chart
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

		// populates the filters in the map options box
		function populateFilters() {
			// populate dropdowns
			Util.populateSelect('.function-select', App.functions, { selected: true });
			Util.populateSelect('.disease-select', App.diseases, { selected: true });

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				includeSelectAllOption: true,
				numberDisplayed: 0,
			});
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.country-search-input', (result) => {
				console.log(result);
				hasher.setHash(`analysis/${result.ISO2}`);
			});
		}

		init();
	};
})();
