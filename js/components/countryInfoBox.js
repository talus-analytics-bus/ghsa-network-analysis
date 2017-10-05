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
		let totalFunded = 0;
		let totalReceived = 0;
		if (App.fundingLookup[country.ISO2]) {
			totalFunded = d3.sum(App.fundingLookup[country.ISO2], d => d.total_spent);
		}
		if (App.recipientLookup[country.ISO2]) {
			totalReceived = d3.sum(App.recipientLookup[country.ISO2], d => d.total_spent);
		}
		$('.info-funded-value').text(App.formatMoney(totalFunded));
		$('.info-received-value').text(App.formatMoney(totalReceived));

		// display content
		$('.info-container').slideDown();
	}
})();
