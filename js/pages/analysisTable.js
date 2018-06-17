(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)

	App.initAnalysisTable = (iso, moneyFlow) => {
		const country = App.countries.find(c => c.ISO2 === iso);
		const name = App.codeToNameMap.get(iso);
		const isGhsaPage = iso === 'ghsa';

		// find all payments funded or received by this country
		App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });
		let allPayments = [];
		if (moneyFlow === 'd' && App.fundingLookup[iso]) {
			allPayments = App.fundingLookup[iso].slice(0);
		}
		if (moneyFlow === 'r' && App.recipientLookup[iso]) {
			allPayments = App.recipientLookup[iso].slice(0);
		}

		// define content in container
		function init() {
			App.setSources();
			// fill title
			const flagHtml = country ? App.getFlagHtml(iso) : '';
			$('.analysis-country-title')
			.html(`${flagHtml} ${name} ${flagHtml}`)
			.on('click', () => hasher.setHash(`analysis/${iso}`));

			// fill in other text
			$('.money-type-noun').text(moneyFlow === 'd' ? 'Funder' : 'Recipient');
			$('.opp-money-type-noun').text(moneyFlow === 'd' ? 'Recipient' : 'Funder');
			$('.money-type-cap').text(moneyFlow === 'd' ? 'Disbursed' : 'Received');
			$('.commit-noun').text(moneyFlow === 'd' ? 'Committed Funds' :
				'Committed Funds to Receive');
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);

			// fill summary text
			const financialPayments = App.getFinancialProjectsWithAmounts(allPayments, moneyFlow, iso)
			const totalCommitted = d3.sum(financialPayments, d => d.total_committed);
			const totalSpent = d3.sum(financialPayments, d => d.total_spent);
			$('.committed-value').text(App.formatMoney(totalCommitted));
			$('.spent-value').text(App.formatMoney(totalSpent));

			// back button behavior
			$('.back-button').click(() => hasher.setHash(`analysis/${iso}/${moneyFlow}`));

			// start up tabs and table
			initInfoTabs();
			updateInfoTab();
			updateInfoTable();
			initGhsaToggle();
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`input[type=radio][name="ind-table"][ind="ghsa"]`).prop('checked',true);
			}

			$('.analysis-table .ind-type-filter .radio-option').off('click');
			$('.analysis-table .ind-type-filter .radio-option').click(function updateIndType() {
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';
				
				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
				// hasher.setHash(`analysis/${iso}/${moneyFlow}/table${App.showGhsaOnly ? '?ghsa_only=true' : '?ghsa_only=false'}`);
			});

			// if on the special GHSA page, don't show this toggle
			if (isGhsaPage) {
				$('.ghsa-toggle-options').remove();
				d3.select('.analysis-country-title').append('img')
				.attr('class', 'ghsa-info-img info-img')
				.attr('src','img/info.png');
			}

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
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

			const expectedName = App.codeToNameMap.get(iso);
			const expectedNameField = moneyFlow === 'd' ? 'donor_name' : 'recipient_name';
			const expectedNameOrigField = moneyFlow === 'd' ? 'donor_name_orig' : 'recipient_name_orig';

			function getMoneyCellValue (d, moneyField) { 
				const allValuesUnspec = d.all_unspec === true;
				const noValueReported = d.no_value_reported === true;
				if (noValueReported || allValuesUnspec) return 'Specific amount unknown';
				else if (iso === 'ghsa' || expectedName === d[expectedNameField]) 
					return d[moneyField];
				else return 'Specific amount unknown'; 
			};

			// define column data
			let headerData = [];
			if (currentInfoTab === 'all') {
				headerData = [
				{ name: 'Funder', value: 'donor_name', valueFunc: (p) => { return p.donor_name_orig || p.donor_name; } },
				{ name: 'Recipient', value: 'recipient_name', valueFunc: (p) => { return p.recipient_name_orig || p.recipient_name; } },
				{ name: 'Project Name', value: 'project_name' },
				{ name: 'Committed', value: 'total_committed', type: 'money', valueFunc: (d) => { return getMoneyCellValue(d, 'total_committed'); } },
				{ name: 'Disbursed', value: 'total_spent', type: 'money', valueFunc: (d) => { return getMoneyCellValue(d, 'total_spent'); } },
				];
			} else if (currentInfoTab === 'country') {
				headerData = [
				{ name: 'Funder', value: 'donor_name', valueFunc: (p) => { return p.donor_name_orig || p.donor_name; } },
				{ name: 'Recipient', value: (d) => {
					return d.recipient_name_orig || d.recipient_name;
					if (App.codeToNameMap.has(d.recipient_country)) {
						return App.codeToNameMap.get(d.recipient_country);
					}
					return d.recipient_country;
				} },
				{ name: 'Committed', value: 'total_committed', type: 'money', valueFunc: (d) => { return getMoneyCellValue(d, 'total_committed'); } },
				{ name: 'Disbursed', value: 'total_spent', type: 'money', valueFunc: (d) => { return getMoneyCellValue(d, 'total_spent'); } },
				// { name: 'Committed', value: 'total_committed', type: 'money', valueFunc: (d) => { if (expectedName === d[expectedNameField]) return d.total_committed; else return 'Specific amount unknown'} },
				// { name: 'Disbursed', value: 'total_spent', type: 'money', valueFunc: (d) => { if (expectedName === d[expectedNameField]) return d.total_spent; else return 'Specific amount unknown'} },
				];
			} else if (currentInfoTab === 'ce') {
				headerData = [
				{
					name: 'Core Element',
					value: (d) => {
						if (d.ce === 'P') return 'Prevent';
						if (d.ce === 'D') return 'Detect';
						if (d.ce === 'R') return 'Respond';
						if (d.ce === 'O') return 'Other';
						if (d.ce === 'General IHR Implementation') return 'General IHR Implementation <img class="general-ihr-info-img info-img" src="img/info.png" />';
						return 'None';
					},
				},
				{ name: 'Committed', value: 'total_committed', type: 'money' },
				{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				{ name: 'In-kind Contributions', value: 'total_other', type: 'number' },
				];
			} else if (currentInfoTab === 'cc') {
				headerData = [
				{
					name: 'Core Capacity',
					value: (d) => {
						const cap = App.capacities.find(cc => cc.id === d.cc);
						if (cap && cap.name === 'General IHR Implementation') return cap.name + ' <img class="general-ihr-info-img info-img" src="img/info.png" />';
						return cap ? cap.name : d.cc;
					},
				},
				{ name: 'Committed', value: 'total_committed', type: 'money', valueFunc: (d) => { if (d.unspecified) return 'Specific amount unknown'; else return d.total_committed; }},
				{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				{ name: 'In-kind Contributions', value: 'total_other', type: 'number' },
				];
			} else if (currentInfoTab === 'inkind') {
				headerData = [
				{ name: 'Provider', value: 'donor_name', valueFunc: (p) => { return p.donor_name_orig || p.donor_name; } },
				{ name: 'Recipient', value: 'recipient_name', value2: 'recipient_name_orig', valueFunc: (p) => { return p.recipient_name_orig || p.recipient_name; }  },
				// { name: 'Support Type', value: 'assistance_type' },
				{ name: 'Description', value: 'project_name' },
				];
				// headerData = [
				// { name: 'Provider', value: 'donor_name', value2: 'donor_name_orig' },
				// { name: 'Recipient', value: 'recipient_name', value2: 'recipient_name_orig' },
				// { name: 'Name', value: 'project_name' },
				// { name: 'Description', value: 'project_description' },
				// ];
			} 

			// define row data
			let paymentTableData = [];
			allPayments = App.getProjectsIncludingGroups(App.fundingData, moneyFlow, iso);
			if (iso === 'ghsa') {
				allPayments = Util.uniqueCollection(allPayments, 'project_id');
			}
			if (currentInfoTab === 'all') {
				paymentTableData = allPayments.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support' && payment.assistance_type.toLowerCase() !== 'other support');
			} else if (currentInfoTab === 'country') {
				const totalByCountry = {};
				allPayments = App.getProjectsIncludingGroups(App.fundingData, moneyFlow, iso);
				allPayments.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support' && payment.assistance_type.toLowerCase() !== 'other support').forEach((p) => {
					const dc = p.donor_name_orig || p.donor_name;
					// const dc = p.donor_code;
					let rc = p.recipient_country;
					if (rc === 'Not reported') rc = p.recipient_name;
					if (p.recipient_name_orig !== undefined) rc = p.recipient_name_orig
						else rc = p.recipient_name;
					if (!totalByCountry[dc]) totalByCountry[dc] = {};
					if (!totalByCountry[dc][rc]) {
						totalByCountry[dc][rc] = {
							total_committed: 0,
							total_spent: 0,
							all_unspec: true,
						};
					}
					totalByCountry[dc][rc].total_committed += p.total_committed;
					totalByCountry[dc][rc].total_spent += p.total_spent;
					if (p.no_value_reported !== true) totalByCountry[dc][rc].all_unspec = false;
				});
				for (const dc in totalByCountry) {
					for (const rc in totalByCountry[dc]) {
						paymentTableData.push({
							donor_code: dc,
							donor_name: dc,
							recipient_country: rc,
							recipient_name: rc,
							total_committed: totalByCountry[dc][rc].total_committed,
							total_spent: totalByCountry[dc][rc].total_spent,
							all_unspec: totalByCountry[dc][rc].all_unspec,
						});
					}
				}
			} else if (currentInfoTab === 'ce') {
				const totalByCe = {};
				const coreElements = ['P', 'D', 'R', 'O', 'General IHR Implementation'];
				coreElements.concat('None').forEach((ce) => {
					totalByCe[ce] = {
						total_committed: 0,
						total_spent: 0,
						total_other: 0,
					};
				});
				allPayments.forEach((p) => {
					let hasACe = false;
					coreElements.forEach((ce) => {
						const hasCe = p.core_capacities.some((cc) => {
							if (ce === 'O') {
								const firstThree = cc.slice(0, 3);
								return firstThree === 'PoE' || firstThree === 'CE' || firstThree === 'RE';
							} else if (ce === 'General IHR Implementation') {
								return cc === 'General IHR Implementation';
							}
							return cc.slice(0, 2) === `${ce}.`;
						});
						if (hasCe) {
							hasACe = true;
							totalByCe[ce].total_committed += p.total_committed;
							totalByCe[ce].total_spent += p.total_spent;
							totalByCe[ce].total_other += (p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support") ? 1 : 0;
						}
					});
					if (!hasACe) {
						totalByCe.None.total_committed += p.total_committed;
						totalByCe.None.total_spent += p.total_spent;
						totalByCe.None.total_other += (p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support") ? 1 : 0;
					}
				});
				for (const ce in totalByCe) {
					const nonZero = _.values(totalByCe[ce]).some(d => d > 0);
					if (nonZero)
					paymentTableData.push({
						ce,
						total_committed: totalByCe[ce].total_committed,
						total_spent: totalByCe[ce].total_spent,
						total_other: totalByCe[ce].total_other,
					});
				}
			} else if (currentInfoTab === 'cc') {
				const totalByCc = {};
				App.capacities.concat({ id: 'None' }).forEach((cc) => {
					totalByCc[cc.id] = {
						total_committed: 0,
						total_spent: 0,
						total_other: 0,
					};
				});
				allPayments.forEach((p) => {
					p.core_capacities.forEach((cc) => {
						if (totalByCc[cc]) {
							totalByCc[cc].total_committed += p.total_committed;
							totalByCc[cc].total_spent += p.total_spent;
							totalByCc[cc].total_other += (p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support") ? 1 : 0;
						}
					});
					if (!p.core_capacities.length) {
						totalByCc.None.total_committed += p.total_committed;
						totalByCc.None.total_spent += p.total_spent;
						totalByCc.None.total_other += (p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support") ? 1 : 0;
					}
				});
				for (const cc in totalByCc) {
					const nonZero = _.values(totalByCc[cc]).some(d => d > 0);
					if (nonZero)
						paymentTableData.push({
							cc,
							total_committed: totalByCc[cc].total_committed,
							total_spent: totalByCc[cc].total_spent,
							total_other: totalByCc[cc].total_other,
						});
				}
			} else if (currentInfoTab === 'inkind') {
				// paymentTableData = allPayments.slice(0).filter(payment => payment.assistance_type.toLowerCase() === 'in-kind support');
				paymentTableData = App.getInkindSupportProjects(App.fundingData, moneyFlow, iso);
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
			.classed('inkind-cell', d => d.value === 'total_other')
			.text(d => d.name);

			const infoTbody = infoTable.select('tbody');
			const rows = infoTbody.selectAll('tr')
			.data(paymentTableData);
			rows.exit().remove();
			const newRows = rows.enter().append('tr');
			newRows.merge(rows).on('click', (p) => {
				if ((currentInfoTab !== 'cc' && currentInfoTab !== 'ce' && p.recipient_country !== "Not reported")) {
					// clicking on a row navigates user to country pair page
					hasher.setHash(`analysis/${p.donor_code}/${p.recipient_country}`);
				}
			});

			const cells = newRows.merge(rows).selectAll('td')
			.data(d => headerData.map(c => ({ rowData: d, colData: c })));
			cells.exit().remove();
			cells.enter().append('td')
			.merge(cells)
			.classed('money-cell', d => d.colData.type === 'money')
			.classed('inkind-cell', d => d.colData.value === 'total_other')
			.html(function(d) {
				let cellValue = '';
				if (d.colData.valueFunc) {
					cellValue = d.colData.valueFunc(d.rowData);
				} else if (typeof d.colData.value === 'function') {
					cellValue = d.colData.value(d.rowData);
				} else {
					cellValue = d.rowData[d.colData.value];
				}
				let dataSortValue = cellValue;
				if (cellValue === 'Specific amount unknown') {
					d3.select(this).attr('data-sort', -1000);
					return cellValue;
				}
				if (d.colData.type === 'money') {
					d3.select(this).attr('data-sort', App.formatMoneyFull(cellValue));
					return App.formatMoneyFull(cellValue);
				}

				
				return cellValue;
			});

			// define DataTables plugin parameters
			let order = [4, 'desc'];
			let columnDefs = [];
			if (currentInfoTab === 'all') {
				columnDefs = [
				{ targets: [0, 1], width: '140px' },
				{ type: 'money', targets: [3, 4], width: '110px' },
				];
			} else if (currentInfoTab === 'country') {
				order = [3, 'desc'];
				columnDefs = [
				{ targets: [0, 1], width: '150px' },
				{ type: 'money', targets: [2, 3], width: '120px' },
				];
			} else if (currentInfoTab === 'ce' || currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2, 3], width: '120px' }];
			} else if (currentInfoTab === 'inkind') {
				order = [1, 'desc'];
				columnDefs = [{ targets: [2], width: '450px' }];
			} 

			// re-initialize DataTables plugin
			infoDataTable = $('.funds-table').DataTable({
				scrollY: '40vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;
			
			// Tooltip for General IHR Implementation
			$('.funds-table').find('.general-ihr-info-img').tooltipster({
				interactive: true,
				content: App.generalIhrText,
			});
		}

		init();
	};
})();
