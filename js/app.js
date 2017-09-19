const App = {};

(() => {
	App.initialize = (callback) => {
		// load currency data
		d3.json('data/currencies.json', (error, currencies) => {
			App.currencies = Object.assign({}, currencies);
			App.currencyIso = 'USD';

			if (callback) callback();
		});
	};

	/* ------------------ Global Functions ------------------- */
	App.siFormat = num => d3.format(',.3s')(num).replace('G', 'B');
	App.formatMoneyShort = (usdValue, currencyIso) => {
		const multiplier = App.currencies[currencyIso].exchange_rates
			.find(er => er.convert_from === 'USD')
			.multiplier;
		return App.siFormat(usdValue * multiplier);
	};
	App.formatMoney = (usdValue, currencyIso) => {
		return `${App.formatMoneyShort(usdValue, currencyIso)} ${currencyIso}`;
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
