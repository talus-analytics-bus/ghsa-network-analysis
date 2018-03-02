(() => {
	App.buildTimeChart = (selector, param = {}) => {
		// start building the chart
		const margin = { top: 70, right: 50, bottom: 50, left: 60 };
		const width = 600;
		const height = 200;
		const color = d3.color(param.color || 'steelblue');
		const lightColor = param.lightColor || color.brighter(2);
		const palette = (param.moneyType === 'd') ? App.fundColorPalette : App.receiveColorPalette;

		const chart = d3.select(selector).append('svg')
			.classed('time-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scalePoint()
			.padding(0.2)
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.tickSize(0)
			.tickPadding(8)
			.tickSizeOuter(8)
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickSize(0)
			.tickSizeOuter(5)
			.tickPadding(8)
			.tickFormat(App.siFormat)
			.scale(y);

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.style('stroke-width', 1)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		const lineGroup = chart.append('g');
		const line = chart.append('path')
			.style('fill', 'none')
			.style('stroke-width', 1.5)
			.style('stroke', 'black');

		const labels = chart.append('g');

		let init = false;
		chart.update = (newData, type) => {
			const maxVal = d3.max(newData, d => d[type]);
			const yMax = 1.2 * maxVal;
			x.domain(newData.map(d => d.year));
			y.domain([0, yMax]);

			const lineFunc = d3.line()
				.x(d => x(d.year))
				.y(d => y(d[type]));

			line.transition()
				.duration(1000)
				.attr('d', lineFunc(newData));

			// Join to new Data
			let newGroup = lineGroup.selectAll('.node')
				.data(newData);

			// remove unneeded
			newGroup.exit().remove();

			// Create new groups
			const nodeGroup = newGroup.enter().append('g')
				.attr('class', 'node');

			// // Add new objects
			// nodeGroup.append('circle')
			// 	.style('fill', 'white')
			// 	.style('fill-opacity', 1)
			// 	.style('stroke', 'black')
			// 	.attr('r', 5)
			// 	.attr('cx', d => x(d.year))
			// 	.attr('cy', d => y(d[type]))
			// 	.on('mouseover', function(d) {
			// 		d3.select(this).style('fill', param.lightColor);
			// 	})
			// 	.on('mouseout', function(d) {
			// 		d3.select(this).style('fill', 'white');
			// 	});

			nodeGroup.append('text')
				.attr('dy', '-1em')
				.attr('x', d => x(d.year))
				.attr('y', d => y(d[type]))
				.style('text-anchor', 'middle')
				.text(d => App.formatMoney(d[type]));

			nodeGroup.append('line')
				.style('stroke-width', 1)
				.style('stroke', 'black')
				.style('stroke-dasharray', '3, 3')
				.attr('x1', d => x(d.year))
				.attr('x2', d => x(d.year))
				.attr('y1', height)
				.attr('y2', d => y(d[type]));

			// // Update circles
			// newGroup.selectAll('circle')
			// 	.transition()
			// 	.duration(1000)
			// 	.attr('cx', d => x(d.year))
			// 	.attr('cy', d => y(d[type]));

			newGroup.selectAll('text')
				.transition()
				.duration(1000)
				.attr('x', d => x(d.year))
				.attr('y', d => y(d[type]))
				.text(d => App.formatMoney(d[type]));

			newGroup.selectAll('line')
				.transition()
				.duration(1000)
				.attr('x1', d => x(d.year))
				.attr('x2', d => x(d.year))
				.attr('y1', height)
				.attr('y2', d => y(d[type]));

			xAxis.scale(x);
			xAxisG.transition().duration(1000).call(xAxis);

			yAxis.scale(y);
			yAxisG.transition()
				.duration(1000)
				.call(yAxis.tickValues(getTickValues(yMax, 4)));

			// labels
			labels.selectAll('text').remove();
			labels.append('text')
				.attr('x', width / 2)
				.attr('y', -40)
				.style('font-size', '1.25em')
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text(() => {
					if (type === 'total_spent') {
						return 'Disbursed Funds by Year';
					} else {
						return 'Committed Funds by Year';
					}
				});
			labels.append('text')
				.attr('x', width / 2)
				.attr('y', height + 40)
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text('Year');
			labels.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', -50)
				.attr('x', -height / 2)
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text('Funds');

		};

		return chart;
	};

	function getTickValues(maxVal, numTicks) {
		const magnitude = Math.floor(Math.log10(maxVal)) - 1;
		var vals = [0];
		for (var i = 1; i <= numTicks; i++) {
			if (i === numTicks) {
				vals.push(maxVal);
			} else {
				vals.push(precisionRound((i / numTicks) * maxVal, -magnitude));
			}
		}
		return vals;
	}

	function precisionRound(number, precision) {
		const factor = Math.pow(10, precision);
		return Math.round(number * factor) / factor;
	}

})();
