(() => {
	App.drawProgressCircles = (selector, moneyType) => {
		let palette;
		if (moneyType === 'd') {
			palette = App.fundColorPalette;
		} else {
			palette = App.receiveColorPalette;
		}

		const ccMapping = {
			P: 'Prevent',
			D: 'Detect',
			R: 'Respond',
		};

		// start building the chart
		const margin = { top: 0, right: 10, bottom: 0, left: 10 };
		const outerRadius = 200;
		const innerRadius = 50;

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
			.padAngle(0.025);

		const arcGroup = chart.append('g')
			.attr('class', 'arc');

		chart.update = (newData, plotType) => {
			const justVals = newData.filter(d => d[plotType] !== 0)
				.map(d => d[plotType])
				.sort((a, b) => a < b);
			const colorScale = d3.scaleLinear()
				.domain([
					justVals[0],
					justVals[justVals.length - 1],
				])
				.range(palette);

			const pie = d3.pie()
				.value(d => d[plotType]);

			let newGroup = arcGroup.selectAll('.arc')
				.remove().exit().data(pie(newData));

			const newArcs = newGroup.enter()
				.append('g')
				.attr('class', 'arc');

			newGroup = newArcs.merge(arcGroup);

			newGroup.append('path')
				.style('fill', d => colorScale(d.value))
				.each(function(d) {
					var content = `<b>${ccMapping[d.data.cc]}</b><br>`;
					content += App.formatMoney(d.value);
					$(this).tooltipster({
						content: content,
					});
				})
				.transition()
				.duration(600)
				.attrTween('d', function(d) {
					const startAngle = d3.interpolate(0, d.startAngle);
					const endAngle = d3.interpolate(0, d.endAngle);
					return function(t) {
						d.startAngle = startAngle(t);
						d.endAngle = endAngle(t);
						return arc(d);
					};
				});

			newGroup.append('text')
				.attr('transform', d => `translate(${arc.centroid(d)})`)
				.style('text-anchor', 'middle')
				.style('fill', 'white')
				.text(d => {
					if (d.endAngle - d.startAngle > Math.PI / 4) {
						return `${ccMapping[d.data.cc]}` +
							` (${App.formatMoney(d.value)})`;
					}
				});

		};

		return chart;
	};
})();
