(() => {
	App.buildCirclePack = (selector, data, param = {}) => {
		// define any constants
		const blues = ['#c6dbef', '#084594'];
		const colors = param.colors || blues;

		// start building the chart
		const margin = { top: 30, right: 30, bottom: 80, left: 30 };
		const size = param.size || 300;

		const chartContainer = d3.select(selector).append('svg')
			.classed('circle-pack-chart', true)
			.attr('width', size + margin.left + margin.right)
			.attr('height', size + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// add glow definition
		const defs = chartContainer.append('defs');
		const filter = defs.append('filter')
			.attr('id', 'glow');
		filter.append('feGaussianBlur')
			.attr('stdDeviation', 3.5)
			.attr('result', 'coloredBlur');
		var feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode')
			.attr('in', 'coloredBlur');
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');

		// add horizontal gradient definition for legend
		const gradient = defs.append('linearGradient')
			.attr('id', `${selector}-gradient`)
			.attr('x1', '0%')
			.attr('x2', '100%')
			.attr('y1', '0%')
			.attr('y2', '0%');
		gradient.append('stop')
			.attr('stop-color', colors[0])
			.attr('offset', '0%');
		gradient.append('stop')
			.attr('stop-color', colors[1])
			.attr('offset', '100%');

		// re-form data to fit for circle pack
		const nodeData = {
			name: 'background',
			children: data.slice(0),
		};

		// start drawing the node pack
		const pack = d3.pack()
			.size([size, size])
			.padding(2);
		const root = d3.hierarchy(nodeData)
			.sum(d => d.total_spent)
			.sort((a, b) => b.total_spent - a.total_spent);
		let focus = root;
		const nodePackData = pack(root).descendants();

		// define color scale
		const colorScale = d3.scaleLinear().range(colors);

		// add in the nodes
		const nodes = chart.selectAll('g')
			.data(nodePackData)
			.enter().append('g')
				.attr('transform', d => `translate(${d.x}, ${d.y})`)
				.each(function assignNode(d) { d.node = this; });

		const nodesG = nodes.append('g')
			.attr('class', (d) => {
				return d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root';
			});

		const circles = nodesG.append('circle')
			.attr('r', d => d.r)
			.filter(d => d.parent)
				.style('fill', (d) => {
					let percDisbursed = d.data.total_spent / d.data.total_committed;
					if (percDisbursed > 1) percDisbursed = 1;
					return colorScale(percDisbursed);
				})
				.style('filter', 'url(#glow)')
				.each(function(d) {
					const contentContainer = d3.select(document.createElement('div'));
					const content = contentContainer.append('div')
						.attr('class', 'tooltip-content');
					content.append('div')
						.attr('class', 'tooltip-title')
						.text(d.data.NAME);
					const rowContent = content.append('div')
						.attr('class', 'tooltip-row-content');
					rowContent.append('div')
						.attr('class', 'tooltip-row')
						.html(`<b>Total Disbursed:</b> ${App.formatMoney(d.data.total_spent)}`);
					rowContent.append('div')
						.attr('class', 'tooltip-row')
						.html(`<b>Total Committed:</b> ${App.formatMoney(d.data.total_committed)}`);
					const percDisbursed = d.data.total_spent / d.data.total_committed;
					rowContent.append('div')
						.attr('class', 'tooltip-row')
						.html(`<b>Percent Disbursed:</b> ${d3.format('.1%')(percDisbursed)}`);

					$(this).tooltipster({
						trigger: 'hover',
						content: contentContainer.html(),
					});
				});
		if (param.onClick) circles.on('click', d => param.onClick(d.data.ISO2));

		// add legend
		const legendWidth = 320;
		const legend = chart.append('g')
			.attr('transform', `translate(${(size - legendWidth) / 2}, ${size + 25})`);
		legend.append('rect')
			.attr('width', legendWidth)
			.attr('height', 20)
			.attr('fill',  `url(#${selector}-gradient)`);
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('y', 20 + 12)
			.attr('dy', '.35em')
			.text('0% Disbursed');
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('x', legendWidth)
			.attr('y', 20 + 12)
			.attr('dy', '.35em')
			.style('text-anchor', 'end')
			.text('100% Disbursed');
	};
})();
