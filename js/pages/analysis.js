(() => {
	App.initAnalysis = (countryIso) => {
		function init() {
			populateFilters();
			initSearch();
			drawCharts();
		}

		function drawCharts() {
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
			console.log(fundedData);

			// build the chart
			App.buildCirclePack('.countries-funded-container', fundedData, {
				tooltipLabel: 'Total Funded',
				colors: ['#c6dbef', '#084594'],
			});
			App.buildCirclePack('.countries-received-container', receivedData, {
				tooltipLabel: 'Total Received',
				colors: ['#feedde', '#8c2d04'],
			});
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
				// TODO

			});
		}

		init();
	};
})();
