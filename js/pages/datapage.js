(() => {
	let data;

	App.initData = () => {
		data = App.fundingData
			.map(d => [
				(d.project_name || 'Not Reported').toString(),
				(d.donor_name || 'Not Reported').toString(),
				(d.recipient_name || 'Not Reported').toString(),
			]);

		$('.download-container').text(`Download all available data (${Util.comma(data.length)} records)`)
			.on('click', () => {
				download("fundingData.json", JSON.stringify(App.fundingData));
			});

		populateTable();
	};

	const download = (filename, text) => {
		// https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	};

	const populateTable = () => {
		$('table.download-data-table').DataTable({
			data,
			columns: [
				{ title: 'Project' },
				{ title: 'Funder' },
				{ title: 'Recipient' },
			],
			pageLength: 50,
			scrollCollapse: false,
			autoWidth: true,
			ordering: true,
			searching: true,
			// pagingType: 'simple',
			// order: [[1, 'asc']],
			// columnDefs: [
			// 	{ targets: [1,2,3], orderable: false},
			// ],
			bLengthChange: false,
		});
	}
})();