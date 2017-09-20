(() => {
	App.initAnalysis = () => {
		function init() {
			populateFilters();
			initSearch();
			drawCharts();
		}

		function drawCharts() {
			// collate the data
			const fundingData = App.countries.map((c) => {
				return {
					NAME: c.NAME,
					funded: Math.pow(10, 4 + 3 * Math.random()),
					received: Math.pow(10, 4 + 3 * Math.random()),
					gdp: Math.pow(10, 4 + 3 * Math.random()),
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
