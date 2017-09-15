const Map = {};

(() => {
	Map.createLeafletMap = (elementId, param = {}) => {
		const map = L.map(elementId)
			.setView(param.bounds || [38.1, -97.5])
			.setZoom(param.zoom || 4);
		const mapboxTileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/jpecht/citxe4nqe005l2ilff0lknw0u/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoianBlY2h0IiwiYSI6ImNpdHhlMTc5NzAwczEydHFtbnZnankzNmEifQ.79pr8-kMwzRaEzUhvvgzsw', {
			attribution: 'Map data &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			minZoom: 2,
			maxZoom: 14,
		});
		mapboxTileLayer.addTo(map);
		return map;
	};

	/**
	 * Creates a d3js map in the container provided
	 * @param {String} selector A selector of the container element the map will be placed in
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Map.createD3Map = (selector, us, param = {}) => {
		// prepare map
		const mapWidth = param.width || 600;
		const mapHeight = param.height || 400;
		const mapScale = param.scale || 800;
		const projection = d3.geoAlbers()
			.scale(mapScale)
			.translate([mapWidth / 2, mapHeight / 2]);
		const path = d3.geoPath().projection(projection);
		const svg = d3.selectAll(selector).append('svg')
			.attr('width', mapWidth)
			.attr('height', mapHeight)
			.append('g');

		// add state outlines
		if (param.stateMap) {
			const outlines = svg.append('g');
			outlines.selectAll('path')
				.data(topojson.feature(us, us.objects.states).features)
				.enter().append('path')
					.attr('class', 'state')
					.attr('d', path);
			outlines.append('path')
				.datum(topojson.mesh(us, us.objects.counties, (a, b) => a !== b))
				.attr('class', 'counties')
				.attr('d', path);
		} else {
			const outlines = svg.append('g');
			outlines.selectAll('path')
				.data(topojson.feature(us, us.objects.counties).features)
				.enter().append('path')
					.attr('class', 'county')
					.attr('d', path);
			outlines.append('path')
				.datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
				.attr('class', 'states')
				.attr('d', path);
		}

		return {
			svg,
			path,
			projection,
		};
	};
})();
