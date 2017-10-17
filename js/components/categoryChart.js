(() => {
	App.buildCategoryChart = (selector, data, param = {}) => {
		const oppNoun = (param.moneyType === 'r') ? 'Donor' : 'Recipient';
		const colors = (param.moneyType === 'r') ? App.receiveColorPalette : App.fundColorPalette;

		// inject "running x" into data
		data.forEach((d) => {
			let runningValue = 0;
			d.children.forEach((c) => {
				c.value0 = runningValue;
				runningValue += c.total_spent;
				c.value1 = runningValue;
			});
		});

		// start building the chart
		const margin = { top: 70, right: 80, bottom: 80, left: 40 };
		const width = 440;
		const height = 450;

		const chart = d3.select(selector).append('svg')
			.classed('category-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const maxValue = d3.max(data, d => d.total_spent);
		const x = d3.scaleLinear()
			.domain([0, 1.1 * maxValue])
			.range([0, width]);
		const y = d3.scaleBand()
			.padding(0.25)
			.domain(data.map(d => d.id))
			.range([0, height]);
		const colorScale = d3.scaleOrdinal()
			.range(colors);

		const xAxis = d3.axisTop()
			.ticks(5)
			.tickFormat(App.siFormat)
			.scale(x);
		const yAxis = d3.axisLeft()
			.scale(y);

		const barGroups = chart.selectAll('.bar-group')
			.data(data)
			.enter().append('g')
				.attr('class', 'bar-group')
				.attr('transform', d => `translate(0, ${y(d.id)})`);
		barGroups.selectAll('rect')
			.data(d => d.children.map(c => ({ cc: d.id, country: c })))
			.enter().append('rect')
				.attr('x', d => x(d.country.value0))
				.attr('width', d => x(d.country.value1) - x(d.country.value0))
				.attr('height', y.bandwidth())
				.style('fill', d => colorScale(d.country.iso))
				.each(function addTooltip(d) {
					$(this).tooltipster({
						content: `<b>Core Capacity:</b> ${d.cc}` +
							`<br><b>${oppNoun}:</b> ${App.getCountryName(d.country.iso)}` +
							`<br><b>Total Committed Funds:</b> ${App.formatMoney(d.country.total_committed)}` +
							`<br><b>Total Disbursed Funds:</b> ${App.formatMoney(d.country.total_spent)}`,
					});
				});
		barGroups.append('text')
			.attr('class', 'bar-label')
			.attr('x', d => x(d.total_spent) + 5)
			.attr('y', y.bandwidth() / 2)
			.attr('dy', '.35em')
			.text(d => App.formatMoney(d.total_spent));

		// add axes
		chart.append('g')
			.attr('class', 'x axis')
			.call(xAxis);
		chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		// attach tooltips to y-axis labels
		chart.selectAll('.y.axis .tick text').each(function attachTooltip(d) {
			const capName = App.capacities.find(c => c.id === d).name;
			$(this).tooltipster({ content: `<b>${capName}</b>` });
		});

		// add axes labels
		let xAxisLabel = 'Total Funds Disbursed by Core Capacity';
		if (param.moneyType === 'r') xAxisLabel = 'Total Funds Received by Core Capacity';
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', -35)
			.text(xAxisLabel);
	};
})();
