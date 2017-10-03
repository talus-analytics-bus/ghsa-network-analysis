(() => {
	App.initSubmit = () => {
		$('.start-date-input, .end-date-input').datepicker({
			autoclose: true,
			assumeNearbyYear: true,
			clearBtn: true,
			container: '.submit-page-container',
			immediateUpdates: true,
		});
	};
})();
