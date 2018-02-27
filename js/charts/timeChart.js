(() => {
	App.buildTimeChart = (selector, param = {}) => {
		// start building the chart
		const margin = { top: 30, right: 150, bottom: 35, left: 60 };
		const width = 480;
		const height = 90;
		const color = d3.color(param.color || 'steelblue');
		const lightColor = param.lightColor || color.brighter(2);

		const chart = d3.select(selector).append('svg')
			.classed('time-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scalePoint()
			.padding(0.2)
			.domain([0, 1])
			.range([0, width]);
		const y = d3.scaleLinear()
			.domain([0, 1])
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickFormat(App.siFormat)
			.scale(y);

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		const lineGroup = chart.append('g');

		chart.update = (newData, type) => {
			const maxVal = d3.max(newData, d => d[type]);
			x.domain(newData.map(d => d.year));
			y.domain([0, 1.2 * maxVal]);

			const line = d3.line()
				.x(d => x(d.year))
				.y(d => y(d[type]));

			lineGroup.selectAll('path').remove();
			lineGroup.datum(newData)
				.append('path')
				.style('fill', 'none')
				.style('stroke-width', 1.5)
				.style('stroke', 'black')
				.transition()
				.duration(1000)
				.attrTween('d', function(d) {
					const yfunc = d3.interpolate(0, d[type]);
					return function(t) {
						d[type] = yfunc(t);
						return line(d);
					};
				});


			let newGroup = lineGroup.selectAll('.line')
				.remove().exit().data(newData);

			const newLines = newGroup.enter()
				.append('g')
				.attr('class', 'line');

			newGroup = newLines.merge(lineGroup);

			newGroup.append('circle')
				.style('fill', 'none')
				.style('stroke', 'black')
				.transition()
				.duration(1000)
				.attr('cx', d => x(d.year))
				.attr('cy', d => y(d[type]))
				.attr('r', 5);

			newGroup.append('text')
				.transition()
				.duration(1000)
				.attr('x', d => x(d.year))
				.attr('y', d => y(d[type]))
				.attr('dy', '-1em')
				.attr('dx', '1em')
				.style('text-anchor', 'middle')
				.text(d => App.formatMoney(d[type]));

			xAxis.scale(x);
			xAxisG.transition().duration(1000).call(xAxis);

			yAxis.scale(y);
			yAxisG.transition().duration(1000).call(yAxis);

		};

		return chart;
	};
})();
