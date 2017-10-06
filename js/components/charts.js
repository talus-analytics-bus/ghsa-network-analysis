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
		// define colors
		const fundColor = '#084594';
		const receiveColor = '#8c2d04';

		// define geo collection variables and maps
		const subregions = [];
		const countries = [];
		let funds = [];
		const countryMapByName = d3.map();

		// attach start and end angles to each of the countries/subregions/regions
		const totalFlow = d3.sum(data, d => d.totalFlow);
		const regionPadding = 0.02;
		const subregionPadding = 0.01;
		let runningTheta = 0;
		data.forEach((region) => {
			const rTheta = (2 * Math.PI * region.totalFlow / totalFlow) - (2 * regionPadding);
			runningTheta += regionPadding;  // add beginning padding
			region.theta0 = runningTheta;
			const totalSPadding = (region.children.length - 1) * subregionPadding;

			region.children.forEach((subregion, i) => {
				subregions.push(subregion);

				let sTheta = (rTheta - totalSPadding) * (subregion.totalFlow / region.totalFlow);
				if (i > 0) runningTheta += subregionPadding;
				subregion.theta0 = runningTheta;
				subregion.children.forEach((country) => {
					// set map and add country to collection
					countryMapByName.set(country.name, country);
					countries.push(country);
					funds = funds.concat(country.funds);

					// set angles
					let cTheta = sTheta * (country.totalFlow / subregion.totalFlow);
					country.theta0 = runningTheta;
					runningTheta += cTheta;
					country.theta1 = runningTheta;
					country.runningTheta = country.theta0;  // used for assigning angles to funds
				});
				subregion.theta1 = runningTheta;
			});
			region.theta1 = runningTheta;
			runningTheta += regionPadding;  // add end padding
		});

		// attach start/end angles to each fund
		data.forEach((region) => {
			region.children.forEach((subregion) => {
				subregion.children.forEach((fc) => {
					fc.funds.forEach((f) => {
						const rc = countryMapByName.get(f.recipient);
						let fundTheta = (fc.theta1 - fc.theta0) * (f.value / fc.totalFlow);
						if (fundTheta < 0) fundTheta = 0;  // TODO need to fix this!
						f.source = {
							startAngle: fc.runningTheta,
							endAngle: fc.runningTheta + fundTheta,
						};
						fc.runningTheta += fundTheta;

						let recTheta = (rc.theta1 - rc.theta0) * (f.value / rc.totalFlow);
						if (recTheta < 0) recTheta = 0;  // TODO need to fix this!
						f.target = {
							startAngle: rc.runningTheta,
							endAngle: rc.runningTheta + recTheta,
						};
						rc.runningTheta += recTheta;
					});
				});
			});
		});

		// start building the chart
		const margin = { top: 60, right: 60, bottom: 100, left: 60 };
		const radius = param.radius || 300;

		const chartContainer = d3.select(selector).append('svg')
			.classed('chord-chart', true)
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${radius + margin.left}, ${radius + margin.top})`);

		// add gradient definition
		const defs = chartContainer.append('defs');
		const gradient = defs.append('linearGradient')
			.attr('id', 'fund-gradient');
		gradient.append('stop')
			.attr('stop-color', fundColor)
			.attr('offset', '0%');
		gradient.append('stop')
			.attr('stop-color', receiveColor)
			.attr('offset', '100%');

		// add bounding box
		const clipPath = defs.append('clipPath').attr('id', 'circle-clip');
		clipPath.append('circle')
			.attr('r', radius);

		// add groups for chart
		const linkG = chart.append('g')
			.attr('clip-path', 'url(#circle-clip)');
		const arcG = chart.append('g');
		const countryArcG = arcG.append('g');
		const subregionArcG = arcG.append('g');
		const regionArcG = arcG.append('g');

		// define arc colors and arc paths
		const colorScale = d3.scaleLinear()
			.range([fundColor, receiveColor]);
		const regionArc = d3.arc()
			.innerRadius(radius + 22)
			.outerRadius(radius + 22 + 12)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);
		const subregionArc = d3.arc()
			.innerRadius(radius + 10)
			.outerRadius(radius + 10 + 10)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);
		const countryArc = d3.arc()
			.innerRadius(radius)
			.outerRadius(radius + 8)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);

		// create region arcs
		regionArcG.selectAll('.arc')
			.data(data)
			.enter().append('path')
				.style('fill', getFundReceiveColor)
				.attr('d', regionArc);

		// create subregion arcs
		subregionArcG.selectAll('.arc')
			.data(subregions)
			.enter().append('path')
				.style('fill', getFundReceiveColor)
				.attr('d', subregionArc)
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						content: d.name,
					});
				});

		// create country arcs
		countryArcG.selectAll('.arc')
			.data(countries)
			.enter().append('path')
				.style('fill', getFundReceiveColor)
				.style('stroke', '#fff')
				.attr('d', countryArc)
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						content: d.name,
					});
				});	

		// create region arc labels
		regionArcG.selectAll('.arc-label-path')
			.data(data)
			.enter().append('path')
				.attr('id', (d, i) => `arc-path-${i}`)
				.attr('d', regionArc)
				.style('fill', 'none')
				.each(function positionLabel(d) {
					const firstArcSection = /(^.+?)L/;
					let newArc = firstArcSection.exec(d3.select(this).attr('d'))[1];
					newArc = newArc.replace(/,/g , " ");

					// flip if bottom half of circle
					if (d.theta1 > Math.PI / 2 && d.theta0 < 5 * Math.PI / 4) {
						const startLoc = /M(.*?)A/;
						const middleLoc = /A(.*?)0 0 1/;
						const endLoc = /0 0 1 (.*?)$/;
						const newStart = endLoc.exec(newArc)[1];
						const newEnd = startLoc.exec(newArc)[1];
						const middleSec = middleLoc.exec(newArc)[1];
						newArc = `M${newStart}A${middleSec}0 0 0 ${newEnd}`;
					}

					d3.select(this).attr('d', newArc);
				});
		regionArcG.selectAll('.arc-label')
			.data(data)
			.enter().append('text')
				.attr('class', 'arc-label')
				.attr('dy', (d) => {
					if (d.theta1 > Math.PI / 2 && d.theta0 < 5 * Math.PI / 4) return 20;
					return -8;
				})
				.append('textPath')
					.attr('startOffset', '50%')
					.attr('xlink:href', (d, i) => `#arc-path-${i}`)
					.text(d => d.name);

		// define link path
		const ribbon = d3.ribbon()
			.source(d => d.source)
			.target(d => d.target)
			.radius(radius);

		// create links
		linkG.selectAll('.link')
			.data(funds)
			.enter().append('path')
				.attr('class', 'link')
				.style('fill', colorScale(0))
				.attr('d', ribbon);

		// function for getting fund/receive color
		function getFundReceiveColor(d) {
			const f = d.totalFunded;
			const r = d.totalReceived;
			return colorScale(r / (r + f));
		}

		// add legend
		const barWidth = 450;
		const barHeight = 14;
		const legend = chart.append('g')
			.attr('transform', `translate(${-barWidth / 2}, ${radius + 60})`);
		legend.append('rect')
			.attr('width', barWidth)
			.attr('height', barHeight)
			.style('fill', 'url(#fund-gradient)');
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('y', barHeight + 12)
			.attr('dy', '.35em')
			.style('text-anchor', 'start')
			.text('Funds More');
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('x', barWidth)
			.attr('y', barHeight + 12)
			.attr('dy', '.35em')
			.style('text-anchor', 'end')
			.text('Receives More');

		return chart;
	};
})();
