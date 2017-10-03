(() => {
	// variables used for info box
	let infoTableHasBeenInit = false;  // whether the info table has been initialized
	let infoDataTable;  // the info data table (DataTable object)
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)
	let isShowingMore = false;
	let currentCountry;  // the current country being shown
	let currentMoneyType;  // the type of money flow for the country chosen (donated, received)
	let currentPayments;  // an array of all payments corresponding to the country chosen

	// initialize info box
	App.initCountryInfoBox = (param = {}) => {
		// define info close button behavior
		if (param.closeFunc) $('.info-close-button').on('click', param.closeFunc);

		// define tab behavior
		$('.info-tab-container .btn').on('click', function changeTab() {
			currentInfoTab = $(this).attr('tab');
			updateInfoTab();
			updateInfoTable();
		});

		$('.info-more-button').click(function toggleContent() {
			isShowingMore = !isShowingMore;
			isShowingMore ? expandInfoBox(updateInfoTable) : shrinkInfoBox();
		});

		updateInfoTab();
	};

	// update content of info box
	App.updateCountryInfoBox = (country, moneyType, payments) => {
		currentCountry = country;
		currentPayments = payments;
		currentMoneyType = moneyType;

		// populate info title
		$('.info-title').text(country.NAME);

		// define "go to analysis" button behavior
		$('.info-analysis-button')
			.html(`Show ${country.NAME} in Analysis Page`)
			.off('click')
			.on('click', () => {
				hasher.setHash(`analysis/${country.ISO2}`);
			});

		// if there are no payments, return
		if (!payments) {
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
		}

		// populate info total value
		const totalValue = d3.sum(payments, d => d.total_spent);
		const valueLabel = (moneyType === 'received') ?
			'Total Received' : 'Total Donated';
		const valueText = App.formatMoney(totalValue);
		$('.info-total-value').html(`${valueLabel}: <b>${valueText}</b>`);

		// update the table, if showing it
		if (isShowingMore) {
			$('.info-content').slideDown();
			updateInfoTable();
		}

		// display content
		$('.info-container').slideDown();
	}

	// update the content shwon based on tab chosen
	function updateInfoTab() {
		// make correct tab active
		$(`.info-tab-container .btn[tab="${currentInfoTab}"]`).addClass('active')
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
				{ name: 'Recipient', value: 'recipient_country' },
				{ name: 'Committed', value: 'total_committed', type: 'money' },
				{ name: 'Disbursed', value: 'total_spent', type: 'money' },
			];
			if (currentMoneyType === 'received') {
				headerData[0] = { name: 'Donor', value: 'donor_country' };
			}
		} else if (currentInfoTab === 'function') {
			headerData = [
				{ name: 'Function', value: 'function' },
				{ name: 'Committed', value: 'total_committed', type: 'money' },
				{ name: 'Disbursed', value: 'total_spent', type: 'money' },
			];
		} else if (currentInfoTab === 'disease') {
			headerData = [
				{ name: 'Disease', value: 'disease' },
				{ name: 'Committed', value: 'total_committed', type: 'money' },
				{ name: 'Disbursed', value: 'total_spent', type: 'money' },
			];
		}

		// define row data
		let paymentTableData = [];
		if (currentInfoTab === 'all') {
			paymentTableData = currentPayments.slice(0);
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
		} else if (currentInfoTab === 'function') {
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
					function: fnp,
					total_committed: totalByFunction[fnp].total_committed,
					total_spent: totalByFunction[fnp].total_spent,
				});
			}
		} else if (currentInfoTab === 'disease') {
			const totalByDisease = {};
			currentPayments.forEach((p) => {
				p.project_disease.forEach((fn) => {
					if (!totalByDisease[fn.p]) {
						totalByDisease[fn.p] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					totalByDisease[fn.p].total_committed += p.total_committed;
					totalByDisease[fn.p].total_spent += p.total_spent;
				});
			});
			for (let fnp in totalByDisease) {
				paymentTableData.push({
					disease: fnp,
					total_committed: totalByDisease[fnp].total_committed,
					total_spent: totalByDisease[fnp].total_spent,
				});
			}
		}


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
		infoDataTable = $('.info-table').DataTable({
			scrollY: '30vh',
			scrollCollapse: true,
			order,
			columnDefs,
		});
		infoTableHasBeenInit = true;		
	};

	// shrinks info box
	function shrinkInfoBox(callback) {
		isShowingMore = false;
		$('.info-more-button .collapse-arrow').removeClass('rotated');
		$('.info-more-button span').text('show more');
		$('.info-content').slideUp();
		$('.info-box').animate({ width: 350 }, callback);
	}

	// expands info box
	function expandInfoBox(callback) {
		isShowingMore = true;
		$('.info-more-button .collapse-arrow').addClass('rotated');
		$('.info-more-button span').text('show less');
		$('.info-content').slideDown();
		$('.info-box').animate({ width: 800 }, callback);
	}
})();
