(() => {
	// initializes bootstrap slider on the element and adds tick marks and labels
	App.initSlider = (selector, options) => {
		const slider = $(selector).slider(options);
		addSliderTicks(selector, d3.range(options.value[0], options.value[1] + 1));
		return slider;
	};

	function addSliderTicks(sliderSelector, values) {
		const tickContainer = d3.selectAll('.slider').append('div')
			.attr('class', 'slider-tick-box');
		const tickGroups = tickContainer.selectAll('.slider-tick-vert')
			.data(values)
			.enter().append('div')
				.attr('class', 'slider-tick-group')
				.style('left', function(d, i) {
					return (100 * i / (values.length - 1)) + '%';
				});
		tickGroups.append('div').attr('class', 'slider-tick-vert');
		tickGroups.append('div')
			.attr('class', 'slider-tick-text')
			.text(d => d);
	}
})();
