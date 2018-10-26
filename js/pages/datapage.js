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

		$('.filter-contents').hide();
		$('.filter-header').on('click', () => {
			$('.filter-contents').slideToggle();
			$('.filter-glyph').toggleClass('flip');
		});
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
				{ title: 'Project', width: '60%' },
				{ title: 'Funder', width: '20%' },
				{ title: 'Recipient', width: '20%' },
			],
			pageLength: 25,
			scrollCollapse: false,
			autoWidth: false,
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