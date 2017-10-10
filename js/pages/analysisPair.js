(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)
	let currentMoneyType;  // the type of money flow for the country chosen (donated, received)
	let currentPayments;  // an array of all payments corresponding to the country chosen

	App.initAnalysisPair = (fundIso, recIso) => {
		// define content in container
		const content = d3.select('.analysis-pair-content');
		const $content = $('.analysis-pair-content');

		// get country info
		const fundCountry = App.countries.find(c => c.ISO2 === fundIso);
		const recCountry = App.countries.find(c => c.ISO2 === recIso);

		// get payments between the countries
		let allPayments = [];
		if (App.fundingLookup[fundIso]) {
			allPayments = App.fundingLookup[fundIso].filter(p =>
				p.recipient_country === recIso);
		}

		function init() {
			// fill title
			const fundFlagHtml = `<img class="flag" src="img/flags/${fundIso.toLowerCase()}.png" />`;
			const recFlagHtml = `<img class="flag" src="img/flags/${recIso.toLowerCase()}.png" />`;
			$content.find('.analysis-country-title').html(`${fundFlagHtml} ${fundCountry.NAME} ` +
				`<div class="arrow-html">&rarr;</div>  ${recCountry.NAME} ${recFlagHtml}`);

			// define info table tab behavior
			$content.find('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});

			// fill table content
			updateInfoTab();
			updateInfoTable();
		}

		// update the content shwon based on tab chosen
		function updateInfoTab() {
			// make correct tab active
			$content.find(`.funds-tab-container .btn[tab="${currentInfoTab}"]`)
				.addClass('active')
				.siblings().removeClass('active');
		}

		// update the table content depending on tab chosen
		function updateInfoTable() {
			// define column data
			let headerData = [];
			if (currentInfoTab === 'all') {
				headerData = [
					{ name: 'Donor', value: 'donor_name' },
					{ name: 'Recipient', value: 'recipient_name' },
					{ name: 'Name', value: 'project_name' },
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				];
			} else if (currentInfoTab === 'cc') {
				headerData = [
					{ name: 'JEE Capacity', value: 'cc' },
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				];
			}

			// define row data
			let paymentTableData = [];
			if (currentInfoTab === 'all') {
				paymentTableData = allPayments.slice(0);
			} else if (currentInfoTab === 'cc') {
				const totalByCc = {};
				allPayments.forEach((p) => {
					p.project_function.forEach((fn) => {
						if (!totalByCc[fn.p]) {
							totalByCc[fn.p] = {
								total_committed: 0,
								total_spent: 0,
							};
						}
						totalByCc[fn.p].total_committed += p.total_committed;
						totalByCc[fn.p].total_spent += p.total_spent;
					});
				});
				for (let fnp in totalByCc) {
					paymentTableData.push({
						cc: fnp,
						total_committed: totalByCc[fnp].total_committed,
						total_spent: totalByCc[fnp].total_spent,
					});
				}
			}

			// clear DataTables plugin from table
			if (infoTableHasBeenInit) infoDataTable.destroy();

			// populate table
			const infoTable = content.select('.funds-table');
			const infoThead = infoTable.select('thead tr');
			const headers = infoThead.selectAll('th')
				.data(headerData);
			headers.exit().remove();
			headers.enter().append('th')
				.merge(headers)
				.classed('money-cell', d => d.type === 'money')
				.text(d => d.name);

			const infoTbody = infoTable.select('tbody');
			const rows = infoTbody.selectAll('tr')
				.data(paymentTableData);
			rows.exit().remove();
			const newRows = rows.enter().append('tr');

			const cells = newRows.merge(rows).selectAll('td')
				.data(d => headerData.map(c => ({ rowData: d, colData: c })));
			cells.exit().remove();
			cells.enter().append('td')
				.merge(cells)
				.classed('money-cell', d => d.colData.type === 'money')
				.text((d) => {
					const cellValue = d.rowData[d.colData.value];
					if (d.colData.type === 'money') return App.formatMoneyFull(cellValue);
					return cellValue;
				});

			// define DataTables plugin parameters
			let order = [4, 'desc'];
			let columnDefs = [{ type: 'money', targets: [3, 4] }];
			if (currentInfoTab === 'country') {
				order = [3, 'desc'];
				columnDefs = [{ type: 'money', targets: [2, 3] }];
			} else if (currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2] }];
			}

			// re-initialize DataTables plugin
			infoDataTable = $content.find('.funds-table').DataTable({
				scrollY: '30vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;		
		};

		init();
	};
})();
