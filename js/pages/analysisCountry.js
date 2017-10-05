(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)
	let currentMoneyType;  // the type of money flow for the country chosen (donated, received)
	let currentPayments;  // an array of all payments corresponding to the country chosen

	App.initAnalysisCountry = (iso) => {
		// find all payments funded or received by this country
		let allPayments = [];
		if (App.fundingLookup[iso]) allPayments = App.fundingLookup[iso].slice(0);
		if (App.recipientLookup[iso]) {
			allPayments = allPayments.concat(App.recipientLookup[iso].filter((p) => {
				return p.donor_country !== iso;
			}));
		}

		// initializes the whole page
		function init() {
			// define tab behavior
			$('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});

			updateInfoTab();
			updateInfoTable();


			// if there are no payments, return
			/*if (!payments) {
				const valueText = (moneyType === 'received') ? 
					'No data for payments received by this country' :
					'No data for money donated by this country';
				$('.info-total-value').html(valueText);
				shrinkInfoBox();
				$('.info-more-button-container').slideUp();
				$('.info-container').slideDown();
				return;
			} else {
				$('.info-more-button-container').slideDown();
			}*/


			const country = App.countries.find(c => c.ISO2 === iso);
			$('.analysis-country-title').text(country.NAME);
			drawCirclePacks();
		}
		
		// update the content shwon based on tab chosen
		function updateInfoTab() {
			// make correct tab active
			$(`.funds-tab-container .btn[tab="${currentInfoTab}"]`).addClass('active')
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
				if (currentMoneyType === 'received') {
					currentPayments.forEach((p) => {
						if (!totalByCountry[p.donor_country]) {
							totalByCountry[p.donor_country] = {
								total_committed: 0,
								total_spent: 0,
							};
						}
						totalByCountry[p.donor_country].total_committed += p.total_committed;
						totalByCountry[p.donor_country].total_spent += p.total_spent;
					});
					for (let iso in totalByCountry) {
						const country = App.countries.find(c => c.ISO2 === iso);
						paymentTableData.push({
							donor_country: country ? country.NAME : iso,
							total_committed: totalByCountry[iso].total_committed,
							total_spent: totalByCountry[iso].total_spent,
						});
					}
				} else {
					currentPayments.forEach((p) => {
						if (!totalByCountry[p.recipient_country]) {
							totalByCountry[p.recipient_country] = {
								total_committed: 0,
								total_spent: 0,
							};
						}
						totalByCountry[p.recipient_country].total_committed += p.total_committed;
						totalByCountry[p.recipient_country].total_spent += p.total_spent;
					});
					for (let iso in totalByCountry) {
						const country = App.countries.find(c => c.ISO2 === iso);					
						paymentTableData.push({
							recipient_country: country ? country.NAME : iso,
							total_committed: totalByCountry[iso].total_committed,
							total_spent: totalByCountry[iso].total_spent,
						});
					}
				}
			} else if (currentInfoTab === 'cc') {
				const totalByFunction = {};
				currentPayments.forEach((p) => {
					p.project_function.forEach((fn) => {
						if (!totalByFunction[fn.p]) {
							totalByFunction[fn.p] = {
								total_committed: 0,
								total_spent: 0,
							};
						}
						totalByFunction[fn.p].total_committed += p.total_committed;
						totalByFunction[fn.p].total_spent += p.total_spent;
					});
				});
				for (let fnp in totalByFunction) {
					paymentTableData.push({
						cc: fnp,
						total_committed: totalByFunction[fnp].total_committed,
						total_spent: totalByFunction[fnp].total_spent,
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
			if (currentInfoTab !== 'all') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2] }];
			}

			// re-initialize DataTables plugin
			infoDataTable = $('.funds-table').DataTable({
				scrollY: '30vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;		
		};

		// draws circle pack charts
		function drawCirclePacks() {
			if (App.fundingLookup[iso]) {
				const fundedData = [];
				const fundedByCountry = {};
				App.fundingLookup[iso].forEach((p) => {
					if (!fundedByCountry[p.recipient_country]) {
						fundedByCountry[p.recipient_country] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					fundedByCountry[p.recipient_country].total_committed += p.total_committed;
					fundedByCountry[p.recipient_country].total_spent += p.total_spent;
				});
				App.countries.forEach((c) => {
					if (fundedByCountry[c.ISO2]) {
						const cCopy = Object.assign({}, c);
						cCopy.total_committed = fundedByCountry[c.ISO2].total_committed;
						cCopy.total_spent = fundedByCountry[c.ISO2].total_spent;
						fundedData.push(cCopy);
					}
				});
				App.buildCirclePack('.country-funded-container', fundedData, {
					tooltipLabel: 'Total Funded',
					colors: ['#c6dbef', '#084594'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.country-funded-description')
					.html('<i>There are no data for countries funded by this country.</i>');
			}

			if (App.recipientLookup[iso]) {
				const receivedData = [];
				const receivedByCountry = {};
				App.recipientLookup[iso].forEach((p) => {
					if (!receivedByCountry[p.donor_country]) {
						receivedByCountry[p.donor_country] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					receivedByCountry[p.donor_country].total_committed += p.total_committed;
					receivedByCountry[p.donor_country].total_spent += p.total_spent;
				});
				App.countries.forEach((c) => {
					if (receivedByCountry[c.ISO2]) {
						const cCopy = Object.assign({}, c);
						cCopy.total_committed = receivedByCountry[c.ISO2].total_committed;
						cCopy.total_spent = receivedByCountry[c.ISO2].total_spent;
						receivedData.push(cCopy);
					}
				});
				App.buildCirclePack('.country-received-container', receivedData, {
					tooltipLabel: 'Total Received',
					colors: ['#feedde', '#8c2d04'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.country-received-description')
					.html('<i>There are no data for funds received by this country.</i>');
			}
		}

		init();
	};
})();
