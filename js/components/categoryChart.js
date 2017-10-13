(() => {
	App.buildCategoryChart = (selector, data, param = {}) => {
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
		const margin = { top: 70, right: 80, bottom: 80, left: 190 };
		const width = 320;
		const height = 500;

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
			.domain(data.map(d => d.name))
			.range([0, height]);
		const colorScale = d3.scaleOrdinal()
			.range(d3.schemeCategory20c);

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
				.attr('transform', d => `translate(0, ${y(d.name)})`);
		barGroups.selectAll('rect')
			.data(d => d.children.map(c => ({ cc: d.name, country: c })))
			.enter().append('rect')
				.attr('x', d => x(d.country.value0))
				.attr('width', d => x(d.country.value1) - x(d.country.value0))
				.attr('height', y.bandwidth())
				.style('fill', d => colorScale(d.country.iso))
				.each(function addTooltip(d) {
					const country = App.countries.find(c => c.ISO2 === d.country.iso);
					const countryName = country ? country.NAME : d.country.iso;
					$(this).tooltipster({
						content: `<b>Core Capacity:</b> ${d.cc}` +
							`<br><b>Country:</b> ${countryName}` +
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
			.call(yAxis)
			.selectAll('.tick text')
				.call(wrap, 180)
				.each(function adjustLabel() {
					const tspans = $(this).children()
						.attr('x', -10);
					if (tspans.length === 2) {
						tspans.attr('y', '-5');
					}
				})

		// add axes labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', -35)
			.text(param.xAxisLabel || 'Total Disbursed');
	};
})();
