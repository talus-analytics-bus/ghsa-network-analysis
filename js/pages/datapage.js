(() => {
	App.initData = () => {
		populateTable();

		$('table.download-data-table').DataTable({
			pageLength: 50,
			scrollCollapse: false,
			autoWidth: true,
			ordering: false,
			searching: true,
			// pagingType: 'simple',
			// order: [[1, 'asc']],
			// columnDefs: [
			// 	{ targets: [1,2,3], orderable: false},
			// ],
			bLengthChange: false,
		});
	};

	const populateTable = () => {
		const table = d3.selectAll('table.download-data-table tbody');

		const rows = table.selectAll('tr')
			.data(App.fundingData)
			.enter()
			.append('tr');

		rows.append('td')
			.text(d => d.project_name);

		rows.append('td')
			.text(d => d.donor_name);

		rows.append('td')
			.text(d => d.recipient_name);
	}
})();