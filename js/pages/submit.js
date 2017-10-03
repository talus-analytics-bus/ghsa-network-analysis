(() => {
	App.initSubmit = () => {
		// initialize datepickers
		$('.start-date-input, .end-date-input').datepicker({
			autoclose: true,
			assumeNearbyYear: true,
			clearBtn: true,
			container: '.submit-page-container',
			immediateUpdates: true,
		});

		// populate dropdowns
		Util.populateSelect('.country-select', App.countries, {
			nameKey: 'NAME',
			valKey: 'ISO2',
		});
		App.initCategorySelect('.function-select', App.functions, {
			includeSelectAllOption: false,
		});
		App.initCategorySelect('.disease-select', App.diseases, {
			includeSelectAllOption: false,
		});
	};
})();
