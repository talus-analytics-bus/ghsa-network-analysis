(() => {
	App.buildCategoryChart = (selector, data) => {
		// inject "running x" into data
		const regions = [];
		data.forEach((d) => {
			let runningValue = 0;
			d.children.forEach((c) => {
				if (!regions.includes(c.name)) regions.push(c.name);
				c.value0 = runningValue;
				runningValue += c.total_spent;
				c.value1 = runningValue;
			});
		});

		// get capacities in order
		const capacities = data.map(d => d.name);
		App.capacities.forEach((c) => {
			if (!capacities.includes(c.id)) capacities.push(c.id);
		});

		// start building the chart
		const margin = { top: 50, right: 20, bottom: 50, left: 40 };
		const width = 400;
		const height = 400;

		const chart = d3.select(selector).append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const maxValue = d3.max(data, d => d.total_spent);
		const x = d3.scaleLinear()
			.domain([0, maxValue])
			.range([0, width]);
		const y = d3.scaleBand()
			.padding(0.2)
			.domain(capacities)
			.range([0, height]);
		const colorScale = d3.scaleOrdinal()
			.domain(regions)
			.range(d3.schemeCategory10);

		const xAxis = d3.axisTop()
			.ticks(5)
			.tickFormat(App.siFormat)
			.scale(x);
		const yAxis = d3.axisLeft()
			.scale(y);

		chart.append('g')
			.attr('class', 'x axis')
			.call(xAxis);
		chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		const barGroups = chart.selectAll('.bar-group')
			.data(data)
			.enter().append('g')
				.attr('class', 'bar-group')
				.attr('transform', d => `translate(0, ${y(d.name)})`);
		barGroups.selectAll('rect')
			.data(d => d.children)
			.enter().append('rect')
				.attr('x', d => x(d.value0))
				.attr('width', d => x(d.value1) - x(d.value0))
				.attr('height', y.bandwidth())
				.style('fill', d => colorScale(d.name));
	};
})();
