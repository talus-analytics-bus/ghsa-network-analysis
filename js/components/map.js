const Map = {};

(() => {
	/**
	 * Creates a D3.js world map in the container provided
	 * @param {String} selector A selector of the container element the map will be placed in
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Map.createWorldMap = (selector, world) => {
		// prepare map
		const width = 1200;
		const height = 640;
		const scale = 170;

		// define projection and path
		const projection = d3.geoNaturalEarth2()
			.translate([width / 2, height / 2])
			.scale(scale)
			.precision(0.1);
		const path = d3.geoPath().projection(projection);

		// define zoom
		const zoom = d3.zoom()
			.scaleExtent([1, 8])
			.on('zoom', zoomed);

		// set map width and height
		const svg = d3.selectAll(selector).append('svg')
			.classed('map', true)
			.attr('preserveAspectRatio', 'xMinYMin meet')
			.attr('viewBox', `0 0 ${width} ${height}`)
			.append('g')
				.on('click', stopped, true);

		// add overlay
		svg.append('rect')
			.attr('class', 'overlay')
			.attr('width', width)
			.attr('height', height);

		const g = svg.append('g');
		const nodeG = g.append('g')
			.attr('class', 'countries');
		g.append('g')
			.attr('class', 'links');

		// attach zoom
		svg.call(zoom);

		// add world data, and exclude Antarctica until we can get it to 
		// display correctly on the map.
		const countries = topojson.feature(world, world.objects.countries).features
			.filter(d => d.properties.NAME !== 'Antarctica');
		console.log('countries');
		console.log(countries);
		nodeG.selectAll('.country')
			.data(countries)
			.enter().append('path')
				.attr('class', 'country')
				.attr('d', path);
		nodeG.append('path')
			.datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
			.attr('class', 'boundary')
			.attr('d', path);

		// pan and zoom function
		function zoomed() {
			g.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
			g.attr('transform', d3.event.transform);
		}

		function zoomTo(d) {
			// move country to top of layer
			$(this.parentNode).append(this);

			// call zoom
			const bounds = path.bounds(d);
			const dx = bounds[1][0] - bounds[0][0];
			const dy = bounds[1][1] - bounds[0][1];
			const x = (bounds[0][0] + bounds[1][0]) / 2;
			const y = (bounds[0][1] + bounds[1][1]) / 2;
			const s = Math.max(1, Math.min(8, 0.7 / Math.max(dx / width, dy / height)));
			const t = [width / 2 - s * x, height / 2 - s * y - 90];
			return svg.transition()
				.duration(750)
				.call(zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(s));
		}

		function reset() {
			svg.transition()
				.duration(750)
				.call(zoom.transform, d3.zoomIdentity);
		}

		function stopped() {
			if (d3.event.defaultPrevented) d3.event.stopPropagation();
		}

		return { element: svg, projection, path, zoomTo, reset };
	};
})();
