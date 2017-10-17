(() => {
	App.initAnalysisCountry = (iso, moneyType) => {
		// get country information
		const country = App.countries.find(c => c.ISO2 === iso);
		const name = App.codeToNameMap.get(iso);
		const lookup = (moneyType === 'd') ? App.fundingLookup : App.recipientLookup;
		const color = (moneyType === 'd') ? App.fundColor : App.receiveColor;
		const lightColor = (moneyType === 'd') ? App.fundColorPalette[2] : App.receiveColorPalette[2];

		// initializes the whole page
		function init() {
			// fill title
			const flagHtml = country ? App.getFlagHtml(iso) : '';
			$('.analysis-country-title')
				.html(`${flagHtml} ${name} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

			// fill out generic text
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);
			$('.money-type').text(moneyType === 'd' ? 'disbursed' : 'received');
			$('.money-type-cap').text(moneyType === 'd' ? 'Disbursed' : 'Received');
			$('.money-type-noun').text(moneyType === 'd' ? 'funder' : 'recipient');
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
			for (let iso in App.fundingLookup) {
				if (iso !== 'Not reported') {
					const sum = d3.sum(App.fundingLookup[iso], d => d.total_spent);
					if (sum > maxFunded) maxFunded = sum;
				}
			}
			for (let iso in App.recipientLookup) {
				if (iso !== 'Not reported') {
					const sum = d3.sum(App.recipientLookup[iso], d => d.total_spent);
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

			// fill out title and description for circle pack; draw circle pack
			if (moneyType === 'd') {
				// if country has received funds, include "switch to recipient profile" button
				const totalReceived = App.getTotalReceived(iso);
				if (totalReceived) {
					$('.switch-type-button')
						.text('Switch to Recipient Profile')
						.on('click', () => hasher.setHash(`analysis/${iso}/r`));
				} else {
					$('.switch-type-button').hide();
				}

				// fill summary text
				const totalFunded = App.getTotalFunded(iso);
				$('.country-summary-value').text(App.formatMoney(totalFunded));
			} else if (moneyType === 'r') {
				// if country has donated funds, include "switch to donor profile" button
				const totalFunded = App.getTotalFunded(iso);
				if (totalFunded) {
					$('.switch-type-button')
						.text('Switch to Funder Profile')
						.on('click', () => hasher.setHash(`analysis/${iso}/d`));
				} else {
					$('.switch-type-button').hide();
				}

				// fill summary text
				const totalReceived = App.getTotalReceived(iso);
				$('.country-summary-value').text(App.formatMoney(totalReceived));
			}

			// draw charts
			drawTimeChart();
			drawProgressCircles();
			drawCountryTable();

			// display content
			$('.country-flow-content').slideDown();

			drawCategoryChart();
		}

		function drawTimeChart() {
			// get data
			if (lookup[iso]) {
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
				for (let y in fundsByYear) {
					timeData.push(fundsByYear[y]);
				}
				App.buildTimeChart('.time-chart-container', timeData, {
					color,
					lightColor,
					moneyType,
				});
			}
		}

		function drawProgressCircles() {
			$('.progress-circle-title .info-img').tooltipster({
				content: 'The <b>percent of committed funds</b> that were disbursed is shown. ' +
					'Note that not all projects with disbursals have corresponding commitments, ' +
					'so these figures do not take into account all known funding initiatives.',
			});

			const ccs = ['P', 'D', 'R'];
			if (lookup[iso]) {
				const pData = [];
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
				function fillValueText(valueSelector, ind) {
					if (fundsByCc[ind].total_committed) {
						const pValue = fundsByCc[ind].total_spent / fundsByCc[ind].total_committed;
						$(valueSelector).text(percFormat(pValue));
					} else {
						$(valueSelector).parent().text('No funds committed for this core element');
					}
				}

				fillValueText('.prevent-value', 'P');
				fillValueText('.detect-value', 'D');
				fillValueText('.respond-value', 'R');
			} else {

			}
		}

		function drawCountryTable() {
			if (moneyType === 'd') {
				$('.circle-pack-title').text('Top Recipients of Funds');
			} else {
				$('.circle-pack-title').text('Top Funders Received From');
			}

			const blues = ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff'];
			const oranges = ['#993404', '#d95f0e', '#fe9929', '#fed98e', '#ffffd4'];
			const colors = (moneyType === 'd') ? blues : oranges;

			// get table data
			if (lookup[iso]) {
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
				for (let iso in fundedByCountry) {
					fundedData.push(fundedByCountry[iso]);
				}
				Util.sortByKey(fundedData, 'total_spent', true);

				// draw table
				let firstColLabel = (moneyType === 'd') ? 'Recipient' : 'Funder';
				$('.country-table thead tr td:first-child').text(firstColLabel);

				const rows = d3.select('.country-table tbody').selectAll('tr')
					.data(fundedData.slice(0, 10))
					.enter().append('tr')
						//.style('background-color', (d, i) => colors[Math.floor(i / 2)])
						//.style('color', (d, i) => (i < 4) ? '#fff' : 'black')
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
					const country = App.countries.find(c => c.ISO2 === d.iso);
					const flagHtml = country ? App.getFlagHtml(d.iso) : '';
					const name = App.codeToNameMap.get(d.iso);
					return `<div class="flag-container">${flagHtml}</div>` +
						`<div class="name-container">${name}</div>`;
				});

				rows.append('td').text(d => App.formatMoney(d.total_committed));
				rows.append('td').text(d => App.formatMoney(d.total_spent));
			} else {
				d3.select('.circle-pack-description')
					.html('<i>There are no data for recipients funded by this funder.</i>');
			}
		}

		function drawCategoryChart() {
			// get data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			if (lookup[iso]) {
				const catData = [];
				const fundsByCat = {};
				lookup[iso].forEach((p) => {
					const iso = p[countryInd];
					const catValues = p.core_capacities;
					catValues.forEach((c) => {
						if (!fundsByCat[c]) fundsByCat[c] = {};
						if (!fundsByCat[c][iso]) {
							fundsByCat[c][iso] = {
								iso,
								total_committed: 0,
								total_spent: 0,
							};
						}
						fundsByCat[c][iso].total_committed += p.total_committed;
						fundsByCat[c][iso].total_spent += p.total_spent;
					});
				});
				App.capacities.forEach((cap) => {
					if (cap.id !== 'General IHR Implementation') {
						if (fundsByCat[cap.id]) {
							const countries = [];
							let totalCommitted = 0;
							let totalSpent = 0;
							for (let iso in fundsByCat[cap.id]) {
								countries.push(fundsByCat[cap.id][iso]);
								totalCommitted += fundsByCat[cap.id][iso].total_committed;
								totalSpent += fundsByCat[cap.id][iso].total_spent;
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
			} else {

			}
		}

		init();
	};
})();
