(() => {
	App.initAnalysis = () => {
		// collate the data
		const fundingData = App.countries.map((c) => {
			return {
				NAME: c.NAME,
				funded: Math.pow(10, 4 + 3 * Math.random()),
				received: Math.pow(10, 4 + 3 * Math.random()),
				gdp: Math.pow(10, 4 + 3 * Math.random()),
			};
		});

		// build the chart
		App.buildScatterplot('.scatterplot-container', fundingData);
	};
})();
