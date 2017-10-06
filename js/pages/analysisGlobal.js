(() => {
	App.initAnalysisGlobal = () => {
		function init() {
			drawGlobalCharts();
		}

		function drawGlobalCharts() {
			// collate the data
			const fundedData = [];
			const receivedData = [];
			const chordData = [];
			const fundsByRegion = {};
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const iso = c.ISO2;
				const fundedPayments = App.fundingLookup[iso];
				const receivedPayments = App.recipientLookup[iso];

				// construct chord data; sort by region and subregion
				let totalFunded = 0;
				let totalReceived = 0;
				if (fundedPayments) totalFunded = d3.sum(fundedPayments, d => d.total_spent);
				if (receivedPayments) totalReceived = d3.sum(receivedPayments, d => d.total_spent);
				if (totalFunded || totalReceived) {
					const region = c.regionName;
					const sub = c.subRegionName;
					if (!fundsByRegion[region]) fundsByRegion[region] = {};
					if (!fundsByRegion[region][sub]) fundsByRegion[region][sub] = {};
					if (!fundsByRegion[region][sub][iso]) {
						fundsByRegion[region][sub][iso] = {
							totalFunded,
							totalReceived,
							fundsByC: {},
						};
					}
					
					if (fundedPayments) {
						fundedPayments.forEach((p) => {
							if (p.total_spent) {
								// check that the recipient is a valid country
								const rIso = p.recipient_country;
								const rCountry = App.countries.find(c => c.ISO2 === rIso);
								if (rCountry) {
									const rName = rCountry.NAME;
									if (!fundsByRegion[region][sub][iso].fundsByC[rName]) {
										fundsByRegion[region][sub][iso].fundsByC[rName] = 0;
									}
									fundsByRegion[region][sub][iso].fundsByC[rName] += p.total_spent;
								}
							}
						});
					}
				}
			}

			// build chord chart data
			for (let r in fundsByRegion) {
				const region = {
					name: r,
					children: [],
					totalFunded: 0,
					totalReceived: 0,
					totalFlow: 0,
				};
				for (let sub in fundsByRegion[r]) {
					const subregion = {
						name: sub,
						children: [],
						totalFunded: 0,
						totalReceived: 0,
						totalFlow: 0,
					};
					for (let iso in fundsByRegion[r][sub]) {
						const country = App.countries.find(c => c.ISO2 === iso);
						const funds = [];
						for (let rName in fundsByRegion[r][sub][iso].fundsByC) {
							funds.push({
								donor: country.NAME,
								recipient: rName,
								value: fundsByRegion[r][sub][iso].fundsByC[rName],
							});
						}
						const totalFunded = fundsByRegion[r][sub][iso].totalFunded;
						const totalReceived = fundsByRegion[r][sub][iso].totalReceived;
						subregion.children.push({
							name: country.NAME,
							iso: iso,
							totalFunded,
							totalReceived,
							totalFlow: totalFunded + totalReceived,
							funds,
						});
						subregion.totalFunded += totalFunded;
						subregion.totalReceived += totalReceived;
						subregion.totalFlow += totalFunded + totalReceived;
					}
					region.children.push(subregion);
					region.totalFunded += subregion.totalFunded;
					region.totalReceived += subregion.totalReceived;
					region.totalFlow += subregion.totalFlow;
				}
				chordData.push(region);
			}

			// build the charts
			App.buildChordDiagram('.chord-chart', chordData);
		}

		init();
	};
})();
