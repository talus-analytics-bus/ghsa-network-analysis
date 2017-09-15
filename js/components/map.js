const Map = {};

(() => {
	/**
	 * Creates a D3.js world map in the container provided
	 * @param {String} selector A selector of the container element the map will be placed in
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Map.createWorldMap = (selector, callback) => {
		// prepare map
		const mapWidth = 1200;
		const mapHeight = 600;

		const projection = d3.geoMercator()
			.scale(170)
			.translate([mapWidth / 2, mapHeight / 2])
			.precision(.1);
		const path = d3.geoPath().projection(projection);
		const svg = d3.selectAll(selector).append('svg')
			.attr('width', mapWidth)
			.attr('height', mapHeight)
			.append('g');

		// add world data
		d3.json('data/world-50m.json', (error, world) => {
			if (error) throw error;

			const countries = topojson.feature(world, world.objects.countries).features;

			svg.selectAll('.country')
				.data(countries)
				.enter().append('path')
					.attr('class', 'country')
					.attr('d', path);
			svg.append('path')
				.datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
				.attr('class', 'boundary')
				.attr('d', path);

			if (callback) callback();
		});

		return { svg, path, projection };
	};
})();
