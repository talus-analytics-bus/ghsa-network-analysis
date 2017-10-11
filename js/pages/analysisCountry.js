(() => {
	App.initAnalysisCountry = (iso, moneyType) => {
		// get country information
		const country = App.countries.find(c => c.ISO2 === iso);

		// initializes the whole page
		function init() {
			// fill title
			const flagHtml = App.getFlagHtml(iso);
			$('.analysis-country-title')
				.html(`${flagHtml} ${country.NAME} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

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
			$('.show-table-btn').click(() => {
				hasher.setHash(`analysis/${iso}/${moneyType}/table`);
			});

			// fill out title and description for circle pack; draw circle pack
			if (moneyType === 'd') {
				const totalFunded = App.getTotalFunded(iso);
				$('.country-summary-label').text(`Total Funded from ${App.dataStartYear}` +
					` to ${App.dataEndYear}`);
				$('.country-summary-value').text(App.formatMoney(totalFunded));
				drawDonorCirclePack();
				drawDonorCategoryChart();
				drawDonorTimeChart();
			} else if (moneyType === 'r') {
				const totalReceived = App.getTotalReceived(iso);
				$('.country-summary-label').text(`Total Received from ${App.dataStartYear}` +
					` to ${App.dataEndYear}`);
				$('.country-summary-value').text(App.formatMoney(totalReceived));
				drawRecipientCirclePack();
				drawRecipientCategoryChart();
				drawRecipientTimeChart();
			}

			// display content
			$('.country-flow-content').slideDown();
		}

		function drawDonorTimeChart() {
			// get data
			if (App.fundingLookup[iso]) {
				const timeData = [];
				const fundsByYear = {};
				for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
					fundsByYear[i] = {
						year: i,
						total_committed: 0,
						total_spent: 0,
					};
				}
				App.fundingLookup[iso].forEach((p) => {
					for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
						fundsByYear[i].total_committed += p.committed_by_year[i];
						fundsByYear[i].total_spent += p.spent_by_year[i];
					}
				});
				for (let y in fundsByYear) {
					timeData.push(fundsByYear[y]);
				}
				App.buildTimeChart('.time-chart-container', timeData, {
					color: App.fundColor,
				});
			} else {

			}
		}

		function drawRecipientTimeChart() {
			// get data
			if (App.recipientLookup[iso]) {
				const timeData = [];
				const fundsByYear = {};
				for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
					fundsByYear[i] = {
						year: i,
						total_committed: 0,
						total_spent: 0,
					};
				}
				App.recipientLookup[iso].forEach((p) => {
					for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
						fundsByYear[i].total_committed += p.committed_by_year[i];
						fundsByYear[i].total_spent += p.spent_by_year[i];
					}
				});
				for (let y in fundsByYear) {
					timeData.push(fundsByYear[y]);
				}
				App.buildTimeChart('.time-chart-container', timeData, {
					color: App.receiveColor,
				});
			} else {

			}

		}

		function drawDonorCategoryChart() {
			// get data
			if (App.fundingLookup[iso]) {
				const catData = [];
				const fundsByCat = {};
				App.fundingLookup[iso].forEach((p) => {
					const recCountry = App.countries.find(c => c.ISO2 === p.recipient_country);
					if (recCountry) {
						const region = recCountry.regionName;
						const catValues = p.core_capacities;
						catValues.forEach((c) => {
							if (!fundsByCat[c]) fundsByCat[c] = {};
							if (!fundsByCat[c][region]) {
								fundsByCat[c][region] = {
									name: region,
									total_committed: 0,
									total_spent: 0,
								};
							}
							fundsByCat[c][region].total_committed += p.total_committed;
							fundsByCat[c][region].total_spent += p.total_spent;
						});
					}
				});
				for (let c in fundsByCat) {
					const regions = [];
					let totalCommitted = 0;
					let totalSpent = 0;
					for (let r in fundsByCat[c]) {
						regions.push(fundsByCat[c][r]);
						totalCommitted += fundsByCat[c][r].total_committed;
						totalSpent += fundsByCat[c][r].total_spent;
					}
					//Util.sortByKey(regions, 'total_spent', true);
					catData.push({
						name: c,
						children: regions,
						total_committed: totalCommitted,
						total_spent: totalSpent,
					});
				}
				Util.sortByKey(catData, 'total_spent', true);
				App.buildCategoryChart('.category-chart-container', catData, {
					xAxisLabel: 'Total Funds Disbursed by Core Capacity',
				});
			} else {

			}
		}

		function drawRecipientCategoryChart() {
			// get data
			if (App.recipientLookup[iso]) {
				const catData = [];
				const fundsByCat = {};
				App.recipientLookup[iso].forEach((p) => {
					const donCountry = App.countries.find(c => c.ISO2 === p.donor_country);
					if (donCountry) {
						const region = donCountry.regionName;
						const catValues = p.core_capacities;
						catValues.forEach((c) => {
							if (!fundsByCat[c]) fundsByCat[c] = {};
							if (!fundsByCat[c][region]) {
								fundsByCat[c][region] = {
									name: region,
									total_committed: 0,
									total_spent: 0,
								};
							}
							fundsByCat[c][region].total_committed += p.total_committed;
							fundsByCat[c][region].total_spent += p.total_spent;
						});
					}
				});
				for (let c in fundsByCat) {
					const regions = [];
					let totalCommitted = 0;
					let totalSpent = 0;
					for (let r in fundsByCat[c]) {
						regions.push(fundsByCat[c][r]);
						totalCommitted += fundsByCat[c][r].total_committed;
						totalSpent += fundsByCat[c][r].total_spent;
					}
					//Util.sortByKey(regions, 'total_spent', true);
					catData.push({
						name: c,
						children: regions,
						total_committed: totalCommitted,
						total_spent: totalSpent,
					});
				}
				Util.sortByKey(catData, 'total_spent', true);
				App.buildCategoryChart('.category-chart-container', catData, {
					xAxisLabel: 'Total Funds Received by Core Capacity',
				});
			} else {

			}
		}

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
				App.buildCirclePack('.circle-pack-content', fundedData, {
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
				App.buildCirclePack('.circle-pack-content', receivedData, {
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
