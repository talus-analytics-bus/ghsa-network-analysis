(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)
	let currentMoneyType;  // the type of money flow for the country chosen (donated, received)
	let currentPayments;  // an array of all payments corresponding to the country chosen

	App.initAnalysisCountry = (iso, moneyType) => {
		// get country information
		const country = App.countries.find(c => c.ISO2 === iso);

		// define content in container
		const content = d3.select('.analysis-country-content');
		const $content = $('.analysis-country-content');

		// find all payments funded or received by this country
		let allPayments = [];
		if (moneyType === 'd' && App.fundingLookup[iso]) {
			allPayments = App.fundingLookup[iso].slice(0);
		}
		if (moneyType === 'r' && App.recipientLookup[iso]) {
			allPayments = App.recipientLookup[iso].slice(0);
		}

		// initializes the whole page
		function init() {

			// fill title
			const flagHtml = App.getFlagHtml(iso);
			$content.find('.analysis-country-title')
				.html(`${flagHtml} ${country.NAME} ${flagHtml}`);

			if (moneyType) initDonorOrRecipientProfile();
			else initBasicProfile();
		}

		function initBasicProfile() {
			// fill details
			$('.country-region').text(country.regionName);
			$('.country-subregion').text(country.subRegionName);
			if (country.intermediateRegionName) {
				$('.country-intermediate').text(country.intermediateRegionName);
			} else {
				$('.country-intermediate').closest('.country-details-row').hide();
			}
			$('.country-population').text(d3.format(',')(country.POP2005));

			// fill summary values
			const totalFunded = App.getTotalFunded(iso);
			const totalReceived = App.getTotalReceived(iso);
			$content.find('.country-funded-value').text(App.formatMoney(totalFunded));
			$content.find('.country-received-value').text(App.formatMoney(totalReceived));

			// button behavior for getting to donor and recipient profile
			$('.show-donor-btn').click(() => hasher.setHash(`analysis/${iso}/d`));
			$('.show-recipient-btn').click(() => hasher.setHash(`analysis/${iso}/r`));

			// draw charts
			let maxFunded = 0;
			let maxReceived = 0;
			for (let iso in App.fundingLookup) {
				const sum = d3.sum(App.fundingLookup[iso], d => d.total_spent);
				if (sum > maxFunded) maxFunded = sum;
			}
			for (let iso in App.recipientLookup) {
				const sum = d3.sum(App.recipientLookup[iso], d => d.total_spent);
				if (sum > maxReceived) maxReceived = sum;
			}
			const relPercFunded = totalFunded / maxFunded;
			const relPercReceived = totalReceived / maxReceived;
			App.drawValueSquares('.donor-squares', relPercFunded, App.fundColor, {
				right: true,
			});
			App.drawValueSquares('.recipient-squares', relPercReceived, App.receiveColor);

			// display content
			$('.country-summary-content').slideDown();
		}

		function initDonorOrRecipientProfile() {
			initInfoTabs();
			updateInfoTab();

			// fill out title and description for circle pack; draw circle pack
			if (moneyType === 'd') {
				drawDonorCirclePack();
			} else if (moneyType === 'r') {
				drawRecipientCirclePack();
			}

			// display content
			$('.country-funds-content').slideDown();
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

		// draws circle pack charts
		function drawDonorCirclePack() {
			$('.circle-pack-title').text('Countries Donated To');

			if (App.fundingLookup[iso]) {
				$('.circle-pack-description').text('The plot below displays ' +
					'the countries this country has funded.');

				// get data
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
				App.buildCirclePack('.circle-pack-container', fundedData, {
					tooltipLabel: 'Total Funded',
					colors: ['#c6dbef', '#084594'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.circle-pack-description')
					.html('<i>There are no data for countries funded by this country.</i>');
			}
		}

		function drawRecipientCirclePack() {
			$('.circle-pack-title').text('Countries Received From');

			if (App.recipientLookup[iso]) {
				$('.circle-pack-description').text('The plot below displays ' +
					'the countries this country has received money from.');

				// get data
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
				App.buildCirclePack('.circle-pack-container', receivedData, {
					tooltipLabel: 'Total Received',
					colors: ['#feedde', '#8c2d04'],
					onClick: iso => hasher.setHash(`analysis/${iso}`),
				});
			} else {
				d3.select('.circle-pack-description')
					.html('<i>There are no data for funds received by this country.</i>');
			}
		}

		init();
	};
})();
