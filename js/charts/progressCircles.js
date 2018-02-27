(() => {
	App.drawProgressCircles = (selector, data, color) => {
		const tau = 2 * Math.PI;
		let percSpent = data.total_spent / data.total_committed;
		if (!data.total_committed) percSpent = 0;

		const ccMapping = {
			P: 'Prevent',
			D: 'Detect',
			R: 'Respond',
			PoE: 'Point of Entry',
			CE: 'Chemical Events',
			RE: 'Radiation Emergencies',
		};

		const rootData = {
			name: 'Funds Disbursed',
			abbrev: '',
			children: data.map(d => {
				return {
					name: ccMapping[d.cc],
					abbrev: d.cc,
					children: [
						{
							name: "Total Committed",
							value: d.total_committed,
							children: [
								{
									name: "Total Spent",
									value: d.total_spent,
								},
							],
						},
					],
				};
			}),
		};

		const rootColors = d3.scaleOrdinal()
			.domain(Object.keys(ccMapping))
			.range([
				'#a6cee3',
				'#1f78b4',
				'#b2df8a',
				'#33a02c',
				'#fb9a99',
				'#e31a1c',
			]);

		// start building the chart
		const margin = { top: 50, right: 50, bottom: 50, left: 50, };
		const outerRadius = 200;
		const innerRadius = 75;
		const arcHeight = 50;

		const root = d3.hierarchy(rootData)
			.sum(d => d.value);

		// trees range in size from 0->1
		const tree = d3.partition()
			.size([2 * Math.PI, outerRadius]);

		/* SCALES FOR CONVERSION */
		const arc = d3.arc()
			.innerRadius(d => d.y0)
			.outerRadius(d => d.y1)
			.startAngle(d => d.x0)
			.endAngle(d => d.x1);

		const textArc = d3.arc()
			.outerRadius(d => (d.y0 + d.y1) / 2)
			.startAngle(d => d.x0 + 0.05)
			.endAngle(d => d.x1);

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

		// Start plotting
		console.log(tree(root).descendants());
		const treeGroup = chart.append('g')
			.selectAll('g')
			.data(tree(root).descendants())
			.enter()
			.append('g');

		treeGroup.append('path')
			.attr('d', arc)
			.style('stroke', 'black')
			.style('fill', d => {
				if (d.depth === 1) {
					return rootColors(d.data.abbrev);
				} else {
					return 'white';
				}
			})
			.style('fill-opacity', '1')
			.each(function(d) {
				var content = `<b>${d.data.name}</b>`;
				if (d.data.value !== undefined) {
					content += `<br><i>${App.formatMoney(d.data.value)}</i>`;
				}
				return $(this).tooltipster({
					content: content,
				});
			});

		textPaths = chart.append('defs')
			.selectAll('path')
			.data(tree(root).descendants())
			.enter()
			.append('path')
			.attr('id', (d, i) => `textPath-${i}`)
			.attr('d', textArc);

		treeGroup.append('text')
			.append('textPath')
			.attr('xlink:href', (d, i) => `#textPath-${i}`)
			// .style('text-anchor', 'middle')
			.style('fill', 'black')
			.text(d => {
				if (d.depth > 0) {
					if (d.x1 - d.x0 > Math.PI / 4) {
						if (d.data.value === undefined) {
							return d.data.name;
						} else {
							return `${d.data.name} - ${App.formatMoney(d.data.value)}`;
						}
					}
				}
			});


		return chart;
	};
})();
