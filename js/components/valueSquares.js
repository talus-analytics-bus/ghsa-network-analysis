(() => {
	// draws 100 squares and colors a percentage of the squares
	App.drawValueSquares = (selector, percentage, color, param = {}) => {
		// start building the chart
		const margin = { top: 0, right: 0, bottom: 0, left: 0 };
		const marginX = 5;
		const marginY = 5;
		const sWidth = 10;
		const sHeight = 10;
		const numSquares = 100;
		const numPerRow = 20;
		const width = (sWidth + marginX) * numPerRow - marginX;
		const height = (sHeight + marginY) * (numSquares / numPerRow) - marginY;

		const chart = d3.select(selector).append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		console.log(percentage);
		for (let i = 0; i < numSquares; i++) {
			const colored = (i + 1) <= Math.ceil(numSquares * percentage);
			let xCoord = (sWidth + marginX) * (i % numPerRow);
			if (param.right) xCoord = width - xCoord;
			chart.append('rect')
				.attr('x', xCoord)
				.attr('y', (sHeight + marginY) * Math.floor(i / numPerRow))
				.attr('width', sWidth)
				.attr('height', sHeight)
				.style('fill', colored ? color : '#ccc');
		}

		return chart;
	};
})();
