(() => {
	App.initHome = () => {
		// lookup variables used throughout
		let fundingLookup;
		let recipientLookup;

		// function for initializing the page
		function init() {
			NProgress.start();

			// load world data
			d3.json('data/world-50m.json', (error, worldData) => {
				if (error) throw error;

				console.log(worldData);
				const map = buildMap(worldData);
				initSearch(worldData);

				// load funding data
				d3.json('data/funding_data.json', (error, data) => {
					console.log(data);

					// data collation
					fundingLookup = d3.map(data, d => d.donor_country);
					recipientLookup = d3.map(data, d => d.recipient_country);

					populateFilters(data);
					updateMap(map, data);

					NProgress.done();
				});
			});
		}


		/* ---------------------- Functions ----------------------- */
		function buildMap(worldData) {
			return Map.createWorldMap('.map-container', worldData);
		}

		function getFilteredData() {
			return fundingLookup;
		}

		function updateMap(map) {
			const filteredData = getFilteredData();
		}

		function initSearch(worldData) {

		}

		function populateFilters(data) {
			// get unique values from data
			const functions = d3.map(data, d => d.project_function).keys()
				.filter(d => d !== 'undefined')
				.sort();
			const diseases = d3.map(data, d => d.project_disease).keys()
				.filter(d => d !== 'undefined')
				.sort();

			// populate dropdowns
			Util.populateSelect('.function-select', functions, { selected: true });
			Util.populateSelect('.disease-select', diseases, { selected: true });

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				dropRight: true,
				includeSelectAllOption: true,
				numberDisplayed: 0,
			});

			// show map options
			$('.map-options-container').show();
		}

		init();
	}
})();
