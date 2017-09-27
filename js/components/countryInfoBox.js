(() => {
	// variables used for info box
	let infoTableHasBeenInit = false;
	let infoDataTable;

	App.populateCountryInfoBox = (country, moneyType, payments, closeFunc) => {
		// define info close button behavior
		$('.info-close-button').on('click', closeFunc);

		// populate info title
		$('.info-title').text(country.NAME);

		// if there are no payments, return
		if (!payments) {
			const valueText = (moneyType === 'received') ? 
				'No data for payments received by this country' :
				'No data for money donated by this country';
			$('.info-total-value').html(valueText);
			$('.info-table-container').hide();
			$('.info-container').slideDown();
			return;
		} else {
			$('.info-table-container').show();
		}

		// populate info total value
		const totalValue = d3.sum(payments, d => d.total_spent);
		const valueLabel = (moneyType === 'received') ?
			'Total Received' : 'Total Donated';
		const valueText = App.formatMoney(totalValue);
		$('.info-total-value').html(`${valueLabel}: <b>${valueText}</b>`);

		// define column data for info table
		const headerData = [
			{ name: 'Donor', value: 'donor_name' },
			{ name: 'Recipient', value: 'recipient_name' },
			{ name: 'Name', value: 'project_name' },
			{ name: 'Committed', value: 'total_committed', format: App.formatMoneyFull },
			{ name: 'Disbursed', value: 'total_spent', format: App.formatMoneyFull },
		];

		// clear DataTables plugin from table
		if (infoTableHasBeenInit) infoDataTable.destroy();

		// populate table
		const infoTable = d3.select('.info-table');
		const infoThead = infoTable.select('thead tr');
		const headers = infoThead.selectAll('th')
			.data(headerData);
		headers.exit().remove();
		headers.enter().append('th')
			.merge(headers)
			.text(d => d.name);

		const infoTbody = infoTable.select('tbody');
		const rows = infoTbody.selectAll('tr')
			.data(payments);
		rows.exit().remove();
		const newRows = rows.enter().append('tr');

		const cells = newRows.merge(rows).selectAll('td')
			.data(d => headerData.map(c => ({ rowData: d, colData: c })));
		cells.exit().remove();
		cells.enter().append('td')
			.merge(cells)
			.text((d) => {
				const cellValue = d.rowData[d.colData.value];
				if (d.colData.format) return d.colData.format(cellValue);
				return cellValue;
			});

		// define "go to analysis" button behavior
		$('.info-analysis-button')
			.html(`Show ${country.NAME} in Analysis Page`)
			.off('click')
			.on('click', () => {
				hasher.setHash(`analysis/${country.ISO2}`);
			});

		// show info
		$('.info-container').slideDown();

		// initialize DataTables plugin, if not already
		infoDataTable = $('.info-table').DataTable({
			scrollY: '30vh',
			scrollCollapse: false,
			order: [4, 'desc'],
			columnDefs: [
				{ type: 'money', targets: [3, 4] },
			],
		});
		infoTableHasBeenInit = true;		
	};
})();
