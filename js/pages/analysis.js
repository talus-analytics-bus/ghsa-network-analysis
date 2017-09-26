(() => {
	App.initAnalysis = (countryIso) => {
		function init() {
			populateFilters();
			initSearch();
			drawCharts();
		}

		function drawCharts() {
			// collate the data
			const fundingData = App.countries.map((c) => {
				let totalFunded = 0;
				let totalReceived = 0;
				if (App.fundingLookup[c.ISO2]) {
					totalFunded = d3.sum(App.fundingLookup[c.ISO2], d => d.total_disbursed);
				}
				if (App.recipientLookup[c.ISO2]) {
					totalReceived = d3.sum(App.recipientLookup[c.ISO2], d => d.total_disbursed);
				}

				return {
					NAME: c.NAME,
					funded: totalFunded,
					received: totalReceived,
					POP2005: c.POP2005,
				};
			});

			// build the chart
			App.buildScatterplot('.scatterplot-container', fundingData);
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
