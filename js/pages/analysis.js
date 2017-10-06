(() => {
	App.initAnalysis = (countryIso) => {
		// define constants
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear;

		//
		populateFilters();
		initSlider();
		initSearch();

		if (countryIso) {
			$('.analysis-country-content').slideDown();
			App.initAnalysisCountry(countryIso);
		} else {
			App.initAnalysisGlobal();
			$('.analysis-global-content').slideDown();
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
		}

		// initializes slider functionality
		function initSlider() {
			const slider = App.initSlider('.time-slider', {
				min: App.dataStartYear,
				max: App.dataEndYear,
				value: [startYear, endYear],
				tooltip: 'hide',
			})
			slider.on('change', (event) => {
				const years = event.target.value.split(',');
				if (+years[0] !== startYear || +years[1] !== endYear) {
					startYear = +years[0];
					endYear = +years[1];
					// TODO
				}
			});
			return slider;
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.country-search-input', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			});
		}

		// filters a set of given payments based on filters chosen by user
		function getFilteredPayments(payments) {
			let ccs = $('.cc-select').val();
			if (!ccs.length) ccs = App.capacities.map(d => d.id);
			return payments.filter((p) => {
				// TODO
				return true;
			});
		}
	};
})();
