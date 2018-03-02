(() => {
	App.drawProgressCircles = (selector, moneyType) => {
		let palette;
		if (moneyType === 'd') {
			palette = [
				App.fundColorPalette[0],
				App.fundColorPalette.slice(-1)[0],
			];
		} else {
			palette = [
				App.receiveColorPalette[0],
				App.receiveColorPalette.slice(-1)[0],
			];
		}

		const ccMapping = {
			P: 'Prevent',
			D: 'Detect',
			R: 'Respond',
		};

		// start building the chart
		const margin = {
			top: 60,
			right: 120,
			bottom: 60,
			left: 120,
		};
		const outerRadius = 180;
		const innerRadius = 100;

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

		const sum = chart.append('text')
			.style('font-size', '1.25em')
			.style('text-anchor', 'middle');

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
				.attr('transform', d => {
					const midpoint = d.startAngle + ((d.endAngle - d.startAngle) / 2);
					const r = outerRadius + 30;
					const x = r * Math.cos(midpoint - Math.PI / 2);
					const y = r * Math.sin(midpoint - Math.PI / 2);
					return `translate(${x}, ${y})`;
				})
				.style('text-anchor', d => {
					const midpoint = d.startAngle + ((d.endAngle - d.startAngle) / 2);
					if (midpoint > Math.PI) {
						return 'end';
					} else {
						return 'start';
					}
				})
				.style('fill', 'black')
				.style('font-size', '1.25em')
				.html(d => {
					if (d.value !== 0) {
						return `<tspan>${ccMapping[d.data.cc]}</tspan>` +
							`<tspan x="0" dy="1.25em">${App.formatMoney(d.value)}</tspan>`;
					}
				});

			// const total = newData.reduce((acc, cval) => acc + cval[plotType], 0);
			// sum.text(App.formatMoney(total));
		};

		return chart;
	};
})();
