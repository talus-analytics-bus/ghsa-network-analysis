(() => {
	App.initSettings = () => {
		// get unique values from data
		const currencies = Object.values(App.currencies)
			.sort((a, b) => d3.ascending(a.name, b.name));

		Util.populateSelect('.currency-select', currencies, {
			nameKey: d => `${Util.capitalize(d.name)} (${d.iso.code})`,
			valKey: d => d.iso.code,
		});
	}
})();
