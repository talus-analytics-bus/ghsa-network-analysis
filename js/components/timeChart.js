(() => {
	App.buildTimeChart = (selector, data, param = {}) => {
		// start building the chart
		const margin = { top: 30, right: 120, bottom: 35, left: 60 };
		const width = 530;
		const height = 90;
		const color = d3.color(param.color || 'steelblue');
		const lightColor = param.lightColor || color.brighter(2);

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
		const maxValue = d3.max(data, (d) => {
			return d3.max([d.total_spent, d.total_committed]);
		});
		const y = d3.scaleLinear()
			.domain([0, 1.2 * maxValue])
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickFormat(App.siFormat)
			.scale(y);
		const bandwidth = x.bandwidth();

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

		// committed bar
		barGroups.append('rect')
			.attr('class', 'bar')
			.attr('y', d => y(d.total_spent))
			.attr('width', bandwidth / 2)
			.attr('height', d => height - y(d.total_spent))
			.style('fill', lightColor);
		barGroups.append('text')
			.attr('class', 'bar-text')
			.attr('x', bandwidth / 4)
			.attr('y', d => y(d.total_spent) - 8)
			.attr('dy', '.35em')
			.text(d => App.formatMoneyShort(d.total_spent));

		// disbursed bar
		barGroups.append('rect')
			.attr('class', 'bar')
			.attr('x', bandwidth / 2)
			.attr('y', d => y(d.total_committed))
			.attr('width', bandwidth / 2)
			.attr('height', d => height - y(d.total_committed))
			.style('fill', color);
		barGroups.append('text')
			.attr('class', 'bar-text')
			.attr('x', 3 * bandwidth / 4)
			.attr('y', d => y(d.total_committed) - 8)
			.attr('dy', '.35em')
			.text(d => App.formatMoneyShort(d.total_committed));

		// axis labels
		chart.append('text')
			.attr('class', 'chart-label')
			.attr('x', width / 2)
			.attr('y', height + 35)
			.text('Year');
		chart.append('text')
			.attr('class', 'chart-label')
			.attr('x', -48)
			.attr('y', -12)
			.style('text-anchor', 'start')
			.text('Amount (in USD)');

		// add legend
		const rectWidth = 12;
		const legend = chart.append('g')
			.attr('transform', `translate(${width + 25}, 5)`);
		const legendGroups = legend.selectAll('g')
			.data([lightColor, color])
			.enter().append('g')
				.attr('transform', (d, i) => `translate(0, ${44 * i})`);
		legendGroups.append('rect')
			.attr('width', rectWidth)
			.attr('height', 30)
			.style('fill', d => d);
		legendGroups.append('text')
			.attr('class', 'legend-label')
			.attr('x', rectWidth + 8)
			.attr('y', 11)
			.text((d, i) => {
				return (i === 0) ? 'Committed' : 'Disbursed';
			});
		legendGroups.append('text')
			.attr('class', 'legend-label')
			.attr('x', rectWidth + 8)
			.attr('y', 27)
			.text((d, i) => {
				return (param.moneyType === 'd') ? 'Funds' : 'Funds to Receive';
			});

		return chart;
	};
})();
