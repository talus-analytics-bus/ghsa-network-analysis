(() => {
	// tests whether a payment satisfies a category filter
	App.passesCategoryFilter = (values, filterValues) => {
		let pass = false;
		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			const parent = filterValues.find(d => d.tag_name === value.p);
			if (parent) {
				if (!value.c || (value.c && parent.children.includes(value.c))) {
					pass = true;
					break;
				}
			}
		}
		return pass;
	};
})();
