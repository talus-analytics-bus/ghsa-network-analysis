(() => {
	App.initializeSearch = (selector) => {
		let liveSearchTimeout;
		$(selector)
			.on('focus', function() {
				search($(this).val());
			})
			.on('blur', () => {
				clearTimeout(liveSearchTimeout);
				$('.search-results-container').hide();
			})
			.on('keyup', function(ev) {
				clearTimeout(liveSearchTimeout);
				if (ev.which === 13) {
					// enter key: perform search
					search($(this).val());
				} else {
					const searchVal = $(this).val();
					liveSearchTimeout = setTimeout(() => {
						search(searchVal);
					}, 250);
				}
			});
	};

	// searches for a location
	function search(value) {
		const $searchContainer = $('.search-results-container');

		if (!value) {
			$searchContainer.hide();
			return;
		}

		const centerSearch = new Fuse(App.callCenters, {
			include: ['score'],
			keys: ['organization', 'city', 'state'],
			shouldSort: true,
			threshold: 0.1,
			distance: 1e5,
		});
		const stateSearch = new Fuse(App.stateData, {
			include: ['score'],
			keys: ['state'],
			shouldSort: true,
			threshold: 0.1,
			distance: 1e5,
		});

		// get results
		const centerResults = centerSearch.search(value);
		const stateResults = stateSearch.search(value);
		const results = centerResults.concat(stateResults);
		Util.sortByKey(results, 'score', true);

		// show results
		$searchContainer.show();
		if (results.length === 0) {
			$('.search-no-results-text').show();
			$('.search-results-content').hide();
		} else {
			$('.search-no-results-text').hide();
			$('.search-results-content').show();

			let boxes = d3.select('.search-results-content').selectAll('.search-results-box')
				.data(results.slice(0, 4));
			boxes.exit().remove();
			const newBoxes = boxes.enter().append('div')
				.attr('class', 'search-results-box');
			newBoxes.append('div')
				.attr('class', 'search-results-title');
			newBoxes.append('div')
				.attr('class', 'search-results-subtitle');

			boxes = newBoxes.merge(boxes);
			boxes.select('.search-results-title').text((d) => {
				if (d.item.type === 'center') return d.item.organization;
				return d.item.state;
			});
			boxes.select('.search-results-subtitle').text((d) => {
				if (d.item.type === 'center' && d.item.city !== 'Multiple') return `${d.item.city}, ${d.item.state_abbr}`;
				else if (d.item.type === 'center') return `Multiple locations`;
				return 'State';
			});
			boxes.on('mousedown', (d) => {
				if (d.item.type === 'center') hasher.setHash(`center/${d.item.center_id}`);
				else if (d.item.type === 'state') hasher.setHash(`state/${d.item.fips}`);
				$searchContainer.hide();
			});
		}
	}
})();
