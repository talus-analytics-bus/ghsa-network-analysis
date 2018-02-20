(() => {
	App.initAnalysisCountry = (iso, moneyType) => {
		// get country information
		const country = App.countries.find(c => c.ISO2 === iso);
		const lookup = (moneyType === 'd') ? App.fundingLookup : App.recipientLookup;
		const color = (moneyType === 'd') ? App.fundColor : App.receiveColor;
		const lightColor = (moneyType === 'd') ? App.fundColorPalette[4] : App.receiveColorPalette[4];

		// initializes the whole page
		function init() {
			// fill title
			const name = App.codeToNameMap.get(iso);
			const flagHtml = country ? App.getFlagHtml(iso) : '';
			$('.analysis-country-title')
				.html(`${flagHtml} ${name} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

			// fill out generic text
			$('.country-name').text(name);
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);
			$('.money-type').text(moneyType === 'd' ? 'disbursed' : 'received');
			$('.money-type-cap').text(moneyType === 'd' ? 'Disbursed' : 'Received');
			$('.money-type-noun').text(moneyType === 'd' ? 'funder' : 'recipient');
			$('.money-type-noun-cap').text(moneyType === 'd' ? 'Funder' : 'Recipient');
			$('.opp-money-type-noun').text(moneyType === 'd' ? 'recipient' : 'funder');
			$('.opp-money-type-verb').text(moneyType === 'd' ? 'received' : 'donated');

			if (moneyType) initDonorOrRecipientProfile();
			else initBasicProfile();
		}

		function initBasicProfile() {
			// calculate total funded and received
			const totalFunded = App.getTotalFunded(iso);
			const totalReceived = App.getTotalReceived(iso);

			// if either funding or receiving is 0, go to non-zero profile
			if (totalFunded > totalReceived) {
				hasher.setHash(`analysis/${iso}/d`);
				return;
			}
			if (totalReceived > totalFunded) {
				hasher.setHash(`analysis/${iso}/r`);
				return;
			}

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
			$('.country-funded-value').text(App.formatMoney(totalFunded));
			$('.country-received-value').text(App.formatMoney(totalReceived));

			// button behavior for getting to donor and recipient profile
			$('.show-donor-btn').click(() => hasher.setHash(`analysis/${iso}/d`));
			$('.show-recipient-btn').click(() => hasher.setHash(`analysis/${iso}/r`));

			// draw charts
			let maxFunded = 0;
			let maxReceived = 0;
			for (const fIso in App.fundingLookup) {
				if (fIso !== 'Not reported') {
					const sum = d3.sum(App.fundingLookup[fIso], d => d.total_spent);
					if (sum > maxFunded) maxFunded = sum;
				}
			}
			for (const rIso in App.recipientLookup) {
				if (rIso !== 'Not reported') {
					const sum = d3.sum(App.recipientLookup[rIso], d => d.total_spent);
					if (sum > maxReceived) maxReceived = sum;
				}
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
			// initialize "go to table" button
			$('.show-table-btn').click(() => {
				hasher.setHash(`analysis/${iso}/${moneyType}/table`);
			});

			// fill out funder/recipient text
			let hasNoData = false;
			const totalFunded = App.getTotalFunded(iso);
			const totalReceived = App.getTotalReceived(iso);
			if (moneyType === 'd') {
				if (!totalFunded) hasNoData = true;

				// fill out "switch profile" text and behavior
				$('.switch-type-button')
					.text('Switch to Recipient Profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/r`));

				$('.country-summary-value').text(App.formatMoney(totalFunded));
			} else if (moneyType === 'r') {
				if (!totalReceived) hasNoData = true;

				// fill out "switch profile" text and behavior
				$('.switch-type-button')
					.text('Switch to Funder Profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/d`));

				$('.country-summary-value').text(App.formatMoney(totalReceived));
			}

			// draw charts
			if (hasNoData) {
				$('.country-flow-summary, .progress-circle-section, .country-chart-container').hide();
				$('.country-flow-summary-empty').slideDown();
				$('.submit-data-btn').click(() => hasher.setHash('submit'))
			} else {
				drawTimeChart();
				drawProgressCircles();
				drawCountryTable();
				drawCategoryChart();
			}

			// display content
			$('.country-flow-content').slideDown();
		}

		function drawTimeChart() {
			// get data
			const timeData = [];
			const fundsByYear = {};
			for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
				fundsByYear[i] = {
					year: i,
					total_committed: 0,
					total_spent: 0,
				};
			}
			lookup[iso].forEach((p) => {
				for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
					fundsByYear[i].total_committed += p.committed_by_year[i];
					fundsByYear[i].total_spent += p.spent_by_year[i];
				}
			});
			for (const y in fundsByYear) {
				timeData.push(fundsByYear[y]);
			}
			App.buildTimeChart('.time-chart-container', timeData, {
				color,
				lightColor,
				moneyType,
			});
		}

		function drawProgressCircles() {
			$('.progress-circle-title .info-img').tooltipster({
				content: 'The <b>percent of committed funds</b> that were disbursed is shown. ' +
					'However, note that not all projects with disbursals have corresponding commitments, ' +
					'so these figures do not take into account all known funding initiatives.',
			});

			const ccs = ['P', 'D', 'R'];
			const fundsByCc = {};
			ccs.forEach((cc) => {
				fundsByCc[cc] = {
					cc,
					total_committed: 0,
					total_spent: 0,
				};
			});
			lookup[iso].forEach((p) => {
				ccs.forEach((cc) => {
					// console.log(p.core_capacities);
					if (p.core_capacities.some(pcc => cc === pcc.charAt(0))) {
						const committed = p.total_committed;
						let spent = p.total_spent;
						if (spent > committed) spent = committed;
						fundsByCc[cc].total_committed += committed;
						fundsByCc[cc].total_spent += spent;
					}
				});
			});
			App.drawProgressCircles('.prevent-circle-chart', fundsByCc.P, color);
			App.drawProgressCircles('.detect-circle-chart', fundsByCc.D, color);
			App.drawProgressCircles('.respond-circle-chart', fundsByCc.R, color);

			const percFormat = d3.format('.0%');
			const fillValueText = (valueSelector, ind) => {
				if (fundsByCc[ind].total_committed) {
					const pValue = fundsByCc[ind].total_spent / fundsByCc[ind].total_committed;
					$(valueSelector).text(percFormat(pValue));
				} else {
					$(valueSelector).parent().text('No funds committed for this core element');
				}
			};

			fillValueText('.prevent-value', 'P');
			fillValueText('.detect-value', 'D');
			fillValueText('.respond-value', 'R');
		}

		function drawCountryTable() {
			if (moneyType === 'd') {
				$('.circle-pack-title').text('Top Recipients of Funds (from Funder)');
			} else {
				$('.circle-pack-title').text('Top Funders Received From');
			}

			// get table data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			const fundedData = [];
			const fundedByCountry = {};
			lookup[iso].forEach((p) => {
				const recIso = p[countryInd];
				if (recIso !== 'Not reported') {
					if (!fundedByCountry[recIso]) {
						fundedByCountry[recIso] = {
							iso: recIso,
							total_committed: 0,
							total_spent: 0,
						};
					}
					fundedByCountry[recIso].total_committed += p.total_committed;
					fundedByCountry[recIso].total_spent += p.total_spent;
				}
			});
			for (const recIso in fundedByCountry) {
				fundedData.push(fundedByCountry[recIso]);
			}
			Util.sortByKey(fundedData, 'total_spent', true);

			// draw table
			const firstColLabel = (moneyType === 'd') ? 'Recipient' : 'Funder';
			$('.country-table thead tr td:first-child').text(firstColLabel);

			const rows = d3.select('.country-table tbody').selectAll('tr')
				.data(fundedData.slice(0, 10))
				.enter().append('tr')
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							if (moneyType === 'd') {
								hasher.setHash(`analysis/${iso}/${d.iso}`);
							} else {
								hasher.setHash(`analysis/${d.iso}/${iso}`);
							}
						}
					});
			rows.append('td').html((d) => {
				const recCountry = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = recCountry ? App.getFlagHtml(d.iso) : '';
				let cName = d.iso;
				if (App.codeToNameMap.has(d.iso)) {
					cName = App.codeToNameMap.get(d.iso);
				}
				const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso}')`;
				return `<div class="flag-container">${flagHtml}</div>` +
					'<div class="name-container">' +
					`<span onclick="${onClickStr}">${cName}</span>` +
					'</div>';
			});

			rows.append('td').text(d => App.formatMoney(d.total_committed));
			rows.append('td').text(d => App.formatMoney(d.total_spent));
		}

		function drawCategoryChart() {
			// get data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			const catData = [];
			const fundsByCat = {};
			lookup[iso].forEach((p) => {
				const recIso = p[countryInd];
				const catValues = p.core_capacities;
				catValues.forEach((c) => {
					if (!fundsByCat[c]) fundsByCat[c] = {};
					if (!fundsByCat[c][recIso]) {
						fundsByCat[c][recIso] = {
							iso: recIso,
							total_committed: 0,
							total_spent: 0,
						};
					}
					fundsByCat[c][recIso].total_committed += p.total_committed;
					fundsByCat[c][recIso].total_spent += p.total_spent;
				});
			});
			App.capacities.forEach((cap) => {
				if (cap.id !== 'General IHR Implementation') {
					if (fundsByCat[cap.id]) {
						const countries = [];
						let totalCommitted = 0;
						let totalSpent = 0;
						for (const recIso in fundsByCat[cap.id]) {
							countries.push(fundsByCat[cap.id][recIso]);
							totalCommitted += fundsByCat[cap.id][recIso].total_committed;
							totalSpent += fundsByCat[cap.id][recIso].total_spent;
						}
						catData.push({
							id: cap.id,
							name: cap.name,
							children: countries,
							total_committed: totalCommitted,
							total_spent: totalSpent,
						});
					} else {
						catData.push({
							id: cap.id,
							name: cap.name,
							children: [],
							total_committed: 0,
							total_spent: 0,
						});
					}
				}
			});
			Util.sortByKey(catData, 'total_spent', true);

			App.buildCategoryChart('.category-chart-container', catData, {
				moneyType,
			});
		}

		init();
	};
})();
