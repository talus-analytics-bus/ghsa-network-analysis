(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)
	let currentMoneyType;  // the type of money flow for the country chosen (donated, received)
	let currentPayments;  // an array of all payments corresponding to the country chosen

	App.initAnalysisTable = (iso, moneyFlow) => {
		// find all payments funded or received by this country
		let allPayments = [];
		if (moneyFlow === 'd' && App.fundingLookup[iso]) {
			allPayments = App.fundingLookup[iso].slice(0);
		}
		if (moneyFlow === 'r' && App.recipientLookup[iso]) {
			allPayments = App.recipientLookup[iso].slice(0);
		}

		// define content in container
		function init() {
			// fill title
			const country = App.countries.find(c => c.ISO2 === iso);
			const flagHtml = App.getFlagHtml(iso);
			$('.analysis-country-title')
				.html(`${flagHtml} ${country.NAME} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

			// fill in other text
			$('.money-type-cap').text(moneyFlow === 'd' ? 'Disbursed' : 'Received');
			$('.commit-noun').text(moneyFlow === 'd' ? 'Committed Funds' :
				'Committed Funds to Receive');
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);

			// fill summary text
			const totalCommitted = d3.sum(allPayments, d => d.total_committed);
			const totalSpent = d3.sum(allPayments, d => d.total_spent);
			$('.committed-value').text(App.formatMoney(totalCommitted));
			$('.spent-value').text(App.formatMoney(totalSpent));

			// back button behavior
			$('.back-button').click(() => hasher.setHash(`analysis/${iso}/${moneyFlow}`));

			// start up tabs and table
			initInfoTabs();
			updateInfoTab();
			updateInfoTable();
		}

		// define info table tab behavior
		function initInfoTabs() {
			$('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});
		}
		
		// update the content shwon based on tab chosen
		function updateInfoTab() {
			// make correct tab active
			$(`.funds-tab-container .btn[tab="${currentInfoTab}"]`)
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
			} else if (currentInfoTab === 'country') {
				headerData = [
					{ name: 'Donor', value: 'donor_country' },
					{ name: 'Recipient', value: 'recipient_country' },
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
			} else if (currentInfoTab === 'country') {
				const totalByCountry = {};
				allPayments.forEach((p) => {
					const dc = p.donor_country;
					const rc = p.recipient_country;
					if (!totalByCountry[dc]) totalByCountry[dc] = {};
					if (!totalByCountry[dc][rc]) {
						totalByCountry[dc][rc] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					totalByCountry[dc][rc].total_committed += p.total_committed;
					totalByCountry[dc][rc].total_spent += p.total_spent;
				});
				for (let dc in totalByCountry) {
					for (let rc in totalByCountry[dc]) {
						const dCountry = App.countries.find(c => c.ISO2 === dc);
						const rCountry = App.countries.find(c => c.ISO2 === rc);
						paymentTableData.push({
							donor_country: dCountry ? dCountry.NAME : dc,
							recipient_country: rCountry ? rCountry.NAME : rc,
							total_committed: totalByCountry[dc][rc].total_committed,
							total_spent: totalByCountry[dc][rc].total_spent,
						});
					}
				}
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
			const infoTable = d3.select('.funds-table');
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
			newRows.merge(rows).on('click', (p) => {
				// clicking on a row navigates user to country pair page
				hasher.setHash(`analysis/${p.donor_country}/${p.recipient_country}`);
			});

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
			let columnDefs = [];
			if (currentInfoTab === 'all') {
				columnDefs = [
					{ targets: [0, 1], width: '140px' },
					{ type: 'money', targets: [3, 4], width: '110px' },
				]
			} else if (currentInfoTab === 'country') {
				order = [3, 'desc'];
				columnDefs = [
					{ targets: [0, 1], width: '150px' },
					{ type: 'money', targets: [2, 3], width: '120px' },
				];
			} else if (currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2], width: '120px' }];
			}

			// re-initialize DataTables plugin
			infoDataTable = $('.funds-table').DataTable({
				scrollY: '40vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;
		};

		init();
	};
})();
