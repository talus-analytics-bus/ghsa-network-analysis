(() => {
	// inject "running x" into data
	const getRunningValues = (data, selected) => {
		data.map(d => {
			let runningValue = 0;
			d.children = d3.shuffle(
				d.children
					.map(c => {
						c.value0 = runningValue;
						runningValue += c[selected];
						c.value1 = runningValue;
						return c;
					})
			);
			return d;
		})
		.sort((a, b) => a[selected] > b[selected]);
		return data;
	};

	App.buildCategoryChart = (selector, param = {}) => {
		// Remove existing
		d3.select(selector).html('');

		const oppNoun = (param.moneyType === 'r') ? 'Funder' : 'Recipient';
		let colors = (param.moneyType === 'r') ? App.receiveColorPalette : App.fundColorPalette;
		colors = colors.slice(0, 5);

		const selected = param.selected || 'total_spent';

		// start building the chart
		const margin = { top: 50, right: 20, bottom: 20, left: 250 };
		const width = 800;
		const height = 500;

		const chart = d3.select(selector).append('svg')
			.classed('category-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// const data = getRunningValues(rawData, selected);
		//
		// const maxValue = d3.max(data, d => d[selected]);
		const x = d3.scaleLinear()
			.range([0, width]);
		const y = d3.scaleBand()
			.padding(0.25);
		/*const colorScale = d3.scaleLinear()
			.domain([0, 1])
			.range([
				colors[2],
				colors[0],
			]);*/
        const colorScale = d3.scaleOrdinal()
        .range(colors);

		const xAxis = d3.axisTop()
			.ticks(5)
			.tickSizeInner(0)
			.tickSizeOuter(5)
			.tickPadding(8)
			.tickFormat(App.siFormat)
			.scale(x);
		const yAxis = d3.axisLeft()
			.scale(y)
			.tickSize(0)
			.tickSizeOuter(5)
			.tickFormat(getShortName)
			.tickPadding(7);

		const allBars = chart.append('g');

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.style('stroke-width', 1)
			.call(xAxis);

		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis)
			.style('font-size', '0.4em');

		/*const legendG = chart.append('g')
			.attr('class', 'legend-group')
			.attr('transform', `translate(${width / 3}, ${height + 30})`);
		const defs = chart.append('defs');

		const gradient = defs.append('linearGradient')
			.attr('id', 'legend-gradient')
			.attr('y1', '0%')
			.attr('y2', '0%')
			.attr('x1', '0%')
			.attr('x2', '100%');

		gradient.append('stop')
			.attr('class', 'gradient-start')
			.attr('offset', '0%')
			.attr('stop-color', colors[2])
			.attr('stop-opacity', 1);

		gradient.append('stop')
			.attr('class', 'gradient-stop')
			.attr('offset', '100%')
			.attr('stop-color', colors[0])
			.attr('stop-opacity', 1);

		legendG.append('rect')
			.attr('height', 20)
			.attr('width', 300)
			.style('fill', 'url(#legend-gradient');*/

		// add axes labels
		//let xAxisLabel = 'Total Funds Disbursed by Core Capacity';
        let xAxisLabel = ''; // per Ellie, no xAxisLabel
		//if (param.moneyType === 'r') xAxisLabel = 'Total Funds Received by Core Capacity';
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', -70)
			.style('font-size', '1.25em')
			.text(xAxisLabel);

		const xLabel = chart.append('text')
			.attr('x', width / 2)
			.attr('y', -30)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.text('Funds');

		const yLabel = chart.append('text')
			.attr('class', 'y-label-text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -230)
			.attr('x', -height / 2)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.text('Core Capacity');

		chart.update = (rawData, newSelector = selected) => {
			const data = getRunningValues(rawData, newSelector)
				.sort((a, b) => {
					if (a[newSelector] < b[newSelector]) {
						return 1;
					} else {
						return -1;
					}
				})
				.filter(d => d[newSelector] !== 0);

			const newHeight = 30 * data.length;
			d3.select('.category-chart')
				.attr('height', newHeight + margin.top + margin.bottom);
			// set new axes and transition
			const maxVal = d3.max(data, d => d[newSelector]);
			const maxChild = d3.max(data, d => d3.max(d.children, c => c[newSelector]));
			const xMax = 1.1 * maxVal;
			x.domain([0, xMax]);
			y.domain(data.map(d => d.name))
				.range([0, newHeight]);
			colorScale.domain([0, maxChild]);
			const bandwidth = y.bandwidth();

			// legend labels
			/*legendG.attr('transform', `translate(${width / 3}, ${newHeight + 30})`);
			legendG.selectAll('text').remove();
			legendG.append('text')
				.attr('x', 290)
				.attr('y', 35)
				.style('text-anchor', 'end')
				.text(App.formatMoney(maxChild));
			legendG.append('text')
				.attr('y', 35)
				.attr('x', 10)
				.style('text-anchor', 'start')
				.text(App.formatMoney(0));
			const legendTitle = legendG.append('text')
				.attr('x', 150)
				.attr('y', -5)
				.style('text-anchor', 'middle')
				.style('font-weight', 600)
				.text('Funds');
*/
			// remove first
			let barGroups = allBars.selectAll('.bar-group')
				.remove().exit().data(data);

			const newGroups = barGroups.enter()
				.append('g')
				.attr('class', 'bar-group')
				.attr('transform', d => `translate(0, ${y(d.name)})`);

			barGroups = newGroups.merge(barGroups);

			barGroups.selectAll('rect')
				.data(d => d.children.map(c => ({ cc: d.name, country: c })))
				.enter()
				.append('rect')
				.attr('height', bandwidth)
				.style('fill', d => colorScale(d.country[newSelector]))
				.transition()
				.duration(1000)
				.attr('x', d => x(d.country.value0))
				.attr('width', d => x(d.country.value1) - x(d.country.value0))
				.each(function addTooltip(d) {
					if ($(this).hasClass('tooltipstered')) {
						$(this).tooltipster('destroy');
					}
					$(this).tooltipster({
						content: `<b>Core Capacity:</b> ${d.cc}` +
						`<br><b>${oppNoun}:</b> ${App.getCountryName(d.country.iso)}` +
						`<br><b>Total Committed Funds:</b> ${App.formatMoney(d.country.total_committed)}` +
						`<br><b>Total Disbursed Funds:</b> ${App.formatMoney(d.country.total_spent)}`,
					});
				});

			// set axes labels
			let xLabelPreText = 'Disbursed';
			if (param.moneyType === 'r') {
				if (newSelector === 'total_spent') {
					// legendTitle.text(`Funds Disbursed (${App.formatMoney(0).split(' ')[1]})`);
                    xLabelPreText = 'Disbursed';
				} else {
					// legendTitle.text(`Funds Committed (${App.formatMoney(0).split(' ')[1]})`);
                    xLabelPreText = 'Committed';
				}
			} else {
				if (newSelector === 'total_spent') {
					//legendTitle.text(`Funds Disbursed (${App.formatMoney(0).split(' ')[1]})`);
                    xLabelPreText = 'Disbursed';
				} else {
					//legendTitle.text(`Funds Committed (${App.formatMoney(0).split(' ')[1]})`);
                    xLabelPreText = 'Committed';
				}
			}
			xLabel.text(`Funds ${xLabelPreText} (${App.formatMoney(0).split(' ')[1]})`);
			//chart.select('.axis-label').text('Funds by Core Capacity');

			chart.select('.y-label-text')
				.attr('x', -newHeight / 2);

			xAxis.scale(x);
			xAxisG.transition()
				.duration(1000)
				.call(xAxis.tickValues(getTickValues(xMax, 7)));

			yAxis.scale(y);
			yAxisG.transition()
				.duration(1000)
				.call(yAxis);
			//
			// yAxisG.selectAll('text').transition().duration(1000).text(function(d) {
			// 	// const readableName = / - (.*)$/.exec(d)[1];
			// 	const readableName = d;
			// 	const shortName = getShortName(readableName);
			// 	return shortName;
			// });


			barGroups.append('text')
				.attr('class', 'bar-label')
				.attr('y', y.bandwidth() / 2)
				.attr('dy', '.35em')
				.text(d => {
					if (d[newSelector] !== 0) {
						return App.formatMoney(d[newSelector]);
					}
				})
				.transition()
				.duration(1000)
				.attr('x', d => x(d[newSelector]) + 5);

			// attach tooltips to y-axis labels
			chart.selectAll('.y.axis .tick text').each(function attachTooltip(d) {
					if ($(this).hasClass('tooltipstered')) {
						$(this).tooltipster('destroy');
					}
					const capName = App.capacities.find(c => c.name === d).name;
					$(this).tooltipster({ content: `<b>${capName}</b>` });
				});
				// .text(function(d) {
				// 	// const readableName = / - (.*)$/.exec(d)[1];
				// 	const readableName = d;
				// 	const shortName = getShortName(readableName);
				// 	return shortName;
				// });

			// if no data, hide chart and show message
			if (d3.selectAll('.bar-group').nodes().length === 0) {
				$('.no-data-message').text('No funds were assigned a core capacity');
				$('.no-data-message.core-element').text('No funds were assigned a core element');
				$('.category-chart-container')
					.css('display', 'none')
					.css('height','0px');
				$('div.circle-chart-content')
					.css('visibility','hidden');
			} else {
				$('.no-data-message').text('');
				$('.category-chart-container')
					.css('display', 'block')
					.css('height','');
				$('div.circle-chart-content')
					.css('visibility','visible');
			}

		};

		return chart;
	};

	function getShortName(s) {
		const maxLen = 20;
		if (s.length > maxLen) {
			const shortened = s.split(' ').slice(0, 4).join(' ');
			if (/[^a-z]$/.test(shortened.toLowerCase())) {
				return `${shortened.slice(0, shortened.length - 1)}...`;
			}
			return `${shortened}...`;
		} else {
			return s;
		}
	}

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
