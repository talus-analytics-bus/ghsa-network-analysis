(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)

	App.initAnalysisPair = (fundIso, recIso) => {
		// define content in container
		const content = d3.select('.analysis-pair-content');
		const $content = $('.analysis-pair-content');


		App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

		// get country info
		const donorCountry = App.countries.find(c => c.ISO2 === fundIso);
		const recipientCountry = App.countries.find(c => c.ISO2 === recIso);
		const donorName = App.codeToNameMap.get(fundIso);
		const recipientName = App.codeToNameMap.get(recIso);

		// get payments between the countries
		let allPayments = [];
		if (App.fundingLookup[fundIso]) {
			allPayments = App.fundingLookup[fundIso].filter(p =>
				p.recipient_country === recIso);
		}

		function init() {
            App.setSources();
			// fill title
			const fundFlagHtml = donorCountry ? App.getFlagHtml(fundIso) : '';
			const recFlagHtml = recipientCountry ? App.getFlagHtml(recIso) : '';
			const fundOnClick = `hasher.setHash('analysis/${fundIso}/d')`;
			const recOnClick = `hasher.setHash('analysis/${recIso}/r')`;
			const donorNameHtml = `<span onclick="${fundOnClick}">${donorName}</span>`;
			const recipientNameHtml = `<span onclick="${recOnClick}">${recipientName}</span>`;
			$content.find('.analysis-country-title').html(`${fundFlagHtml} ${donorNameHtml} ` +
				`<div class="arrow-html">&rarr;</div> ${recipientNameHtml} ${recFlagHtml}`);

			// fill out generic text
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);

			// fill summary text
			const totalCommitted = d3.sum(allPayments, d => d.total_committed);
			const totalSpent = d3.sum(allPayments, d => d.total_spent);
			$('.committed-value').text(App.formatMoney(totalCommitted));
			$('.spent-value').text(App.formatMoney(totalSpent));

			// getting back buttons
			$('.donor-button').click(() => hasher.setHash(`analysis/${fundIso}/d`));
			$('.recipient-button').click(() => hasher.setHash(`analysis/${recIso}/r`));

			// define info table tab behavior
			$content.find('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});

			// fill table content
			updateInfoTab();
			updateInfoTable();
			initGhsaToggle();
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`input[type=radio][name="ind-pair"][ind="ghsa"]`).prop('checked',true);
			}

			$('.analysis-table.analysis-pair .ind-type-filter .radio-option').off('click');
			$('.analysis-table.analysis-pair .ind-type-filter .radio-option').click(function updateIndType() {
				console.log('toggle switch')
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';
				
				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
				// hasher.setHash(`analysis/${iso}/${moneyFlow}/table${App.showGhsaOnly ? '?ghsa_only=true' : '?ghsa_only=false'}`);
			});

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
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
					{ name: 'Funder', value: 'donor_name' },
					{ name: 'Recipient', value: 'recipient_name' },
					{ name: 'Name', value: 'project_name' },
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				];
			} else if (currentInfoTab === 'cc') {
				headerData = [
					{
						name: 'Core Capacity',
						value: (d) => {
							const cap = App.capacities.find(cc => cc.id === d.cc);
							return cap ? cap.name : '';
						},
					},
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
					p.core_capacities.forEach((cc) => {
						if (!totalByCc[cc]) {
							totalByCc[cc] = {
								total_committed: 0,
								total_spent: 0,
							};
						}
						totalByCc[cc].total_committed += p.total_committed;
						totalByCc[cc].total_spent += p.total_spent;
					});
				});
				for (const cc in totalByCc) {
					paymentTableData.push({
						cc,
						total_committed: totalByCc[cc].total_committed,
						total_spent: totalByCc[cc].total_spent,
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
					let cellValue = '';
					if (typeof d.colData.value === 'function') {
						cellValue = d.colData.value(d.rowData);
					} else {
						cellValue = d.rowData[d.colData.value];
					}
					if (d.colData.type === 'money') return App.formatMoneyFull(cellValue);
					return cellValue;
				});

			// define DataTables plugin parameters
			let order = [];
			let columnDefs = [];
			if (currentInfoTab === 'all') {
				order = [4, 'desc'];
				columnDefs = [{ type: 'money', targets: [3, 4], width: '120px' }];
			} else if (currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2], width: '120px' }];
			}

			// re-initialize DataTables plugin
			infoDataTable = $content.find('.funds-table').DataTable({
				scrollY: '30vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;
		}

		init();
	};
})();
