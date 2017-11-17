(() => {
	App.drawProgressCircles = (selector, data, color) => {
		const tau = 2 * Math.PI;
		let percSpent = data.total_spent / data.total_committed;
		if (!data.total_committed) percSpent = 0;

		// start building the chart
		const margin = { top: 0, right: 10, bottom: 0, left: 10 };
		const outerRadius = 55;
		const innerRadius = 35;

		const chartContainer = d3.select(selector).append('svg')
			.classed('progress-circle-chart', true)
			.attr('width', 2 * outerRadius + margin.left + margin.right)
			.attr('height', 2 * outerRadius + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${outerRadius + margin.left}, ${outerRadius + margin.top})`);

		// add glow definition
		const defs = chartContainer.append('defs');
		const filter = defs.append('filter')
			.attr('id', 'glow');
		filter.append('feGaussianBlur')
			.attr('stdDeviation', 3.5)
			.attr('result', 'coloredBlur');
		const feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode')
			.attr('in', 'coloredBlur');
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');

		const arc = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius)
			.startAngle(0);

		// build components
		chart.append('path')
			.datum({ endAngle: tau })
			.style('fill', '#ccc')
			.attr('d', arc);
		const foreground = chart.append('path')
			.datum({ endAngle: 0 })
			.style('fill', color)
			.attr('d', arc);

		// fill middle text
		chart.append('text')
			.attr('class', 'progress-circle-value')
			.attr('dy', '.35em')
			.text(data.total_committed ? d3.format('.0%')(percSpent) : 'N/A');

		// animate progress circle filling
		foreground.transition()
			.duration(1000)
			.attrTween('d', arcTween(percSpent * tau));

		function arcTween(newAngle) {
			return (d) => {
				const interpolate = d3.interpolate(d.endAngle, newAngle);
				return (t) => {
					d.endAngle = interpolate(t);
					return arc(d);
				};
			};
		}

		return chart;
	};
})();
