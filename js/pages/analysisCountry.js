(() => {
	App.initAnalysisCountry = (iso, moneyType) => {

		if (!moneyType) initBasicProfile();

		// Is this the GHSA page? It has several special features.
		const isGhsaPage = iso === 'ghsa';

		// Is this a page for a country with a JEE score set available?
		const showJee = App.scoresByCountry[iso] !== undefined && moneyType === 'r';

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
		App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });
		const country = (iso === "General Global Benefit") ? ggb : App.countries.find(c => c.ISO2 === iso);
		let lookup = (moneyType === 'd') ? App.fundingLookup : App.recipientLookup;
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
				.html(`${flagHtml} ${name} ${flagHtml}`);
				// .on('click', () => hasher.setHash(`analysis/${iso}`));

			const countryTitleDiv = d3.select('.analysis-country-title');
			countryTitleDiv.append('br');
			countryTitleDiv.append('div')
				.attr('class','profile-type-container')
				.append('div')
					.attr('class','profile-type-text')
					.append('span')
						.attr('class','money-type-noun-cap-profile');
						

			$('.return-button').on('click', () => hasher.setHash('/'));

			// fill out generic text
			$('.country-name').text(name);
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);
			$('.money-type').text('disbursed');
			// $('.money-type').text(moneyType === 'd' ? 'disbursed' : 'committed');
			$('.money-type-cap').text(moneyType === 'd' ? 'Disbursed' : 'Received');
			$('.money-type-noun').text(moneyType === 'd' ? 'funder' : 'recipient');
			$('.money-type-noun-cap').text(moneyType === 'd' ? 'Funder' : 'Recipient');
			$('.money-type-noun-cap-profile').text(moneyType === 'd' ? 'Funder Profile' : 'Recipient Profile');
			$('.opp-money-type-noun').text(moneyType === 'd' ? 'recipient' : 'funder');
			$('.opp-inkind-type-noun').text(moneyType === 'd' ? 'recipient' : 'provider');
			$('.opp-money-type-verb').text(moneyType === 'd' ? 'received' : 'donated');

			if (moneyType) initDonorOrRecipientProfile();
			else initBasicProfile();

			toggleGhsaContent(isGhsaPage);
			initGhsaToggle();
		}

		/**
		 * If the page shown is a recipient country with published JEE scores, they will be visible in
		 * the core capacity bar chart, and need a legend to define them.
		 * TODO Are the breakpoints used for the JEE scores colors rational?
		 */
		function addJeeScoreLegendBox(){
			// Show the legend box (hidden by default)
			const $legendBox = d3.select('.legend-box.category-chart-legend-box');
			$legendBox.style('display','block');

			// Data for legend box content
			const row1 = [
				{
					title: `4 or higher`,
					color: App.jeeColors[5],
				},
				{
					title: `2 or lower`,
					color: App.jeeColors[0],
				}
			];
			const row2 = [
				{
					title: `2 to 4`,
					color: d3.color(App.jeeColors[1]).darker(.5),
				},
				{
					title: `No score`,
					color: 'gray',
				}
			];
			const legendEntries = [row1, row2];

			// Add the content of the legend box
			legendEntries.forEach(row => {
				// Add a row to the legend box
				const $row = $legendBox.select('.legend-content')
					.append('div')
						.attr('class','legend-col');
				row.forEach(entry => {
					// add an entry to the row
					const $entry = $row.append('div')
						.datum(entry)
						.attr('class','legend-entry');
					// add a circle to the entry
					const circleYShift = 1;
					$entry.append('svg')
						.attr('width', 10)
						.attr('height', 10)
						.append('circle')
							.style('fill', d => d.color)
							.attr('r',3)
							.attr('cx',5)
							.attr('cy',5 + circleYShift);
					// add a label to entry
					$entry.append('span')
						.text(d => d.title);
				});
			});
		}

		/**
		 * If the page is 'GHSA', then hide several page elements that aren't rational for this view.
		 * @param  {Boolean} isGhsaPage    Whether this page is the 'ghsa' page or not.
		 * 								   A constant set on initiation.
		 */
		function toggleGhsaContent (isGhsaPage) {
			if (isGhsaPage) {
				$(`.ghsa-toggle-options, .switch-type-button, .profile-type-container, .analysis-country-title > br`)
					.remove();
					// .css('visibility','hidden');
				$('.analysis-country-title').addClass('ghsa');

				d3.select('.analysis-country-title.ghsa').select('img').remove();
				d3.select('.analysis-country-title.ghsa').append('img')
					.attr('class', 'ghsa-info-img info-img')
					.attr('src','img/info.png');

				// init tooltip
				$('.ghsa-info-img').tooltipster({
					interactive: true,
					content: App.ghsaInfoTooltipContent,
				});

			} else {
				$('.second-country-table-section').remove();
			}
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`.ghsa-toggle-options input[type=radio][name="ind-country"][ind="ghsa"]`).prop('checked',true);
				$('.ghsa-only-text').text('GHSA-specific ')
			}

			$('.analysis-country-content .ghsa-toggle-options .ind-type-filter .radio-option').off('click');
			$('.analysis-country-content .ghsa-toggle-options .ind-type-filter .radio-option').click(function updateIndType() {
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';
				
				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
			});

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
		}

		function initBasicProfile(params = {}) {
			// calculate total funded and received
			const totalFunded = App.getTotalFunded(iso, {includeCommitments: true});
			const totalReceived = App.getTotalReceived(iso, {includeCommitments: true});

			if (totalFunded > totalReceived) {
				hasher.setHash(`analysis/${iso}/d`);
				return;
			}
			else {
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
				hasNoData = lookup[iso] === undefined || lookup[iso].length === 0;

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
				hasNoData = lookup[iso] === undefined || lookup[iso].length === 0;

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
			// $('.money-type-cap').text('Disbursed');

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
				interactive: true,
				html: true,
				content: App.coreCapacitiesText,
				// content: 'Each core element is associated with one or more core capacities, indicated by prefix.',
			});

			// draw charts
			if (hasNoData) {
				$('.country-flow-summary, .progress-circle-section, .country-chart-container, .country-flow-content, .category-chart-section, .circle-pack-container, .inkind-table-section').hide();
				$('.country-flow-summary-empty').slideDown();
				$('.submit-data-btn').click(() => hasher.setHash('submit'))
			} else {
				drawTimeChart();
				drawProgressCircles();
				drawCountryTable('.country-table-section', moneyType);
				if (isGhsaPage) {
					drawCountryTable('.second-country-table-section', (moneyType === 'd') ? 'r' : 'd');
				}
				drawCountryInKindTable();
				const categoryChart = drawCategoryChart();


				categoryChart.selectAll('.y.axis .tick text').each(function addJeeIcons(d) {
					const g = d3.select(this.parentNode);
					const node = g.select('text');
				});

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

            const ccs = ['P', 'D', 'R', 'O', 'General IHR Implementation'];
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
                    if (cc === 'General IHR Implementation') {
                    	// General IHR Implementation
                    	if (p.core_capacities.some(pcc => pcc === cc)) {
	                        const committed = p.total_committed;
	                        const spent = p.total_spent;

	                        // if (spent > committed) spent = committed;
	                        fundsByCc[cc].total_committed += committed;
	                        fundsByCc[cc].total_spent += spent;

	                        totalSpent += spent;
	                        totalCommitted += committed;
	                    }
                    } else {
                    	if (cc === 'O' && p.core_capacities.some(pcc => {
                    		return pcc === 'PoE' || pcc === 'RE' || pcc === 'CE';
                    	})) {
                    		const committed = p.total_committed;
	                        const spent = p.total_spent;

	                        // if (spent > committed) spent = committed;
	                        fundsByCc.O.total_committed += committed;
	                        fundsByCc.O.total_spent += spent;

	                        totalSpent += spent;
	                        totalCommitted += committed;
                    	}
	                    if (p.core_capacities.some(pcc => cc !== 'O' && cc === pcc.charAt(0))) {
	                        const committed = p.total_committed;
	                        const spent = p.total_spent;

	                        // if (spent > committed) spent = committed;
	                        fundsByCc[cc].total_committed += committed;
	                        fundsByCc[cc].total_spent += spent;

	                        totalSpent += spent;
	                        totalCommitted += committed;
	                    }
                    }
                });
            });

            const renderProgressCircles = (type) => {

                d3.select('.prevent-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.detect-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.respond-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.other-circle-chart').select('svg').remove();// remove the existing SVGs
                d3.select('.general-circle-chart').select('svg').remove();// remove the existing SVGs

                // need to pass in the type to flex based upon spent / committed
                App.drawProgressCircles('.prevent-circle-chart', fundsByCc.P, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.detect-circle-chart', fundsByCc.D, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.respond-circle-chart', fundsByCc.R, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.other-circle-chart', fundsByCc.O, totalSpent, totalCommitted, type, color);
                App.drawProgressCircles('.general-circle-chart', fundsByCc['General IHR Implementation'], totalSpent, totalCommitted, type, color);
            };

            const percFormat = d3.format('.0%');
            const fillValueText = (valueSelector, ind, totalSpent, totalCommitted, type) => {

                if (type === 'total_spent') {

                    if (fundsByCc[ind].total_spent) {
                        const pValue = fundsByCc[ind].total_spent / totalSpent;
                        $(valueSelector).text(percFormat(pValue));
                    } else {
                        $(valueSelector).parent().text('No funds disbursed for this core element');
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

            $('input[name=fundtype]').change(function(){
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				renderProgressCircles(fundTypeChoice);
			});
        }


        /**
         * Draws the "In-kind Contributions Received" or "In-kind Contributions Made"
         * table that appears on a country analysis page. When on the GHSA special
         * page, this table contains both the Provider and Recipient columns.
         * Otherwise, it contains only one or the other.
         */
        function drawCountryInKindTable() {

        	// Set title of section based on whether funder or recipient profile is being viewed
        	if (!isGhsaPage) {
				$('.inkind-table-title').text((moneyType === 'd') ? 'In-kind Contributions Made' : 'In-kind Contributions Received');
        	} else {
        		$('.inkind-table-title').text('In-kind Contributions');
        		$('.inkind-table-section .description').text('The table below displays GHSA in-kind contributions in alphabetical order by provider. Click on a row to view details.');
        	}

			// get in-kind support projects
			const inkindProjects = lookup[iso].filter(d => d.assistance_type.toLowerCase() === 'in-kind support');

			// get table data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			const countryIndOther = (moneyType === 'd') ? 'donor_code' : 'recipient_country';
			let fundedData = [];
			const fundedByCountry = {};
			inkindProjects.forEach((p) => {
				const recIso = p[countryInd];
				const isoOther = p[countryIndOther];
				if (recIso !== 'Not reported') {
					if (!fundedByCountry[recIso]) {
						fundedByCountry[recIso] = {
							project_name: p.project_name,
							iso: recIso,
							iso_other: isoOther,
							entity_name: App.codeToNameMap.get(recIso) || recIso,
							entity_name_other: App.codeToNameMap.get(isoOther) || isoOther,
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
			const nameKey = isGhsaPage ? 'entity_name_other' : 'entity_name';
			fundedData = _.sortBy(fundedData, d => {
				return d[nameKey].toLowerCase();
			});

			// draw table
			const drawTable = (type) => {
				$('.inkind-table-container').empty();
				const table = d3.select('.inkind-table-container')
					.append('table')
						.classed('inkind-table country-table', true)
						.classed('table', true)
						.classed('table-bordered', true)
						.classed('table-hover', true);

				const header = table.append('thead').append('tr');

				if (!isGhsaPage) {
					const firstColLabel = (moneyType === 'd') ? 'Recipient' : 'Provider';
					header.append('td').html(firstColLabel);
				} else {
					header.append('td').html('Provider');
					header.append('td').html('Recipient')
						.style('padding-left','63px');
							
				}
				header.append('td').html('Purpose of contribution');
				const body = table.append('tbody');

				const rows = body.selectAll('tr')
					.data(fundedData)
					.enter().append('tr')
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							App.infoTab = 'inkind';
							if (moneyType === 'd') {
								hasher.setHash(`analysis/${iso}/${d.iso}`);
							} else {
								hasher.setHash(`analysis/${d.iso}/${iso}`);
							}
						}
					});

				// On GHSA special page: Include both the donor and recipient.
				if (isGhsaPage) {
					rows.append('td').html((d) => {
						const recCountry = App.countries.find(c => c.ISO2 === d.iso_other);
						const flagHtml = recCountry ? App.getFlagHtml(d.iso_other) : '';
						let cName = d.iso_other;
						if (App.codeToNameMap.has(d.iso_other)) {
							cName = App.codeToNameMap.get(d.iso_other);
						}
						const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso_other}/${moneyType === 'd' ? 'r' : 'd'}')`;
						return `<div class="flag-container">${flagHtml}</div>` +
							'<div class="name-container">' +
							`<span onclick="${onClickStr}">${cName}</span>` +
							'</div>';
					});
				}

				rows.append('td').html((d) => {
					const recCountry = App.countries.find(c => c.ISO2 === d.iso);
					const flagHtml = recCountry ? App.getFlagHtml(d.iso) : '';
					let cName = d.iso;
					if (App.codeToNameMap.has(d.iso)) {
						cName = App.codeToNameMap.get(d.iso);
					}
					const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso}/${moneyType === 'd' ? 'r' : 'd'}')`;
					return `<div class="flag-container">${flagHtml}</div>` +
						'<div class="name-container">' +
						`<span onclick="${onClickStr}">${cName}</span>` +
						'</div>';
				})
				.classed('ghsa-recipient-cell', isGhsaPage);



				rows.append('td').text(d => d.project_name);

				// initialize DataTables plugin
				const infoDataTable = $('.inkind-table').DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: true,
					ordering: false,
					// ordering: true,
					// order: [[0, 'asc']],
					bLengthChange: false,
				});
			};

			drawTable('total_spent');

            // If there was no data in the table, say so
            if (fundedData.length === 0) {
            	$('.inkind-table-section .data-area').hide();
            	$('.inkind-table-section .no-data-description').show();
            }
        };

		/**
		 * Draws the "Top Recipients" or "Top Funders" table that appears on a
		 * country analysis page.
		 */
		function drawCountryTable(selector, moneyTypeForTable) {
			const $tableContainer = $(selector);
			if (moneyTypeForTable === 'd') {
				$tableContainer.find('.section-title').text('Top Recipients');
			} else {
				$tableContainer.find('.section-title').text('Top Funders');
			}

			// get table data
			const countryInd = (moneyTypeForTable === 'd') ? 'recipient_country' : 'donor_code';
			const fundedData = [];
			const fundedByCountry = {};
			lookup[iso]
			.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support')
			.forEach((p) => {
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
							spent_on_general: 0,
							committed_on_prevent: 0,
							committed_on_detect: 0,
							committed_on_respond: 0,
							committed_on_other: 0,
							committed_on_general: 0,
						};
					}
					fundedByCountry[recIso].total_committed += p.total_committed;
					fundedByCountry[recIso].total_spent += p.total_spent;
					p.core_capacities.forEach(cc => {
						const ccAbbrev = cc.split('.')[0];
						if (ccAbbrev === 'P') {
							fundedByCountry[recIso].spent_on_prevent += p.total_spent;
							fundedByCountry[recIso].committed_on_prevent += p.total_committed;
						} else if (ccAbbrev === 'D') {
							fundedByCountry[recIso].spent_on_detect += p.total_spent;
							fundedByCountry[recIso].committed_on_detect += p.total_committed;
						} else if (ccAbbrev === 'R') {
							fundedByCountry[recIso].spent_on_respond += p.total_spent;
							fundedByCountry[recIso].committed_on_respond += p.total_committed;
						} else if (ccAbbrev === 'General IHR Implementation') {
							fundedByCountry[recIso].spent_on_general += p.total_spent;
							fundedByCountry[recIso].committed_on_general += p.total_committed;
						} else {
							fundedByCountry[recIso].spent_on_other += p.total_spent;
							fundedByCountry[recIso].committed_on_other += p.total_committed;
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
				$tableContainer.find('.table-container').empty();
				const table = d3.select(selector).select('.table-container')
					.append('table')
						.classed('country-table funds-table', true)
						.classed('table', true)
						.classed('table-bordered', true)
						.classed('table-hover', true);

				const header = table.append('thead').append('tr');
				const firstColLabel = (moneyTypeForTable === 'd') ? 'Recipient' : 'Funder';
				const lastColLabel = (type === 'total_spent') ? 'Total Disbursed' : 'Total Committed';

				header.append('td').html(firstColLabel);
				header.append('td').html(lastColLabel);

				header.append('td').html('Prevent');
				header.append('td').html('Detect');
				header.append('td').html('Respond');
				header.append('td').html('Other');
				header.append('td').html('General IHR');

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
							if (moneyTypeForTable === 'd') {
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
					const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso}/${moneyTypeForTable === 'd' ? 'r' : 'd'}')`;
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
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.spent_on_general));
				} else {
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_prevent));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_detect));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_respond));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_other));
					rows.append('td').attr('class', 'slightly-dark').text(d => App.formatMoney(d.committed_on_general));
				}

				// initialize DataTables plugin
				const infoDataTable = $tableContainer.find('.table').DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: false,
					ordering: false,
					bLengthChange: false,
				});
			};

			drawTable('total_spent');

           $('input[name=fundtype]').change(function(){
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				drawTable(fundTypeChoice);
			});

            // If there was no data in the table, say so
            if (fundedData.length === 0) {
            	$tableContainer.find('.data-area').hide();
            	$tableContainer.find('.no-data-description').show();
            }
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
				// if (cap.id !== 'General IHR Implementation') {
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
				// }
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
				showJee,
				scores: App.scoresByCountry[iso],
			});

			chart.update(catData, selected);

			$('input[name=fundtype]').change(function(){
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				updateData(fundTypeChoice);
			});

            // put init jee chart stuff here
            if (!showJee) {
				$('.jee-sort-options').remove();
			} else {
				$('.analysis-country-content .jee-sort-options .ind-type-filter .radio-option').off('click');
				$('.analysis-country-content .jee-sort-options .ind-type-filter .radio-option').click(function updateJeeSort() {
	                updateData();
				});

				// init tooltip
				$('.jee-info-img').tooltipster({
					interactive: true,
					content: `The colored circles represent the average score of the indicators in each core capacity (e.g., P.1) published in the country\'s most recent JEE Assessment.`,
				});

				// if showing JEE scores, build the legend for them
				addJeeScoreLegendBox();
			}


			const updateData = (fundTypeChoice) => {
				if (filterData === 'small') {
					chart.update(smallData, fundTypeChoice);
				} else {
					chart.update(catData, fundTypeChoice);
				}
				if (fundTypeChoice === 'total_spent') {
					$('.money-type').text('disbursed');
					if (moneyType === 'r') {
						// $('.money-type').text('recieved');
					} else {
						// $('.money-type').text('disbursed');
					}
				} else {
					$('.money-type').text('committed');
				}
			}
			return chart;
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
