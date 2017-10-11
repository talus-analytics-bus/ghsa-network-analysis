(() => {
	App.buildCategoryChart = (selector, data, param = {}) => {
		// inject "running x" into data
		const regions = [];
		data.forEach((d) => {
			let runningValue = 0;
			d.children.forEach((c) => {
				if (!regions.includes(c.name)) regions.push(c.name);
				c.value0 = runningValue;
				runningValue += c.total_spent;
				c.value1 = runningValue;
			});
		});

		// get capacities in order
		const capacities = data.map(d => d.name);
		App.capacities.forEach((c) => {
			if (!capacities.includes(c.id)) capacities.push(c.id);
		});

		// start building the chart
		const margin = { top: 70, right: 80, bottom: 80, left: 40 };
		const width = 400;
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
			.domain(capacities)
			.range([0, height]);
		const colorScale = d3.scaleOrdinal()
			.domain(regions)
			.range(['#6a3d9a', '#cab2d6', '#33a02c', '#b2df8a', '#fb9a99']);

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
			.data(d => d.children.map(c => ({ cc: d.name, region: c })))
			.enter().append('rect')
				.attr('x', d => x(d.region.value0))
				.attr('width', d => x(d.region.value1) - x(d.region.value0))
				.attr('height', y.bandwidth())
				.style('fill', d => colorScale(d.region.name))
				.each(function addTooltip(d) {
					const capName = App.capacities.find(cc => d.cc === cc.id).name;
					$(this).tooltipster({
						content: `<b>Core Capacity:</b> ${capName}` +
							`<br><b>Region:</b> ${d.region.name}` +
							`<br><b>Total Committed Funds:</b> ${App.formatMoney(d.region.total_committed)}` +
							`<br><b>Total Disbursed Funds:</b> ${App.formatMoney(d.region.total_spent)}`,
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
		d3.selectAll('.y.axis .tick text').each(function attachTooltip(d) {
			const capName = App.capacities.find(c => c.id === d).name;
			$(this).tooltipster({ content: `<b>${capName}</b>` });
		});

		// add axes labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', -35)
			.text(param.xAxisLabel || 'Total Disbursed');

		// add legend
		const barWidth = 65;
		const barHeight = 12;
		const boxWidth = 90;
		const legend = chart.append('g')
			.attr('transform', `translate(0, ${height + 20})`);
		const legendGroups = legend.selectAll('g')
			.data(regions)
			.enter().append('g')
				.attr('transform', (d, i) => `translate(${boxWidth * i}, 0)`);
		legendGroups.append('rect')
			.attr('x', (boxWidth - barWidth) / 2)
			.attr('width', barWidth)
			.attr('height', barHeight)
			.style('fill', d => colorScale(d));
		legendGroups.append('text')
			.attr('class', 'legend-label')
			.attr('x', boxWidth / 2)
			.attr('y', barHeight + 10)
			.attr('dy', '.35em')
			.text(d => d);
	};
})();
