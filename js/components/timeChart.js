(() => {
	App.buildTimeChart = (selector, data, param = {}) => {
		// start building the chart
		const margin = { top: 30, right: 20, bottom: 35, left: 60 };
		const width = 600;
		const height = 90;

		const chart = d3.select(selector).append('svg')
			.classed('time-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scaleBand()
			.padding(0.2)
			.domain(data.map(d => d.year))
			.range([0, width]);
		const y = d3.scaleLinear()
			.domain([0, 1.1 * d3.max(data, d => d.total_spent)])
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickFormat(App.siFormat)
			.scale(y);

		chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		// add bars
		const barGroups = chart.selectAll('.bar-group')
			.data(data)
			.enter().append('g')
				.attr('transform', d => `translate(${x(d.year)}, 0)`);
		barGroups.append('rect')
			.attr('class', 'bar')
			.attr('y', d => y(d.total_spent))
			.attr('width', x.bandwidth())
			.attr('height', d => height - y(d.total_spent))
			.style('fill', param.color || 'steelblue');
		barGroups.append('text')
			.attr('class', 'bar-text')
			.attr('x', x.bandwidth() / 2)
			.attr('y', d => y(d.total_spent) - 8)
			.attr('dy', '.35em')
			.text(d => App.formatMoney(d.total_spent));

		chart.append('text')
			.attr('class', 'chart-label')
			.attr('x', width / 2)
			.attr('y', height + 35)
			.text('Year');
		chart.append('text')
			.attr('class', 'chart-label')
			.attr('x', 5)
			.attr('y', -12)
			.text('Total Disbursed');

		return chart;
	};
})();
