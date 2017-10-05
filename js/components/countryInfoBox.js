(() => {
	// initialize info box
	App.initCountryInfoBox = (param = {}) => {
		// define info close button behavior
		if (param.closeFunc) $('.info-close-button').on('click', param.closeFunc);
	};

	// update content of info box
	App.updateCountryInfoBox = (country) => {
		// populate info title
		$('.info-title').text(country.NAME);

		// define "go to analysis" button behavior
		$('.info-analysis-button')
			.off('click')
			.on('click', () => {
				hasher.setHash(`analysis/${country.ISO2}`);
			});

		// populate info total value
		const totalFunded = App.getTotalFunded(country.ISO2);
		const totalReceived = App.getTotalReceived(country.ISO2);
		$('.info-funded-value').text(App.formatMoney(totalFunded));
		$('.info-received-value').text(App.formatMoney(totalReceived));

		// display content
		$('.info-container').slideDown();
	}
})();
