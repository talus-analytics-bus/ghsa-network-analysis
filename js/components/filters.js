(() => {
	// tests whether a payment satisfies a category filter
	App.passesCategoryFilter = (values, filterValues) => {
		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			if (filterValues.includes(value)) return true;
		}
		return false;
	};
})();
