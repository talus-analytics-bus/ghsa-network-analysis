(() => {
	App.drawProgressCircles = (selector, moneyType) => {
		let palette;
		if (moneyType === 'd') {
			palette = App.fundColorPalette;
			// palette = [
			// 	App.fundColorPalette[0],
			// 	App.fundColorPalette.slice(-2)[0],
			// ];
		} else {
			palette = App.receiveColorPalette;
			// palette = [
			// 	App.receiveColorPalette[0],
			// 	App.receiveColorPalette.slice(-3)[0],
			// ];
		}

		const ccs = ['P', 'D', 'R', 'Other'];
		const lineColors = d3.scaleOrdinal()
			.domain(['Total'].concat(ccs))
			.range(['black'].concat(palette));

		function getColor(d) {
			let color;
			if (d.data.cc === 'Total') {
				color = 'black';
			} else {
				const cc = d.data.cc;
				if (['P', 'D', 'R'].includes(cc)) {
					color = lineColors(cc);
				} else {
					color = lineColors('Other');
				}
			}
			return color;
		}

		const ccMapping = {
			P: 'Prevent',
			D: 'Detect',
			R: 'Respond',
			Other: 'Other',
		};

		const sortOrder = {
			P: 1,
			Other: 2,
			D: 3,
			R: 4,
		};

		// start building the chart
		const margin = {
			top: 60,
			right: 90,
			bottom: 60,
			left: 90,
		};
		const outerRadius = 100;
		const innerRadius = 40;

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
			.padAngle(0.01);

		const arcGroup = chart.append('g')
			.attr('class', 'arc');

		const sum = chart.append('text')
			.style('font-size', '1.25em')
			.style('text-anchor', 'middle');

		chart.update = (rawData, plotType) => {
			var otherData = [];
			var runningOther = {
				cc: 'Other',
				total_committed: 0,
				total_spent: 0,
			};
			rawData.forEach(function(d) {
				if (['P', 'D', 'R'].includes(d.cc)) {
					otherData.push(Object.assign({}, d));
				} else {
					runningOther.total_committed += d.total_committed;
					runningOther.total_spent += d.total_spent;
				}
			});
			otherData.push(runningOther);
			const newData = otherData;
			const justVals = newData.filter(d => d[plotType] !== 0)
				.map(d => d[plotType])
				.sort((a, b) => {
					if (a < b) {
						return 1;
					} else {
						return -1;
					}
				});

			const pie = d3.pie()
				.value(d => d[plotType])
				.sort((a, b) => sortOrder[a.cc] > sortOrder[b.cc]);

			let newGroup = arcGroup.selectAll('.arc')
				.remove().exit().data(pie(newData));

			const newArcs = newGroup.enter()
				.append('g')
				.attr('class', 'arc');

			newGroup = newArcs.merge(arcGroup);

			newGroup.each(function(d) {
				if ($(this).hasClass('tooltipstered')) {
					$(this).tooltipster('destroy');
				}
				var content = `<b>${ccMapping[d.data.cc]}</b><br>`;
				content += App.formatMoney(d.value);
				$(this).tooltipster({
					side: 'right',
					content: content,
				});
			});

			newGroup.append('path')
				.style('fill', getColor)
				.transition()
				.duration(1000)
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
					const r = outerRadius + 15;
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
						return ccMapping[d.data.cc];
							// `<tspan x="0" dy="1.25em">${App.formatMoney(d.value)}</tspan>`;
					}
				});
			const opacityFunc = (d, a) => {
				if (d === 'Total') {
					return 1;
				} else if (d === a) {
					return 1;
				} else if ((d === 'Other') && (!['P', 'D', 'R'].includes(a))) {
					return 1;
				} else {
					return 0.1;
				}
			};

			newGroup.on('mouseover', function(d) {
				d3.selectAll('.arc path')
					.style('stroke-opacity', a => opacityFunc(d.data.cc, a.data.cc))
					.style('fill-opacity', a => opacityFunc(d.data.cc, a.data.cc));

				d3.selectAll('.arc text')
					.style('stroke-opacity', a => opacityFunc(d.data.cc, a.data.cc))
					.style('fill-opacity', a => opacityFunc(d.data.cc, a.data.cc));

				d3.selectAll('.line')
					.style('stroke-opacity', a => opacityFunc(d.data.cc, a[0].cc.split('.')[0]));
			})
				.on('mouseout', function(d) {
					d3.selectAll('.line')
						.style('stroke-opacity', 1);
					d3.selectAll('.arc path')
						.style('stroke-opacity', 1)
						.style('fill-opacity', 1);
					d3.selectAll('.arc text')
						.style('stroke-opacity', 1)
						.style('fill-opacity', 1);
				});
		};

		return chart;
	};
})();
