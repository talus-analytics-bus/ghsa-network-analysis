(() => {
	App.initAnalysisCountry = (iso, moneyType) => {
		// define "country" parameters for General Global Benefit recipient
		const ggb = {
		  "FIPS": "ggb",
		  "ISO2": "ggb",
		  "ISO3": "ggb",
		  "NAME": "General Global Benefit",
		  "regionName": "General Global Benefit",
		  "subRegionName": "General Global Benefit",
		  "intermediateRegionName": "General Global Benefit"
		};

		// get country information
		const country = (iso === "General Global Benefit") ? ggb : App.countries.find(c => c.ISO2 === iso);
		const lookup = (moneyType === 'd') ? App.fundingLookup : App.recipientLookup;
		const color = (moneyType === 'd') ? App.fundColor : App.receiveColor;
		const lightColor = (moneyType === 'd') ? App.fundColorPalette[4] : App.receiveColorPalette[4];

		if (iso === "General Global Benefit") {
			$('.toggle-type').css('visibility','hidden');
		} else {
			$('.toggle-type').css('visibility','');
		}

		// initializes the whole page
		function init() {
            App.setSources();
			// fill title
			const name = App.codeToNameMap.get(iso);
			const flagHtml = country ? App.getFlagHtml(iso) : '';
			$('.analysis-country-title')
				.html(`${flagHtml} ${name} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

			$('.return-button').on('click', () => hasher.setHash('/'));

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

			if (iso !== "General Global Benefit")
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
				$('.toggle-funder-profile')
					.addClass('active');
				$('.toggle-recipient-profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/r`));
				 $('.switch-type-button')
				 	.text('Switch to Recipient Profile')
				 	.on('click', () => hasher.setHash(`analysis/${iso}/r`));

				$('.country-summary-value').text(App.formatMoney(totalFunded));
			} else if (moneyType === 'r') {
				if (!totalReceived) hasNoData = true;



                // fill out "switch profile" text and behavior
				$('.toggle-recipient-profile')
					.addClass('active');
				$('.toggle-funder-profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/d`));
				$('.switch-type-button')
				 	.text('Switch to Funder Profile')
				 	.on('click', () => hasher.setHash(`analysis/${iso}/d`));

				$('.country-summary-value').text(App.formatMoney(totalReceived));
			}

			$('input[type=radio][value="total_spent"]').prop('checked', true);
			$('.money-type-cap').text('Disbursed');

			$('.toggle-disbursed').click(function() {
				if ($(this).hasClass('active')) {
				} else {
					$('.toggle-disbursed').addClass('active');
					$('.toggle-committed').removeClass('active');
					$('.money-type-cap').text('Disbursed');
				}
			});

			$('.toggle-committed').click(function() {
				if ($(this).hasClass('active')) {
				} else {
					$('.toggle-committed').addClass('active');
					$('.toggle-disbursed').removeClass('active');
					$('.money-type-cap').text('Committed');
				}
			});

			const text = 'The Core Elements are <b>Prevent</b>, <b>Detect</b>, <b>Respond</b> and <b>Other</b>. ' +
				'<b>Other</b> includes Point of Entry (Poe), Chemical Events (CE), and Radiation Emergencies (RE).';
			$('.core-element-text').tooltipster({
				content: text,
			});

			$('.core-capacity-text').tooltipster({
				content: 'Each core element is associated with one or more core capacities, indicated by prefix.',
			});

			// draw charts
			if (hasNoData) {
				$('.country-flow-summary, .progress-circle-section, .country-chart-container, .country-flow-content, .category-chart-section, .circle-pack-container').hide();
				$('.country-flow-summary-empty').slideDown();
				$('.submit-data-btn').click(() => hasher.setHash('submit'))
			} else {
				drawTimeChart();
				drawProgressCircles();
				drawCountryTable();
				drawCategoryChart();
				// display content
				$('.country-flow-content').slideDown();
			}
		}



        function drawProgressCircles() {
            $('.progress-circle-title .info-img').tooltipster({
                content: 'The <b>percent of committed funds</b> that were disbursed is shown. ' +
                'However, note that not all projects with disbursals have corresponding commitments, ' +
                'so these figures do not take into account all known funding initiatives.',
            });

            const ccs = ['P', 'D', 'R', 'O'];
            const fundsByCc = {};
            ccs.forEach((cc) => {
                fundsByCc[cc] = {
                    cc,
                    total_committed: 0,
                    total_spent: 0,
                };
            });

            let totalSpent = 0;
            let totalCommitted = 0;
            lookup[iso].forEach((p) => {
                ccs.forEach((cc) => {
                    //console.log(p.core_capacities);
                    if (p.core_capacities.some(pcc => cc === pcc.charAt(0))) {
                        const committed = p.total_committed;
                        let spent = p.total_spent;

                        // if (spent > committed) spent = committed;
                        fundsByCc[cc].total_committed += committed;
                        fundsByCc[cc].total_spent += spent;

                        totalSpent += spent;
                        totalCommitted += committed;
                    }
                });
            });

            const renderProgressCircles = (type) => {

                d3.select('.prevent-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.detect-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.respond-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.other-circle-chart').select('svg').remove();// remove the existing SVGs

                // need to pass in the type to flex based upon spent / committed
                App.drawProgressCircles('.prevent-circle-chart', fundsByCc.P, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.detect-circle-chart', fundsByCc.D, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.respond-circle-chart', fundsByCc.R, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.other-circle-chart', fundsByCc.O, totalSpent, totalCommitted, type, color);

                //fillValueText('.prevent-value', 'P', totalSpent, totalCommitted, type);
                //fillValueText('.detect-value', 'D', totalSpent, totalCommitted, type);
                //fillValueText('.respond-value', 'R', totalSpent, totalCommitted, type);
                //fillValueText('.respond-value', 'R', totalSpent, totalCommitted, type);

            };

            const percFormat = d3.format('.0%');
            const fillValueText = (valueSelector, ind, totalSpent, totalCommitted, type) => {

                if (type === 'total_spent') {

                    if (fundsByCc[ind].total_spent) {
                        const pValue = fundsByCc[ind].total_spent / totalSpent;
                        $(valueSelector).text(percFormat(pValue));
                    } else {
                        $(valueSelector).parent().text('No funds committed for this core element');
                    }

                }else {
                    if (fundsByCc[ind].total_committed) {
                        const pValue = fundsByCc[ind].total_committed / totalCommitted;
                        $(valueSelector).text(percFormat(pValue));
                    } else {
                        $(valueSelector).parent().text('No funds committed for this core element');
                    }
                }


            };

            renderProgressCircles('total_spent');



            // change the circles based upon the user selection (spend / committed)

            $('.toggle-progress-circle-chart-container').click(function () {

                selected = $('.toggle-progress-circle-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#chart-spent').prop("checked", true);
                } else  {
                    $('#chart-committed').prop("checked", true);
                }
                renderProgressCircles(selected);

            });


            $('.toggle-disbursed-chart-container').click(function (){
                selected = $('.toggle-disbursed-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#progress-spent').prop("checked", true);
                } else  {
                    $('#progress-committed').prop("checked", true);
                }
                renderProgressCircles(selected);
            } );

        }

		//function radioClickHandler (spent, dispurrsed)

		function drawCountryTable() {
			if (moneyType === 'd') {
				$('.circle-pack-title').text('Top Recipients');
			} else {
				$('.circle-pack-title').text('Top Funders');
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
							spent_on_prevent: 0,
							spent_on_detect: 0,
							spent_on_respond: 0,
							spent_on_other: 0,
							committed_on_prevent: 0,
							committed_on_detect: 0,
							committed_on_respond: 0,
							committed_on_other: 0,
						};
					}
					fundedByCountry[recIso].total_committed += p.total_committed;
					fundedByCountry[recIso].total_spent += p.total_spent;
					p.core_capacities.forEach(cc => {
						const ccAbbrev = cc.split('.')[0];
						if (ccAbbrev === 'P') {
							fundedByCountry[recIso].spent_on_prevent += p.total_spent;
							fundedByCountry[recIso].committed_on_prevent += p.total_spent;
						} else if (ccAbbrev === 'D') {
							fundedByCountry[recIso].spent_on_detect += p.total_spent;
							fundedByCountry[recIso].committed_on_detect += p.total_spent;
						} else if (ccAbbrev === 'R') {
							fundedByCountry[recIso].spent_on_respond += p.total_spent;
							fundedByCountry[recIso].committed_on_respond += p.total_spent;
						} else {
							fundedByCountry[recIso].spent_on_other += p.total_spent;
							fundedByCountry[recIso].committed_on_other += p.total_spent;
						}
					})
				}
			});
			for (const recIso in fundedByCountry) {
				fundedData.push(fundedByCountry[recIso]);
			}
			Util.sortByKey(fundedData, 'total_spent', true);

			// draw table
			const drawTable = (type) => {
				$('.country-table-container').empty();
				const table = d3.select('.country-table-container')
					.append('table')
						.classed('country-table', true)
						.classed('table', true)
						.classed('table-bordered', true)
						.classed('table-hover', true);

				const header = table.append('thead').append('tr');
				const firstColLabel = (moneyType === 'd') ? 'Recipient' : 'Funder';
				const lastColLabel = (type === 'total_spent') ? 'Total Disbursed' : 'Total Committed';

				header.append('td').html(firstColLabel);
				header.append('td').html(lastColLabel);

				header.append('td').html('Prevent');
				header.append('td').html('Detect');
				header.append('td').html('Respond');

				header.append('td').html('Other');
                /*header.append('td').html('Dispersed');
                header.append('td').html('Committed');*/

				const body = table.append('tbody');

				const rows = body.selectAll('tr')
					.data(fundedData.sort((a, b) => {
						if (a[type] < b[type]) {
							return 1;
						} else {
							return -1;
						}
					}))
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

				rows.append('td').text(d => App.formatMoney(d[type]));
				if (type === 'total_spent') {
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.spent_on_prevent));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.spent_on_detect));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.spent_on_respond));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.spent_on_other));
                    /*rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.total_committed));
                    rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.total_spent));*/


				} else {
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_prevent));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_detect));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_respond));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_other));
					/*rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.total_committed));
                    rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.total_spent));*/

				}

				// initialize DataTables plugin
				const infoDataTable = $('.country-table').DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: false,
					ordering: false,
					bLengthChange: false,
				});
			};

			drawTable('total_spent');


            $('.toggle-progress-circle-chart-container').click(function () {

                selected = $('.toggle-progress-circle-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#chart-spent').prop("checked", true);
                } else  {
                    $('#chart-committed').prop("checked", true);
                }
                drawTable(selected);

            });

            $('.toggle-disbursed-chart-container').click(function() {
                selected = $('.toggle-disbursed-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#progress-spent').prop("checked", true);
                } else  {
                    $('#progress-committed').prop("checked", true);
                }
                drawTable(selected);

            });
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

			const largestSpent = d3.mean(
				catData.reduce(
					(acc, cval) => acc.concat(cval.children), []),
				d => d.total_spent);
			const largestCommitted = d3.mean(
				catData.reduce(
					(acc, cval) => acc.concat(cval.children), []),
				d => d.total_spent);

			const smallData = catData.map(d => {
				const newD = Object.assign({}, d);
				newD.children = d.children
					.filter(c => (c.total_committed < largestCommitted) || (c.total_spent < largestSpent));
				newD.total_spent = newD.children
					.reduce((acc, cval) => acc + cval.total_spent, 0);
				newD.total_committed = newD.children
					.reduce((acc, cval) => acc + cval.total_committed, 0);
				return newD;
			});

			var selected = 'total_spent';
			var filterData = 'big';

			const chart = App.buildCategoryChart('.category-chart-container', {
				moneyType,
			});

			chart.update(catData, selected);

			$('input[type=checkbox][value=showsmall]').on('change', function() {
				const isChecked = $(this).prop('checked');
				if (isChecked) {
					filterData = 'small';
				} else {
					filterData = 'big';
				}
				updateData();
			});


            $('.toggle-progress-circle-chart-container').click(function () {

                selected = $('.toggle-progress-circle-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#chart-spent').prop("checked", true);
                } else  {
                    $('#chart-committed').prop("checked", true);
                }
                updateData();

            });

            $('.toggle-disbursed-chart-container').click(function() {
                selected = $('.toggle-disbursed-chart-container input[name=fundtype]:checked').val();
                // make sure that you check the other radio buttons as well
                if (selected === 'total_spent') {
                    $('#progress-spent').prop("checked", true);
                } else  {
                    $('#progress-committed').prop("checked", true);
                }
                updateData();
            });


			const updateData = () => {
				if (filterData === 'small') {
					chart.update(smallData, selected);
				} else {
					chart.update(catData, selected);
				}
				if (selected === 'total_spent') {
					if (moneyType === 'r') {
						$('.money-type').text('recieved');
					} else {
						$('.money-type').text('disbursed');
					}
				} else {
					$('.money-type').text('committed');
				}
			}
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
            App.buildTimeChart('.time-chart-graphic', timeData, {
                color,
                lightColor,
                moneyType,
            });
        }
		init();
	};
})();
