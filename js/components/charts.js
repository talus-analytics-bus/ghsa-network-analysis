(() => {
	App.buildScatterplot = (selector, data, param = {}) => {
		const margin = { top: 70, right: 20, bottom: 50, left: 90 };
		const width = param.width || 700;
		const height = param.height || 400;
		const chartContainer = d3.select(selector).append('svg')
			.classed('scatterplot', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// add clip path
		const defs = chartContainer.append('defs');
		const chartClip = defs.append('clipPath').attr('id', 'chart-clip');
		chartClip.append('rect')
			.attr('y', -margin.top)
			.attr('width', width + margin.right)
			.attr('height', height + margin.top);

		const x = d3.scaleLog()
			.domain([1, d3.max(data, d => d.funded)])
			.range([0, width]);
		const y = d3.scaleLog()
			.domain([1, d3.max(data, d => d.received)])
			.range([height, 0]);
		const sizeScale = d3.scaleLog()
			.domain([1e4, d3.max(data, d => d.POP2005)])
			.range([1, 30]);

		const xAxis = d3.axisBottom(x)
			.tickFormat(App.formatMoneyShort);
		const yAxis = d3.axisLeft(y)
			.tickFormat(App.formatMoneyShort);

		// add clip path and axes
		const chartBody = chart.append('g')
			.attr('clip-path', 'url(#chart-clip)');
		chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		// add each country
		chartBody.append('g').selectAll('.country-node')
			.data(data)
			.enter().append('circle')
				.attr('class', 'country-node')
				.attr('r', d => sizeScale(d.POP2005))
				.attr('cx', d => x(d.funded))
				.attr('cy', d => y(d.received))
				.style('fill', () => {
					const rand = 10 * Math.random();
					if (rand > 5) return '#aaa';
					if (rand < 1) return '#c91414';
					else if (rand < 3) return '#ff6d00';
					else return '#0c6b0c'; 
				})
				.each(function addTooltip(d) {
					$(this).tooltipster({
						minWidth: 200,
						maxWidth: 400,
						content: getTooltipContent(d),
					});
				});

		// add axes labels
		chart.append('text')
			.attr('class', 'axis-label x-axis-label')
			.attr('x', width / 2)
			.attr('y', height + 45)
			.text(`Amount Funded (in ${App.currencyIso})`);
		chart.append('text')
			.attr('class', 'axis-label y-axis-label-1')
			.attr('y', -25)
			.text(`Amount Received (in ${App.currencyIso})`);

		// function to get tooltip content for countries
		function getTooltipContent(d) {
			const contentContainer = d3.select(document.createElement('div'));
			const content = contentContainer.append('div')
				.attr('class', 'scatterplot-tooltip');
			content.append('div')
				.attr('class', 'scatterplot-tooltip-title')
				.text(d.NAME);
			const infoContainer = content.append('div')
				.attr('class', 'scatterplot-tooltip-info');
			infoContainer.append('div')
				.html(`Population (in 2005): <b>${Util.comma(d.POP2005)}</b>`);
			infoContainer.append('div')
				.html(`Number of Funding Items: <b>${Math.round(40 * Math.random())}</b>`);

			const row = content.append('div').attr('class', 'row');
			const leftCol = row.append('div').attr('class', 'col-sm-6');
			const rightCol = row.append('div').attr('class', 'col-sm-6');

			leftCol.append('div')
				.attr('class', 'scatterplot-tooltip-value')
				.text(App.formatMoney(d.funded));
			leftCol.append('div')
				.attr('class', 'scatterplot-tooltip-value-label')
				.text('Funded');
			rightCol.append('div')
				.attr('class', 'scatterplot-tooltip-value')
				.text(App.formatMoney(d.received));
			rightCol.append('div')
				.attr('class', 'scatterplot-tooltip-value-label')
				.text('Received');
			return contentContainer.html();			
		}

		return chart;
	};
})();
