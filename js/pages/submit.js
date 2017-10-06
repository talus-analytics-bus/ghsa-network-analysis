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
			valKey: 'ISO2',
			nameKey: 'NAME',
		});
		Util.populateSelect('.cc-select', App.capacities, {
			valKey: 'id',
			nameKey: 'name',
		});
		$('.cc-select').multiselect({
			maxHeight: 260,
			numberDisplayed: 1,
		});
	};
})();
