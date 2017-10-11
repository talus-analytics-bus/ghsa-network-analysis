(() => {
	App.initAnalysis = (countryIso, typeOrRecCountryIso) => {
		// define constants
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear;

		// initialize filters section
		/*populateFilters();
		initSlider();
		initSearch();*/

		// show correct content
		if (countryIso && typeOrRecCountryIso) {
			if (typeOrRecCountryIso === 'd' || typeOrRecCountryIso === 'r') {
				$('.analysis-country-content').slideDown();
				App.initAnalysisCountry(countryIso, typeOrRecCountryIso);
			} else {
				$('.analysis-pair-content').slideDown();
				App.initAnalysisPair(countryIso, typeOrRecCountryIso);
			}
		} else if (countryIso) {
			$('.analysis-country-content').slideDown();
			App.initAnalysisCountry(countryIso);
		} else {
			App.initAnalysisGlobal();
			$('.analysis-global-content').slideDown();
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
