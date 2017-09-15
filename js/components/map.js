const Map = {};

(() => {
	/**
	 * Creates a D3.js world map in the container provided
	 * @param {String} selector A selector of the container element the map will be placed in
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Map.createWorldMap = (selector, callback) => {
		// prepare map
		const width = 1200;
		const height = 600;
		const scale = 170;

		// define projection and path
		const projection = d3.geoMercator()
			.translate([width / 2, height / 2])
			.scale(scale)
			.precision(.1);
		const path = d3.geoPath().projection(projection);

		// define zoom
		const zoom = d3.zoom()
			.scaleExtent([1, 8])
			.on('zoom', zoomed);

		// set map width and height
		const svg = d3.selectAll(selector).append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g');
		const g = svg.append('g');

		// add overlay
		svg.append('rect')
			.attr('class', 'overlay')
			.attr('width', width)
			.attr('height', height);

		// attach zoom
		svg.call(zoom);

		// add world data
		d3.json('data/world-50m.json', (error, world) => {
			if (error) throw error;

			const countries = topojson.feature(world, world.objects.countries).features;

			g.selectAll('.country')
				.data(countries)
				.enter().append('path')
					.attr('class', 'country')
					.attr('d', path);
			g.append('path')
				.datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
				.attr('class', 'boundary')
				.attr('d', path);

			if (callback) callback();
		});

		let currScale = 1;
		function zoomed() {
			const transform = d3.event.transform;
			if (transform.k === currScale) {
				// pan event; don't use transition
				g.attr('transform', transform);
			} else {
				// zoom event; use transition
				g.transition().attr('transform', transform);
				currScale = transform.k;
			}
		}

		return { svg, path, projection };
	};
})();
