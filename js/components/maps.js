const Maps = {};

(() => {
	/**
	 * Creates a d3js map in the container provided
	 * @param {String} elementId The id of the container element the map will be palced in
	 * @param {Object} [options] An object containing options
	 * @param {Number} [options.zoom] The starting zoom level of the map
	 * @param {Number} [options.maxZoom] The maximum zoom level of the map
	 * @param {Object} [options.latlon] Latitude and longitude of the map center [lat, lon]
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Maps.createMap = (selector, us, param = {}) => {
		// prepare map
		// TODO may want to vary dimensions based on window dimensions
		const mapWidth = param.width || 525;
		const mapHeight = param.height || 350;
		const mapScale = param.scale || 700;
		const projection = d3.geoAlbers()
			.scale(mapScale)
			.translate([mapWidth / 2, mapHeight / 2]);
		const path = d3.geoPath().projection(projection);
		const svg = d3.selectAll(selector).append('svg')
			.attr('width', mapWidth)
			.attr('height', mapHeight)
			.append('g');

		// add state outlines
		const boundaries = svg.append('g');
		boundaries.selectAll('path')
			.data(topojson.feature(us, us.objects.states).features)
			.enter().append('path')
				.attr('class', 'state')
				.attr('d', path);
		if (param.includeCountyBoundaries) {
			boundaries.append('path')
				.datum(topojson.mesh(us, us.objects.counties, (a, b) => a !== b))
				.attr('class', 'counties')
				.attr('d', path);
		}

		/* ----- Zoom Functions ----- */
		let zoom;
		function zoomMap(t, s) {
			zoom.translateBy(svg, t[0], t[1]);
			zoom.scaleBy(svg, s);
		}
		function zoomTo(lat, lon) {
			const coordAdjust = 1.215;
			const xTransAdjust = 65;
			const yTransAdjust = 35;
			const t = projection(lon, lat);
			const s = 3;

			zoomMap(t, s);
		}

		if (param.zoomIn) {
			zoom = d3.zoom().scaleExtent([1, 50]);
			svg.call(zoom);

			// get average latitude and longitude of location and zoom in
			const lats = [];
			const lons = [];
			param.fips.forEach((fips) => {
				const countyInfo = App.countyData.find(d => d.fips === fips);
				lats.push(countyInfo.latitude);
				lons.push(countyInfo.longitude);
			});
			// zoomTo(d3.mean(lats), d3.mean(lons));
		}

		return {
			svg,
			path,
			projection,
		};
	};


	/**
	 * Creates a d3js map in the container provided for the state data given
	 * @param {String} elementId The id of the container element the map will be palced in
	 * @param {Object} [options] An object containing options
	 * @param {Number} [options.zoom] The starting zoom level of the map
	 * @param {Number} [options.maxZoom] The maximum zoom level of the map
	 * @param {Object} [options.latlon] Latitude and longitude of the map center [lat, lon]
	 * @return {Object} An object containing the map and the layer containing drawn items
	 */
	Maps.createStateMap = (selector, stateGeoData, stateFips, param = {}) => {
		if (stateFips.length === 1) stateFips = `0${stateFips}`;
		const objName = `tl_2010_${stateFips}_zcta510`;

		// define constants
		const mapWidth = param.width || 525;
		const mapHeight = param.height || 350;
		const mapScale = param.scale || 700;
		const projection = d3.geoAlbers();
		const path = d3.geoPath().projection(projection);

		// convert data and find bounds
		const featureCollection = topojson.feature(stateGeoData, stateGeoData.objects[objName]);

		// prepare map
		const svg = d3.selectAll(selector).append('svg')
			.attr('width', mapWidth)
			.attr('height', mapHeight);
		const g = svg.append('g');
		g.selectAll('path')
			.data(featureCollection.features)
			.enter().append('path')
				.attr('class', 'zip-code')
				.attr('d', path);

		const bounds = path.bounds(featureCollection);
		const dx = bounds[1][0] - bounds[0][0];
		const dy = bounds[1][1] - bounds[0][1];
		const x = (bounds[0][0] + bounds[1][0]) / 2;
		const y = (bounds[0][1] + bounds[1][1]) / 2;
		const scale = .9 / Math.max(dx / mapWidth, dy / mapHeight);
		const translate = [mapWidth / 2 - scale * x, mapHeight / 2 - scale * y];
		// g.transition()
		g
			.attr('transform', `translate(${translate})scale(${scale})`);

		// filter glow definitions
		var defs = svg.append('defs');
		var filter = defs.append('filter')
			.attr('id', 'glow');
		filter.append('feGaussianBlur')
			.attr('stdDeviation', '2.5')
			.attr('result', 'coloredBlur');
		var feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode')
			.attr('in', 'coloredBlur');
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');

		return {
			svg,
			g,
			path,
			projection,
			scale,
		};
	};


	Maps.createCenterMap = (selector, us, param = {}) => {
		const mapObj = Maps.createMap(selector, us, param);
		const map = mapObj.svg;
		const projection = mapObj.projection;

		const centerRadiusScale = d3.scaleLinear()
			.range([4, 12]);
		const ringRadiusScale = d3.scaleLinear()
			.range([12, 36]);

		// filter glow definitions
		var defs = map.append('defs');
		var filter = defs.append('filter')
			.attr('id', 'glow');
		filter.append('feGaussianBlur')
			.attr('stdDeviation', '2.5')
			.attr('result', 'coloredBlur');
		var feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode')
			.attr('in', 'coloredBlur');
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');

		// get call volume
		Api.getCallsInRange([App.pwDate, App.cwDate], () => true, (callData) => {
			// get call volume for each call center
			App.callCenters.forEach((d) => {
				const localCallData = callData.filter(dd => dd.center_id === d.center_id);
				d.callVolume = localCallData.length;
			});

			// set the domain of the radii
			const maxCallVolume = d3.max(App.callCenters, d => d.callVolume);
			centerRadiusScale.domain([0, maxCallVolume]);
			ringRadiusScale.domain([0, maxCallVolume]);

			mapObj.centerRadiusScale = centerRadiusScale;
			mapObj.ringRadiusScale = ringRadiusScale;

			// set radius for each call center
			App.callCenters.forEach((d) => {
				d.radius = centerRadiusScale(d.callVolume);
				d.ringRadius = ringRadiusScale(d.callVolume);
			});

			// add call centers
			if (param.useSquares) {
				map.append('g').selectAll('.map-center-ring')
					.data(App.callCenters)
					.enter().append('rect')
						.attr('class', 'map-center-ring')
						.attr('x', d => -d.ringRadius / 2)
						.attr('y', d => -d.ringRadius / 2)
						.attr('width', d => d.ringRadius)
						.attr('height', d => d.ringRadius)
						.attr('transform', (d) => {
							const coords = mapObj.projection([d.longitude, d.latitude]);
							if (coords !== null) {
								return 'translate(' + coords[0] + ',' + coords[1] + ')';
							}
						})
						.style('filter', 'url(#glow)');

				map.append('g').selectAll('.map-center')
					.data(App.callCenters)
					.enter().append('rect')
						.attr('class', 'map-center')
						.attr('x', d => -d.radius / 2)
						.attr('y', d => -d.radius / 2)
						.attr('width', d => d.radius)
						.attr('height', d => d.radius)
						.attr('transform', (d) => {
							const coords = mapObj.projection([d.longitude, d.latitude]);
							if (coords !== null) {
								return 'translate(' + coords[0] + ',' + coords[1] + ')';
							}
						})
						.style('filter', 'url(#glow)');
			} else {
				map.append('g').selectAll('.map-center-ring')
					.data(App.callCenters)
					.enter().append('circle')
						.attr('class', 'map-center-ring')
						.attr('r', d => d.ringRadius)
						.attr('transform', (d) => {
							const coords = mapObj.projection([d.longitude, d.latitude]);
							if (coords !== null) {
								return 'translate(' + coords[0] + ',' + coords[1] + ')';
							}
						})
						.style('filter', 'url(#glow)');

				map.append('g').selectAll('.map-center')
					.data(App.callCenters)
					.enter().append('circle')
						.attr('class', 'map-center')
						.attr('r', d => d.radius)
						.attr('transform', (d) => {
							const coords = mapObj.projection([d.longitude, d.latitude]);
							if (coords !== null) {
								return 'translate(' + coords[0] + ',' + coords[1] + ')';
							}
						})
						.style('filter', 'url(#glow)');
			}

			if (param.callback) param.callback(mapObj);
		});

		return mapObj;
	}
})();
