(() => {
	App.initHome = () => {
		// lookup variables used throughout
		let countryData;  // an array of country data
		let fundingLookup;
		let recipientLookup;

		// other variables
		let liveSearchTimeout;  // timeout for country search


		// function for initializing the page
		function init() {
			NProgress.start();

			// load world data
			d3.json('data/world.json', (error, worldData) => {
				if (error) throw error;

				// populate country data variable
				countries = worldData.objects.countries.geometries.map((c) => {
					return c.properties;
				});

				// build map and initialize search
				const map = buildMap(worldData);
				initSearch(worldData);

				// load funding data
				d3.json('data/funding_data.json', (error, data) => {
					console.log(data);

					// data collation
					fundingLookup = d3.map(data, d => d.donor_country);
					recipientLookup = d3.map(data, d => d.recipient_country);

					populateFilters(data);
					updateMap(map, data);

					NProgress.done();
				});
			});
		}


		/* ---------------------- Functions ----------------------- */
		function buildMap(worldData) {
			// add map to map container
			const map = Map.createWorldMap('.map-container', worldData);

			// TODO attach tooltips to countries
			d3.selectAll('.country').each(function addTooltip(d) {
				$(this).tooltipster({
					trigger: 'click',
					content: d.properties.NAME,
				});
			});

			return map;
		}

		function getFilteredData() {
			// get the data to be shown on the map
			return fundingLookup;
		}

		function updateMap(map) {
			const filteredData = getFilteredData();
		}

		function initSearch(worldData) {
			// set search bar behavior
			$('.country-search-input')
				.on('focus', function() { searchForCountry($(this).val()); })
				.on('blur', function() {
					clearTimeout(liveSearchTimeout);
					$('.live-search-results-container').hide();
				})
				.on('keyup', function(ev) {
					clearTimeout(liveSearchTimeout);
					const searchVal = $(this).val();
					if (ev.which === 13) {
						// enter: perform search immediately
						searchForCountry(searchVal);
					} else {
						// perform search when user stops typing for 250ms
						liveSearchTimeout = setTimeout(function() {
							searchForCountry(searchVal);
						}, 250);
					}
				});
		}

		function searchForCountry(searchVal) {
			const $resultsBox = $('.live-search-results-container');
			if (searchVal.trim() === '') {
				$resultsBox.hide();
				return;
			}
			
			// show live search box under search bar
			const fuse = new Fuse(countries, {
				threshold: 0.3,
				distance: 1e5,
				keys: ['ISO2', 'ISO3', 'FIPS', 'NAME'],
			});
			const results = fuse.search(searchVal);
			
			// show results in boxes under search input
			$resultsBox.show();
			if (results.length === 0) {
				$resultsBox.find('.live-search-no-results-text').show();
				$resultsBox.find('.live-search-results-contents').hide();
			} else {
				$resultsBox.find('.live-search-no-results-text').hide();
				$resultsBox.find('.live-search-results-contents').show();

				let boxes = d3.select($resultsBox[0]).select('.live-search-results-contents').selectAll('.live-search-results-box')
					.data(results.slice(0, 4));
				boxes.exit().remove();

				const newBoxes = boxes.enter().append('div')
					.attr('class', 'live-search-results-box');
				newBoxes.append('div')
					.attr('class', 'live-search-results-title');
				newBoxes.append('div')
					.attr('class', 'live-search-results-subtitle');
					
				boxes = boxes.merge(newBoxes)
					.attr('code', d => d.abbreviation)
					.on('mousedown', (d) => {
						// clear input
						$('.country-search-input').val('');

						// update dropdown and map
						App.updateCountry(d.abbreviation);
					});
				boxes.select('.live-search-results-title')
					.text(d => `${d.NAME} (${d.ISO3})`);
				boxes.select('.live-search-results-subtitle')
					.text(d => `Population: ${Util.comma(d.POP2005)}`);
			}
		}

		function populateFilters(data) {
			// get unique values from data
			const functions = d3.map(data, d => d.project_function).keys()
				.filter(d => d !== 'undefined')
				.sort();
			const diseases = d3.map(data, d => d.project_disease).keys()
				.filter(d => d !== 'undefined')
				.sort();

			// populate dropdowns
			Util.populateSelect('.function-select', functions, { selected: true });
			Util.populateSelect('.disease-select', diseases, { selected: true });

			// initialize multiselects
			$('.function-select, .disease-select').multiselect({
				dropRight: true,
				includeSelectAllOption: true,
				numberDisplayed: 0,
			});

			// show map options
			$('.map-options-container').show();
		}

		init();
	}
})();
