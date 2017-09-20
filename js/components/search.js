(() => {
	App.initCountrySearchBar = (selector, data, searchedFn) => {
		// timeout for country search
		let liveSearchTimeout;

		// set search bar behavior
		$(selector)
			.on('focus', function focus() {
				searchForCountry($(this).val(), searchedFn);
			})
			.on('blur', () => {
				clearTimeout(liveSearchTimeout);
				$('.live-search-results-container').hide();
			})
			.on('keyup', function keyUp(ev) {
				clearTimeout(liveSearchTimeout);
				const searchVal = $(this).val();
				if (ev.which === 13) {
					// enter: perform search immediately
					searchForCountry(searchVal, searchedFn);
				} else {
					// perform search when user stops typing for 250ms
					liveSearchTimeout = setTimeout(() => {
						searchForCountry(searchVal, searchedFn);
					}, 250);
				}
			});

		// initialize search engine
		const fuse = new Fuse(data, {
			threshold: 0.3,
			distance: 1e5,
			keys: ['ISO2', 'ISO3', 'FIPS', 'NAME'],
		});


		// function for displaying country search results
		function searchForCountry(searchVal, searchedFn) {
			const $resultsBox = $('.live-search-results-container');
			if (searchVal.trim() === '') {
				$resultsBox.hide();
				return;
			}

			// search for results
			const results = fuse.search(searchVal);

			// show results in boxes under search input
			$resultsBox.show();
			if (results.length === 0) {
				$resultsBox.find('.live-search-no-results-text').show();
				$resultsBox.find('.live-search-results-contents').hide();
			} else {
				$resultsBox.find('.live-search-no-results-text').hide();
				$resultsBox.find('.live-search-results-contents').show();

				let boxes = d3.select($resultsBox[0])
					.select('.live-search-results-contents')
					.selectAll('.live-search-results-box')
						.data(results.slice(0, 4));
				boxes.exit().remove();

				const newBoxes = boxes.enter().append('div')
					.attr('class', 'live-search-results-box');
				newBoxes.append('div')
					.attr('class', 'live-search-results-title');
				newBoxes.append('div')
					.attr('class', 'live-search-results-subtitle');

				boxes = boxes.merge(newBoxes).on('mousedown', (d) => {
					// clear input
					$('.country-search-input').val('');

					// call searched function
					searchedFn(d);
				});
				boxes.select('.live-search-results-title')
					.text(d => `${d.NAME} (${d.ISO3})`);
				boxes.select('.live-search-results-subtitle')
					.text(d => `Population: ${Util.comma(d.POP2005)}`);
			}
		}
	}
})();
