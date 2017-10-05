(() => {
	App.initAnalysis = (countryIso) => {
		populateFilters();
		initSearch();

		if (countryIso) {
			$('.analysis-country-content').slideDown();
			App.initAnalysisCountry(countryIso);
		} else {
			App.initAnalysisGlobal();
			$('.analysis-global-content').slideDown();
		}
	};

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
})();
