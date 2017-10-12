(() => {
	// initializes bootstrap slider on the element and adds tick marks and labels
	App.initSlider = (selector, options) => {
		const slider = $(selector).slider(options);
		addSliderTicks(selector, d3.range(options.min, options.max + 1));
		return slider;
	};

	function addSliderTicks(sliderSelector, values) {
		const tickContainer = d3.selectAll('.slider').append('div')
			.attr('class', 'slider-tick-box');
		tickContainer.selectAll('.slider-tick-vert')
			.data(values)
			.enter().append('div')
				.attr('class', 'slider-tick-vert')
				.style('left', (d, i) => {
					return (100 * i / (values.length - 1)) + '%';
				});
		const tickTextContainers = tickContainer.selectAll('.slider-tick-text-container')
			.data(values)
			.enter().append('div')
				.attr('class', 'slider-tick-text-container')
				.style('left', (d, i) => {
					return (100 * (2 * i + 1) / (2 * (values.length - 1))) + '%';
				});
		tickTextContainers.append('div')
			.attr('class', 'slider-tick-text')
			.text((d, i) => (i === values.length - 1) ? '' : d);
	}
})();
