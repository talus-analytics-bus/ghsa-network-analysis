(() => {
	App.buildNetworkMap = (selector, initData, param = {}) => {
		// define colors
		const fundColor = App.fundColor;
		const receiveColor = App.receiveColor;

		// define geo collection variables and maps
		let subregions = [];
		let countries = [];
		let funds = [];
		const countryMapByName = d3.map();

		// establish chart constants
		const margin = { top: 60, right: 60, bottom: 100, left: 60 };
		const radius = param.radius || 300;
		const regionPadding = 0.02;
		const subregionPadding = 0.01;

		// start building the chart
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
			.attr('class', 'link-g')
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

		// define link path
		const ribbon = d3.ribbon()
			.source(d => d.source)
			.target(d => d.target)
			.radius(radius);


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

		chart.update = (data) => {
			addAnglesToData(data);
			drawArcs(data);
			drawLinks(data);
		}

		function drawArcs(data) {
			// create region arcs
			const rArcs = regionArcG.selectAll('.arc')
				.data(data);
			rArcs.exit().remove();
			rArcs.enter().append('path')
				.attr('class', 'arc')
				.merge(rArcs)
					.transition()
					.style('fill', getFundReceiveColor)
					.attr('d', regionArc);

			// create subregion arcs
			const sArcs = subregionArcG.selectAll('.arc')
				.data(subregions);
			sArcs.exit().remove();
			sArcs.enter().append('path')
				.attr('class', 'arc')
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						content: d.name,
					});
				})
				.merge(sArcs)
					.transition()
					.style('fill', getFundReceiveColor)
					.attr('d', subregionArc);

			// create country arcs
			const cArcs = countryArcG.selectAll('.arc')
				.data(countries);
			cArcs.exit().remove();
			cArcs.enter().append('path')
				.attr('class', 'arc')
				.each(function addTooltip(d) {
					$(this).tooltipster({
						plugins: ['follower'],
						content: d.name,
					});
				})
				.merge(cArcs)
					.on('mouseover', (d) => {
						d3.selectAll('.link')
							.filter(l => l.donor === d.name || l.recipient === d.name)
							.classed('active', true);
					})
					.on('mouseout', (d) => {
						d3.selectAll('.link').classed('active', false);
					})
					.transition()
						.style('fill', getFundReceiveColor)
						.style('stroke', '#fff')
						.attr('d', countryArc);

			// create region arc labels
			const labelPaths = regionArcG.selectAll('.arc-label-path')
				.data(data);
			labelPaths.exit().remove();
			labelPaths.enter().append('path')
				.attr('class', 'arc-label-path')
				.merge(labelPaths)
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
			let labels = regionArcG.selectAll('.arc-label')
				.data(data);
			labels.exit().remove();
			const newLabels = labels.enter().append('text')
				.attr('class', 'arc-label');
			newLabels.append('textPath')
				.attr('startOffset', '50%');
			labels = newLabels.merge(labels)
				.attr('dy', (d) => {
					if (d.theta1 > Math.PI / 2 && d.theta0 < 5 * Math.PI / 4) return 20;
					return -8;
				});
			labels.select('textPath')
				.attr('xlink:href', (d, i) => `#arc-path-${i}`)
				.text(d => d.name);
		}

		function drawLinks(data) {
			// create links
			const links = linkG.selectAll('.link')
				.data(funds);
			links.exit().remove();
			links.enter().append('path')
				.attr('class', 'link')
				.merge(links)
					.attr('d', ribbon)
					.transition().style('fill', colorScale(0));
		}

		function addAnglesToData(data) {
			// empty collection variables and empty maps
			subregions = [];
			countries = [];
			funds = [];
			countryMapByName.empty();

			// attach start and end angles to each of the countries/subregions/regions
			const totalFlow = d3.sum(data, d => d.totalFlow);
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
		}

		// function for getting fund/receive color
		function getFundReceiveColor(d) {
			const f = d.totalFunded;
			const r = d.totalReceived;
			return colorScale(r / (r + f));
		}

		chart.update(initData);
		return chart;
	};
})();
