(() => {
	// populates core capacity filter dropdown
	App.populateCcDropdown = (selector, param = {}) => {
		const emptyObj = { id: '', name: 'Unspecified - No core capacity tagged' };
		const capacities = App.capacities.concat(emptyObj);
		Util.populateSelect(selector, capacities, {
			valKey: 'id',
			nameKey: 'name',
			selected: true,
		});
		$(selector).multiselect({
			maxHeight: 260,
			includeSelectAllOption: true,
			numberDisplayed: 0,
			dropUp: param.dropUp || false,
			dropLeft: param.dropLeft || false,
			dropRight: param.dropRight || false,
		});
	};

	// tests whether a payment satisfies a category filter
	App.passesCategoryFilter = (values, filterValues) => {
		if (!values.length && filterValues.includes('')) return true;
		for (let i = 0; i < values.length; i++) {
			if (filterValues.includes(values[i])) return true;
		}
		return false;
	};
})();
