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

					$(this).tooltipster({
						trigger: 'hover',
						content: contentContainer.html(),
					});
				});
		if (param.onClick) circles.on('click', d => param.onClick(d.data.ISO2));
	};

	App.buildChordDiagram = (selector, data, param = {}) => {
		// transform data into data to be ingested by d3
		const nodeData = {
			name: 'background',
			children: data,
		};

		// start building the chart
		const margin = { top: 180, right: 180, bottom: 180, left: 180 };
		const radius = param.radius || 300;

		const chartContainer = d3.select(selector).append('svg')
			.classed('chord-chart', true)
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${radius + margin.left}, ${radius + margin.top})`);

		const line = d3.radialLine()
			.curve(d3.curveBundle.beta(0.85))
			.radius(d => d.y)
			.angle(d => d.x * 180 / Math.PI);

		const cluster = d3.cluster()
			.size([360, radius]);

		const root = d3.hierarchy(nodeData)
			.sum(d => d.total_spent);

		cluster(root);

		// create node labels
		chart.append('g').selectAll('.node')
			.data(root.children)
			.enter().append('text')
				.attr('class', 'node')
				.attr('dy', '0.31em')
				.attr('transform', (d) => {
					return `rotate(${d.x - 90})translate(${d.y + 8},0)${(d.x < 180) ? '' : 'rotate(180)'}`;
				})
				.attr('text-anchor', d => d.x < 180 ? 'start' : 'end')
				.text(d => d.data.name);

		// create links
		chart.append('g').selectAll('.link')
			.data(getPaths(root.children))
			.enter().append('path')
				//.each(d => d.source = d[0], d.target = d[d.length - 1])
				.attr('class', 'link')
				.attr('d', line);


		function getPaths(nodes) {
			const map = {};
			const funds = [];

			// Compute a map from name to node.
			nodes.forEach(d => map[d.data.name] = d);

			// For each import, construct a link from the source to target node.
			nodes.forEach((d) => {
				if (d.data.funds) {
					d.data.funds.forEach((f) => {
						if (map[f.recipient]) {
							funds.push(map[d.data.name].path(map[f.recipient]));
						}
					});
				}
			});

			return funds;
		}
	};
})();
