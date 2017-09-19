const App = {};

(() => {
	App.initialize = (callback) => {
		// load currency data
		d3.json('data/currencies.json', (error, currencies) => {
			App.currencies = Object.assign({}, currencies);

			if (callback) callback();
		});
	};

	/* ------------------ Global Functions ------------------- */
	App.formatMoney = (usdValue, currencyIso) => {
		const format = d3.format(',.0f');
		const multiplier = App.currencies[currencyIso].exchange_rates
			.find(er => er.convert_from === 'USD')
			.multiplier;
		return `${format(usdValue * multiplier)} ${currencyIso}`;
	};

	App.siFormat = (num) => {
		return d3.format(',.3s')(num).replace('G', 'B');
	}


	/* ------------------ Vendor Defaults ------------------- */
	// tooltipster defaults
	$.tooltipster.setDefaults({
		contentAsHTML: true,
		trigger: 'hover',
		offset: [5, -25],
		theme: 'tooltipster-shadow',
		maxWidth: 320,
	});

	// noty defaults
	$.noty.defaults.type = 'warning';
	$.noty.defaults.layout = 'center';
	$.noty.defaults.timeout = 2000;
})();
