const Charts = {};

(() => {
	/**
	 * Builds an ILI line chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildILIChart = (selector, callData, param = {}) => {
		const initialRange = [App.ppwDate, App.cwDate];
		

		// collate call data by day
		var startDate = new Date(App.earliestDate.getTime() + (0 * 24 * 3600 * 1000));
		var endDate = new Date(App.cwDate.getTime() + (24 * 3600 * 1000));
		// var endDate = new Date(startDate.getTime() + (24 * 3600 * 1000));

		// other way to calculate it
		var trendHash = {};
		for (let i  = 0; i < callData.length; i++) {
			const curDateStr = new Date(callData[i].create_stamp).toDateString();
			if (trendHash[curDateStr]) {
				trendHash[curDateStr] = trendHash[curDateStr] + 1;
			} else {
				trendHash[curDateStr] = 1;
			}
		}

		// get the data needed
		const trendData = [];
		var stopDate = App.cwDate; // TO DO: Set the stopDate to today
		while (startDate <= stopDate) {
			var curVal = trendHash[startDate.toDateString()];
			if (curVal) {
				trendData.push({
					date: new Date(startDate),
					value: curVal
				});
			} else {
				trendData.push({
					date: new Date(startDate),
					value: 0
				});
			}
			startDate.setDate(startDate.getDate() + 1);
		}

		// // below is old method used to calculate call volume
		// for (let i = 0; i <= 60; i++) {
		// 	const startDate = new Date(App.earliestDate.getTime() + (i * 24 * 3600 * 1000));
		// 	const endDate = new Date(startDate.getTime() + (24 * 3600 * 1000));
		// 	const dailyCV = _.filter(callData, (d) => {
		// 		const date = new Date(d.create_stamp);
		// 		return date < endDate && date > startDate;
		// 	}).length;

		// 	trendData.push({
		// 		date: startDate,
		// 		value: dailyCV,
		// 	});
		// }

		// build the chart
		const margin = {
			top: param.marginTop || 25,
			right: param.marginRight || 60,
			bottom: param.marginBottom || 40,
			left: param.marginLeft || 55,
		};
		const margin2 = {
			top: 230,
			right: param.marginRight || 60,
			bottom: 45,
			left: param.marginLeft || 55,
		};
		const width = 605;
		// const width = param.width || 605;
		const height = param.height || 260;
		const height2 = param.height2 || 40;
		const totalHeight = height + margin.top + margin.bottom + height2 + margin2.bottom;
		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', totalHeight);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		const secChart = chartContainer.append('g')
			.attr('transform', `translate(${margin2.left}, ${margin2.top})`);

		// clip path to make data stay in chart
		chartContainer.append('defs').append('clipPath')
			.attr('id', 'clip')
			.append('rect')
				.attr('width', width)
				.attr('height', height);

		// define scales
		const x = d3.scaleTime()
			.domain(initialRange)
			.rangeRound([0, width]);
		const x2 = d3.scaleTime()
			.domain([App.earliestDate, App.cwDate])
			.rangeRound([0, width]);
		const y = d3.scaleLinear()
			.domain([0, 1.2 * d3.max(trendData, d => d.value)])
			.range([height, 0]);
		const y2 = d3.scaleLinear()
			.domain(y.domain())
			.range([height2, 0]);

		// add axes
		const xAxis = d3.axisBottom(x)
			.tickFormat(d3.timeFormat('%-b %-d'))
			.ticks(4);
		const xAxis2 = d3.axisBottom(x2)
			.tickFormat(d3.timeFormat('%-b %-d, %Y'))
			.ticks(4);

		// add vert axis and hide tick marks that aren't integers
		const yAxis = d3.axisLeft(y)
			.ticks(param.numYTicks || 5)
			.tickFormat(function(e){ // only show integer ticks
		        if(Math.floor(e) != e) {
		        	return;
		        }
		        return e;
		    })
			.tickSizeInner(-width);

		// add groups for axes
		chart.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		secChart.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${height2})`)
			.call(xAxis2);
		chart.append('g')
			.attr('class', 'y-axis')
			.call(yAxis)
			.selectAll('.tick text')
				.attr('x', -6);

		// hide tick lines if they have no labels
		const yAxisTickLines = d3.select('.call-volume-chart').select('g.y-axis').selectAll('g.tick').selectAll('line')
			.attr('x2',function(d,i) {
				if(Math.floor(d) != d) {
		        	return 0;
		        }
		        return width;
			});

		// add line
		const line = d3.line()
			.x(d => x(d.date))
			.y(d => y(d.value));
			// .curve(d3.curveCardinal.tension(0));
		const area = d3.area()
			.x(d => x(d.date))
			.y0(height)
			.y1(d => y(d.value));
			// .curve(d3.curveCardinal.tension(0));
		chart.append('path')
			.datum(trendData)
			.attr('class', 'line')
			.style('clip-path', 'url(#clip)')
			.attr('d', line);
		chart.append('path')
			.datum(trendData)
			.attr('class', 'area')
			.style('clip-path', 'url(#clip)')
			.attr('d', area);

		// lines for second chart
		const line2 = d3.line()
			.x(d => x2(d.date))
			.y(d => y2(d.value));
			// .curve(d3.curveCardinal.tension(0));
		const area2 = d3.area()
			.x(d => x2(d.date))
			.y0(height2)
			.y1(d => y2(d.value));
			// .curve(d3.curveCardinal.tension(0));
		secChart.append('path')
			.datum(trendData)
			.attr('class', 'line')
			.attr('d', line2);
		secChart.append('path')
			.datum(trendData)
			.attr('class', 'area')
			.attr('d', area2);

		// add points
		chart.selectAll('.point')
			.data(trendData)
			.enter().append('circle')
				.attr('class', 'point')
				.attr('r', 3)
				.style('clip-path', 'url(#clip)')
				.each(function(d) {
					const dateStr = d3.timeFormat('%B %-d, %Y')(d.date);
					const contentStr = `<b>${dateStr}</b>: ${Util.comma(d.value)} calls`;
					$(this).tooltipster({ content: contentStr });
				});
		chart.selectAll('.sec-point')
			.data(trendData)
			.enter().append('circle')
				.attr('class', 'sec-point')
				.attr('r', 1)
				.style('clip-path', 'url(#clip)')
				.each(function(d) {
					const dateStr = d3.timeFormat('%B %-d, %Y')(d.date);
					const contentStr = `<b>${dateStr}</b>: ${Util.comma(d.value)} calls`;
					$(this).tooltipster({ content: contentStr });
				});

		// add axis labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', height + 50)
			.text('');
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', -height / 2)
			.attr('y', -40)
			.attr('transform', 'rotate(-90)')
			.style('font-size', '0.9em')
			.text('Daily Calls Received');

		// add overlay for mouseover
		const focus = chart.append('g')
			.attr('class', 'focus')
			.style('display', 'none');
		focus.append('circle').attr('r', 2);
		focus.append('rect')
			.attr('class', 'focus-box')
			.attr('x', -50)
			.attr('y', -47)
			.attr('width', 100)
			.attr('height', 37);
		const focusText = focus.append('g');
		focusText.append('text')
			.attr('y', -35)
			.attr('dy', '.35em');
		focusText.append('text')
			.attr('y', -20)
			.attr('dy', '.35em');
		chart.append('rect')
			.attr('class', 'overlay')
			.attr('width', width)
			.attr('height', height)
			.on('mouseover', () => d3.selectAll('.focus').style('display', null))
			.on('mouseout', () => d3.selectAll('.focus').style('display', 'none'))
			.on('mousemove', function() {
				const x0 = x.invert(d3.mouse(this)[0]);
				const i = bisectDate(trendData, x0, 1);
				const d0 = trendData[i - 1];
				const d1 = trendData[i];
				const endDate = d1 ? d1.date : App.cwDate;
				const d = x0 - d0.date > endDate - x0 ? d1 : d0;
				const focus = d3.select('.focus')
					.attr('transform', `translate(${x(d.date)}, ${y(d.value)})`);
				focusText.select('text:first-child').text(d3.timeFormat('%b %-d, %Y')(d.date));
				focusText.select('text:nth-child(2)').text(`${Util.comma(d.value)} calls`);
			});
		const bisectDate = d3.bisector(d => d.date).left;

		// add time changing mechanic
		const brush = d3.brushX()
			.extent([[0, 0], [width, height2]])
			.on('brush end', () => {
				const s = d3.event.selection || x2.range();
				x.domain(s.map(x2.invert, x2));
				chart.selectAll('.point, .sec-point')
					.attr('cx', d => x(d.date))
					.attr('cy', d => y(d.value));
				chart.select('.line').attr('d', line);
				chart.select('.area').attr('d', area);
				chart.select('.x-axis').call(xAxis);
			});
		secChart.append('g')
			.attr('class', 'brush')
			.call(brush)
			.call(brush.move, [width * (1 - (initialRange[1] - initialRange[0]) / (App.cwDate - App.earliestDate)), width]);
	}


	/**
	 * Builds a generic pie chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} data The data for the pie chart
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildPieChart = (selector, data, param = {}) => {
		// draw the chart
		const margin = { top: 0, right: 10, bottom: 5, left: 10 };
		const width = 260;
		const height = 260;
		const radius = Math.min(width, height) / 2;

		const chart = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);
		
		// adjust data so pie slices have min widths
		let tot = 1.0;
		let pieRemaining = 1.0;
		const thresh = 0.07;
		data.forEach((d) => {
			if (d.value === 0) return;
			const curVal = d.value;
			if (d.value < thresh) {
				tot -= d.value;
				pieRemaining -= thresh;
				d.valueSlice = thresh;
			}
		});
		data.forEach((d) => {
			if (!d.valueSlice) d.valueSlice = (d.value/tot) * pieRemaining;
		});

		const arc = d3.arc()
			.outerRadius(radius - 10)
			.innerRadius(radius - 90);
		const labelArc = d3.arc()
			.outerRadius(radius - 50)
			.innerRadius(radius - 50);
		const expArc = d3.arc()
			.outerRadius(radius - 2)
			.innerRadius(radius - 86);
		const expLabelArc = d3.arc()
			.outerRadius(radius - 44)
			.innerRadius(radius - 44);
		const pie = d3.pie()
			.value(d => d.valueSlice);

		const pieces = chart.selectAll('.arc')
			.data(pie(data))
			.enter().append('g')
				.attr('class', 'arc')
				.attr('name', d => d.data.name)
				.on('expand', (d) => {
					const arcElement = d3.select(d3.event.currentTarget);
					arcElement.select('path').transition()
						.attr('d', expArc);
					arcElement.select('text').transition()
						.attr('transform', d => `translate(${expLabelArc.centroid(d)})`);
				})
				.on('shrink', (d) => {
					const arcElement = d3.select(d3.event.currentTarget);
					arcElement.select('path').transition()
						.attr('d', arc);
					arcElement.select('text').transition()
						.attr('transform', d => `translate(${labelArc.centroid(d)})`);
				})
				.each(function(d) {
					$(this).tooltipster({
						content: `<b>${Util.percentize(d.data.value)}</b> of callers ${d.data.fullText}`,
					});
				});
		pieces.append('path')
			.attr('d', arc)
			.style('fill', d => d.data.color);
		pieces.append('text')
			.attr('class', 'arc-label')
			.attr('transform', d => `translate(${labelArc.centroid(d)})`)
			.attr('dy', '.35em')
			.style('fill', (d, i) => (i < 3) ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,1)')
			.text(d => Util.percentize(d.data.value));

		return chart;
	}


	/**
	 * Builds a comparative distribution bar chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} data The data of the chart
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildCompDistBarChart = (selector, chartData, param = {}) => {
		// remove NaN values by setting them to zero if they exist
		for (let obj in chartData) {
			if (isNaN(chartData[obj].natValue)) chartData[obj].natValue = 0.0;
			if (isNaN(chartData[obj].value)) chartData[obj].value = 0.0;
			if (chartData[obj].dataName === '' && chartData[obj].value === 0.0) chartData.splice(obj, 1);
		}
		const showNationwideComparison = param.resolution === 'state' || param.resolution === 'center';
		if (showNationwideComparison) param.height = 400;

		// calculate bar heights and y-values based on how many will be shown

		const margin = {
			top: param.marginTop || 40,
			right: param.marginRight || 60,
			bottom: param.marginBottom || 15,
			left: param.marginLeft || 195,
		};

		const width = param.width || 300;
		if (param.resolution === 'national') margin.left = margin.left - 65;
		const height = param.height || 400;
		const chartContainer = d3.selectAll(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// define y scale and colors
		const yGroup = d3.scaleBand()
			.padding(0.5)
			.domain(chartData.map(d => d.name))
			.range([0, height]);
		
		const yBars = d3.scaleBand();
			

		// get yBars domain
		const yBarsDomain = ['resCalls'];
		if (param.compareTosAcs) yBarsDomain.push('acs');
		if (showNationwideComparison) yBarsDomain.push('natCalls');
		yBars
			.domain(yBarsDomain)
			.rangeRound([0, yGroup.bandwidth()]);

		const bandwidth = yBars.bandwidth();
		const barColors = param.colors || ['#10167f', '#7c81b8', '#bbb'];

		// draw axes
		const xAxis = d3.axisTop()
			.ticks(4)
			.tickFormat(param.tickFormat || Util.percentize)
			.tickSizeInner(-height)
			.tickSizeOuter(0);
		const xAxisG = chart.append('g')
			.attr('class', 'x-axis axis');

		// draw bars
		const barGroups = chart.selectAll('.bar-group')
			.data(chartData, d=>d.name)
			.enter().append('g')
				.attr('transform', d => `translate(0, ${yGroup(d.name)})`);

		// calls at resolution
		barGroups.append('rect')
			.attr('class', 'bar pri-bar')
			.attr('height', bandwidth)
			.attr('y', function(d){
				return yBars('resCalls');
			})
			.style('fill', barColors[0]);

		if (param.compareToAcs) {
			// acs comparison
			barGroups.append('rect')
				.attr('class', 'bar sec-bar')
				.attr('y', bandwidth / 2)
				.attr('height', bandwidth / 2)
				.style('fill', barColors[1]);
		}

		if (showNationwideComparison) {
			barGroups.append('rect')
			.attr('class', 'bar thd-bar')
			.attr('y', yBars('natCalls'))
			.attr('height', bandwidth)
			.style('fill', barColors[2]);
		}

		// get baseline label based on resolution; defines
		// what ACS data resolution is used for comparison, and
		// what call data resolution is used for comparison if
		// applicable
		switch (param.resolution) {
			case 'national':
				var acsLabel = '';
				var resLabel = '';
				// don't compare to anything else
				break;
			case 'state':
				var acsLabel = 'state';
				var callsLabel = 'nationwide';
				var resLabel = 'state';
				break;
			case 'center':
				var acsLabel = 'state';
				var callsLabel = 'nationwide';
				var resLabel = 'center';
				break;
		}

		// draw bar labels
		const topLabelLeft = (resLabel === '') ? -35 : -90;
		barGroups.append('text')
			.attr('class', 'bar-label')
			.attr('x', -5)
			.attr('y', bandwidth / 2)
			.attr('alignment-baseline', 'middle')
			.text(resLabel);
		if (param.compareToAcs) {
			barGroups.append('text')
				.attr('class', 'bar-label')
				.attr('x', -5)
				.attr('y', 3 * bandwidth / 4 + 5)
				.text(acsLabel +' pop.');
		}
		if (showNationwideComparison) {
			barGroups.append('text')
			.attr('class', 'bar-label')
			.attr('x', -5)
			.attr('y', yBars('natCalls') * 1.5)
			.attr('alignment-baseline', 'middle')
			.text('nationwide');
		}
		barGroups.append('text')
			.attr('class', 'top-bar-label bar-label')
			.attr('x', topLabelLeft)
			.attr('y', yGroup.bandwidth() / 2)
			.attr('alignment-baseline', 'middle')
			.style('font-size', '0.9em')
			.style('fill', d => d.dataName === '' ? '#c91414' : '')
			.text(d => d.name);

		// if too long, use multiple lines
		// const $topBarLabels = $('.top-bar-label').attr('dy', '.35em');
		barGroups.selectAll('.top-bar-label').call(wrap, 100, {demoChart:true});
		$('.top-bar-label tspan').attr('x', topLabelLeft);

		// add value labels, if applicable
		barGroups.append('text')
			.attr('class', 'pri-bar-value bar-value')
			.attr('alignment-baseline', 'middle')
			.attr('y', bandwidth/2);
		if (param.includeAverageValues) {
			barGroups.append('text')
				.attr('class', 'sec-bar-value bar-value')
				.attr('alignment-baseline', 'middle')
				.attr('y', 3 * bandwidth / 4 + 4);
		}

		const yAxis = d3.axisLeft()
			.tickSizeInner(0)
			.tickFormat('')
			.scale(yGroup);
		const yAxisG = chart.append('g')
			.attr('class', 'y-axis axis')
			.call(yAxis);

		chart.update = function(data) {
			// remove NaN values by setting them to zero if they exist
			for (let obj in data) {
				if (isNaN(data[obj].natValue)) data[obj].natValue = 0.0;
				if (isNaN(data[obj].value)) data[obj].value = 0.0;
			}
			// define scales
			const defaultRange = [0, 1];
			var maxValue = 0.0;
			if (showNationwideComparison) {
				maxValue = d3.max([
					d3.max(data.map(d => d.value)), 
					d3.max(data.map(d => d.acsValue)),
					d3.max(data.map(d => d.natValue))
				]);
			} else {
				maxValue = d3.max([d3.max(data.map(d => d.value)), d3.max(data.map(d => d.acsValue))]);
			}
			maxValue = (Math.ceil(10 * maxValue) + 1) / 10;
			if (maxValue < 1) defaultRange[1] = maxValue;
			const x = d3.scaleLinear()
				.domain(param.range || defaultRange)
				.range([0, width]);

			xAxis.scale(x);
			xAxisG.call(xAxis)
				.selectAll('.tick text')
					.attr('y', -5);

			barGroups.data(data, d=>d.name);

			// update bars
			barGroups.select('.pri-bar').transition()
				.attr('width', d => x(d.value))
				.each(function(d) {
					const contentStr = `${Util.comma(d.num)} of ${Util.comma(d.numCalls)} calls (${Util.percentizeOne(d.value)})`;
					$(this).tooltipster({content:contentStr, trigger:'hover'});
				});
			barGroups.select('.sec-bar').transition()
				.attr('width', d => x(d.acsValue));
			if (showNationwideComparison) {
				barGroups.select('.thd-bar').transition()
					.attr('width', d => x(d.natValue))
					.each(function(d) {
						const contentStr = `${Util.comma(d.natNum)} of ${Util.comma(d.natCalls)} calls (${Util.percentizeOne(d.natValue)})`;
						$(this).tooltipster({content:contentStr, trigger:'hover'});
					});
			}
			barGroups.select('.pri-bar-value')
				.text((d) => {
					if (isNaN(d.value)) {
						return '0.0%';
					} else {
						const text = Util.percentizeOne(d.value);
						if (d.value === 0) return '0.0%';
						return (text === '0.0%') ? '< 0.1%' : text;
					}
				})
				.transition()
					.attr('x', d => x(d.value) + 5)
			if (param.includeAverageValues) {
				barGroups.select('.sec-bar-value')
				.text(d => Util.percentizeOne(d.acsValue))
				.transition()
					.attr('x', d => x(d.acsValue) + 5);
			}

		}

		chart.update(chartData);

		return chart;
	}


	/**
	 * Builds a gender comparison chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} data The data of the chart
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildBarLabelChart = (selector, data, param = {}) => {
		// remove zero-valued data
		var newData = [];
		for (let obj in data) {
			const removeData = data[obj].value === 0;
			if (!removeData) {
				newData.push(data[obj]);
			}

			// don't build the chart if any data are NaN
			if (isNaN(data[obj].value)) {
				if (selector.includes('-sick')) {
					$('.status-chart-container.sick > .status-chart-title').text('');
					$('.status-chart-container.sick > .status-chart-sick').remove();
					$('.no-sick-calls-message-box').html('No callers were <b>sick or caring for someone who was sick</b>.');
					$('.show-prescriptions').hide();
				} else if (selector.includes('-unsick')) {
					$('.status-chart-container.unsick > .status-chart-title').text('');
					$('.status-chart-container.unsick > .status-chart-unsick').remove();
					$('.no-unsick-calls-message-box').html('No callers were <b>neither sick nor caring for someone who was sick</b>.');					
				}
				return;
			}
		}
		data = newData;

		// draw the chart
		const margin = { top: 100, right: 20, bottom: 30, left: 20 };
		const rectHeight = 24;
		const width = 480;
		const height = 100;

		const chart = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scaleLinear()
			.range([0, width]);
		const xAxis = d3.axisTop(x)
			.tickSizeInner(0)
			.tickSizeOuter(0)
			.tickFormat(() => '');
		chart.append('g')
			.call(xAxis);

		const widthTypes = [];
		var fixedValTotal = 0.0;
		var fixedCount = 0;
		// determine whether bar should be min fixed width or dynamic
		const minFixedWidthVal = 0.08;
		for (let i = 0; i < data.length; i++) {
			if (data[i].value < minFixedWidthVal) {
				widthTypes.push('minFixed');
				fixedCount++;
				fixedValTotal += data[i].value;
			} else {
				widthTypes.push('dynamic');
			}
		}
		const remainingValTotal = 1 - fixedValTotal;

		// declare what fixed width should be
		const minFixedWidth = x(minFixedWidthVal);

		// setup scale for dynamic bars
		if (fixedCount > 0) {
			const dynamicRangeLeft = 0;
			const dynamicRangeRight = width - fixedCount * minFixedWidth;
			x.range([dynamicRangeLeft, dynamicRangeRight]);
		}

		// add bar groups
		let runningX = 0;
		const barGroups = chart.selectAll('.bar-group')
			.data(data)
			.enter().append('g')
				.attr('class', 'bar-group')
				.attr('transform', (d, i) => {
					const oldX = runningX;
					if (widthTypes[i] === 'minFixed') {
						runningX += minFixedWidth;
					} else {
						runningX += x(d.value/remainingValTotal);
					}
					return `translate(${oldX}, 0)`;
				})
				.on('mouseover', (d, i) => {
					const rectElement = d3.event.currentTarget;
					$(rectElement).parent().append($(rectElement));
					d3.select(rectElement).select('rect').transition()
						.attr('x', -2)
						.attr('y', -2)
						.attr('width', () => {
							if (widthTypes[i] === 'minFixed') {
								return 4 + (minFixedWidth);
							} else {
								return 4 + (x(d.value / remainingValTotal));
							}
						})
						.attr('height', rectHeight + 4);
				})
				.on('mouseout', (d, i) => {
					const rectElement = d3.event.currentTarget;
					d3.select(rectElement).select('rect').transition()
						.attr('x', 0)
						.attr('y', 0)
						.attr('width', () => {
							if (widthTypes[i] === 'minFixed') {
								return (minFixedWidth);
							} else {
								return (x(d.value / remainingValTotal));
							}
						})
						.attr('height', rectHeight);
				});

		// add the colored bars
		barGroups.append('rect')
			.attr('width', (d, i) => {
				if (widthTypes[i] === 'minFixed') {
					return minFixedWidth;
				} else {
					return x(d.value/remainingValTotal);
				}
			})
			.attr('height', rectHeight)
			.style('fill', d => d.color);

		// add value labels
		barGroups.append('text')
			.attr('class', 'value-label')
			.attr('x', (d, i) => {
					if (widthTypes[i] === 'minFixed') {
						return minFixedWidth / 2;
					} else {
						return x(d.value / remainingValTotal) / 2;
					}
				})
			.attr('y', rectHeight / 2 + 1)
			.attr('dy', '.35em')
			.style('fill', (d) => d.valColor)
			.style('cursor','pointer')
			.text(d => Util.percentize(d.value,{noZero: true}));

		// add labels
		const wrapScale = d3.scaleLinear()
			.domain([0, 0.3])
			.range([30, 100]);
		barGroups.append('line')
			.attr('class', 'legend-line')
			.each(function(d, i) {
				const curLine = d3.select(this);

				curLine
					.attr('x1', () => {
						if (widthTypes[i] === 'minFixed') {
							return minFixedWidth / 2;
						} else {
							return x(d.value / remainingValTotal) / 2;
						}
					})
					.attr('x2', () => {
						if (widthTypes[i] === 'minFixed') {
							return minFixedWidth / 2;
						} else {
							return x(d.value / remainingValTotal) / 2;
						}
					})
					.attr('y1', () => {
						if (i % 2 === 0) {
							return 0;
						} else {
							return rectHeight;
						}
					})
					.attr('y2', () => {
						if (i % 2 === 0) {
							return -14;
						} else {
							return rectHeight + 14;
						}
					})
			});
			
		barGroups.append('text')
			.attr('class', 'legend-text')
			.attr('y', rectHeight + 26)
			.attr('dy', '.35em')
			.text(d => d.text)
			.each(function(d) {
				const wrapWidth = (d.value < 0.3) ? wrapScale(d.value) : 100;
				d3.select(this).call(wrap, wrapWidth, {dispoChart: true, floatDown: true});
			});

		// put bar labels in correct horizontal position
		barGroups.each(function(d, i) {
			d3.select(this).selectAll('tspan')
				.attr('x', () => {
					if (widthTypes[i] === 'minFixed') {
						return minFixedWidth / 2;
					} else {
						return x(d.value / remainingValTotal) / 2;
					}
				});
		});

		// put bar labels in alternating vertical positions
		const baseY = -2; // em
		barGroups.each(function(d, i) {
			const curGroup = d3.select(this);
			const curTspans = curGroup.selectAll('tspan');
			const nTspans = curTspans.size();

			curTspans
				.attr('y', function() {
					if (i % 2 === 0) {
						return (baseY - 1.1*(nTspans - 1)) + 'em';
					} else {
						return d3.select(this).attr('y');
					}
				})
		});

		// add tooltips
		barGroups.each

		return chart;
	}


	/**
	 * Builds a gender comparison chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} data The data of the chart
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildGenderChart = (selector, chartData, param = {}) => {		
		// set nans to zero if they exist
		for (let obj in chartData) {
			if (isNaN(chartData[obj].natValue)) chartData[obj].natValue = 0.0;
			if (isNaN(chartData[obj].value)) chartData[obj].value = 0.0;
		}

		// start building the chart
		const margin = {
			top: param.marginTop || 30,
			right: param.marginRight || 40,
			bottom: param.marginBottom || 20,
			left: param.marginLeft || 40,
		};
		const width = param.width || 220;
		const height = param.height || 200;
		const chart = d3.selectAll(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')	
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

				
		// define image width scale
		const imageWidthScale = d3.scaleLinear()
			.range([20, 64]);
		
		// define scale for radius of 'other' circle
		const otherRadiusScale = d3.scaleLinear()
			.range([4, 30]);
		
		// define font size scale
		const fontSizeScale = d3.scaleLinear()
			.range([12, 26]);
		const debugXMod = 25;
		const woman = chart.append('image')
			.data(chartData)
			.attr('class','gender-icon')
			.attr('xlink:href', 'img/woman.png');

		chart.append('line')
			.attr('x1', 100 - debugXMod)
			.attr('x2', 100 - debugXMod)
			.attr('y2', 200)
			.style('stroke', '#333');
		chart.append('line')
			.attr('x1', 125 + debugXMod)
			.attr('x2', 125 + debugXMod)
			.attr('y2', 200)
			.style('stroke', '#333');
		const man = chart.append('image')
			.attr('class','gender-icon')
			.attr('xlink:href', 'img/man.png')
			.attr('x', 125 + debugXMod);
			
		// circle representing 'other'
		const otherCircle = chart.append('circle')
			.attr('class','gender-icon')
			.attr('cx', 112.5)
			.attr('cy', 112.5);
			
		// label for 'women'
		chart.append('text')
			.attr('x', 65 - debugXMod)
			.attr('y', 10)
			.style('font-weight', 600)
			.style('text-anchor', 'end')
			.text('Women');
			
		// percent text for 'women'
		const womanText = chart.append('text')
			.attr('x', 65 - debugXMod)
			.attr('y', 30)
			//.style('font-size', femaleFontSize)
			.style('font-weight', 600)
			.style('text-anchor', 'end')
			
		// percent text for 'other'
		const otherText = chart.append('text')
			.attr('x', 112.5)
			.attr('y', 30)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
		chart.append('text')
			.attr('x', 160 + debugXMod)
			.attr('y', 10)
			.style('font-weight', 600)
			.text('Men');
			
		// chart label for 'other'
		chart.append('text')
			.attr('x', 112.5)
			.attr('y', 10)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
			.text('Other');
		const manText = chart.append('text')
			.attr('x', 160+ debugXMod)
			.attr('y', 30)
			//.style('font-size', maleFontSize)
			.style('font-weight', 600)

		chart.update = (data) => {
			// set nans to zero if they exist
			for (let obj in data) {
				if (isNaN(data[obj].natValue)) data[obj].natValue = 0.0;
				if (isNaN(data[obj].value)) data[obj].value = 0.0;
			}

			// define percs
			const malePerc = data[0].value;
			const femalePerc = data[1].value;
			const otherPerc = data[2].value;

			imageWidthScale.domain([0, d3.max([malePerc, femalePerc, otherPerc])]);
			otherRadiusScale.domain([0, d3.max([malePerc, femalePerc, otherPerc])]);

			const femaleWidth = imageWidthScale(femalePerc);
			const maleWidth = imageWidthScale(malePerc);
			const femaleFontSize = fontSizeScale(femalePerc);
			const maleFontSize = fontSizeScale(malePerc);
			const otherFontSize = fontSizeScale(otherPerc);
			const otherRadius = otherRadiusScale(otherPerc);

			const maleData = chartData.find(d => d.dataName === "Male");
			const contentStrM = `${Util.comma(maleData.num)} of ${Util.comma(maleData.numCalls)} calls (${Util.percentizeOne(maleData.value)})`;
			$(man.node()).tooltipster({content:contentStrM, trigger:'hover'});

			const femaleData = chartData.find(d => d.dataName === "Female");
			const contentStrF = `${Util.comma(femaleData.num)} of ${Util.comma(femaleData.numCalls)} calls (${Util.percentizeOne(femaleData.value)})`;
			$(woman.node()).tooltipster({content:contentStrF, trigger:'hover'});

			const otherData = chartData.find(d => d.dataName === "Other");
			const contentStrO = `${Util.comma(otherData.num)} of ${Util.comma(otherData.numCalls)} calls (${Util.percentizeOne(otherData.value)})`;
			$(otherCircle.node()).tooltipster({content:contentStrO, trigger:'hover'});

			man.style('cursor','pointer');
			woman.style('cursor','pointer');
			otherCircle.style('cursor','pointer');

			woman.transition()
				.attr('x', 100 - femaleWidth - debugXMod)
				.attr('y', (femaleWidth > maleWidth) ? 50 : 50 + (64 - femaleWidth))
				.attr('width', femaleWidth)
				.attr('height', 2 * femaleWidth);
			man.transition()
				.attr('y', (maleWidth > femaleWidth) ? 50 : 50 + (64 - maleWidth))
				.attr('width', maleWidth)
				.attr('height', 2 * maleWidth);
			otherCircle.transition()
				.attr('r', otherRadius);

			womanText.text(Util.percentize(femalePerc));
			manText.text(Util.percentize(malePerc));
			otherText.text(Util.percentize(otherPerc));
		};

		chart.update(chartData);

		return chart;
	}




	/**
	 * Builds an age group chart
	 * @param {String} selector The selector to draw the chart in
	 * @param {Object} data The data of the chart
	 * @param {Object} param Parameters
	 * @return {Object} The svg of the chart
	 */
	Charts.buildAgeChart = (selector, chartData, param = {}) => {

		for (let obj in chartData) {
			if (isNaN(chartData[obj].natValue)) chartData[obj].natValue = 0.0;
			if (isNaN(chartData[obj].value)) chartData[obj].value = 0.0;
		}

		// if resolution is 'state' or 'center', then show the comparison
		// to call demographics nationwide
		const showNationwideComparison = param.resolution === 'state' || param.resolution === 'center';
		if (showNationwideComparison) param.width = 400;

		// start building the chart
		const margin = {
			top: param.marginTop || 60,
			right: param.marginRight || 20,
			bottom: param.marginBottom || 20,
			left: param.marginLeft || 95,
		};
		const width = param.width || 250;
		const height = param.height || 260;
		const chart = d3.selectAll(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')	
				.attr('transform', `translate(${margin.left}, ${margin.top})`);
		
		// define scales
		const y = d3.scaleLinear()
			.domain([0, 1]) // TODO check that this max is right
			.range([0, height]);

		const y0 = d3.scaleOrdinal()
			.domain([2, 6, 18, 50, 65])
			.range([4*y(0.2), 3*y(0.2), 2*y(0.2), 1*y(0.2), 0*y(0.2) ]);

		const yTickScale = d3.scaleOrdinal()
			.domain([2, 6, 18, 50, 65, 100])
			.range([5*y(0.2), 4*y(0.2), 3*y(0.2), 2*y(0.2), 1*y(0.2), 0 ]);

		const textScale = d3.scaleLinear()
			.domain([0, 0.5])
			.range([11, 26]);

		const colors = ['#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f'];
		
		// draw text values
		const firstGroupOffset = 70;
		const secondGroupOffset = 190;
		const thirdGroupOffset = 310;
		chart.selectAll('.text-value-1')
			.data(chartData, d => d.age1)
			.enter().append('text')
				.attr('class', 'text-value text-value-1')
				.attr('x', firstGroupOffset);
		chart.selectAll('.text-value-2')
			.data(chartData, d => d.age1)
			.enter().append('text')
				.attr('class', 'text-value text-value-2')
				.attr('x', secondGroupOffset);
		if (showNationwideComparison) {
			chart.selectAll('.text-value-3')
				.data(chartData, d => d.age1)
				.enter().append('text')
					.attr('class', 'text-value text-value-3')
					.attr('x', thirdGroupOffset);
		}

		// add group age range labels
		chartData = chartData.sort(Util.compareAgebyAge1);
		const rangeLabels = chart.selectAll('.age-range-label')
			.data(chartData, d => d.age1)
			.enter().append('text')
				.attr('class', '.age-range-label')
				.style('font-size','.9em')
				.attr('text-anchor', 'end')
				.attr('alignment-baseline', 'middle')
				.text(d => {
					if (d.age1 === 65) return '65+';
					return d.age1 + ' - ' + (d.age2 - 1);
				})
				.attr('x', -10)
				.attr('y', d => y0(height - d.age1) + y(0.2) / 2);

		const totalValue = _.reduce(_.pluck(chartData, 'value'), function(memo, num){ return memo + num; }, 0);

		chart.selectAll('.text-value')
			.attr('y', (d) => {
				return y0(d.age1) + y(0.2)/2;
			})
			.attr('dy', '.35em')
			.style('text-anchor', 'middle')
			.style('font-weight', 600);

		// get baseline label based on resolution; defines
		// what ACS data resolution is used for comparison, and
		// what call data resolution is used for comparison if
		// applicable
		switch (param.resolution) {
			case 'national':
				var acsLabel = 'National';
				var areaLabel = 'Nationwide';
				// don't compare to anything else
				break;
			case 'state':
				var acsLabel = 'State';
				var areaLabel = 'from State';
				break;
			case 'center':
				var acsLabel = 'State';
				var areaLabel = 'to Center';
				break;
		}

		// draw hor labels
		chart.append('text')
			.attr('class', 'age-chart-text-label')
			.attr('x', firstGroupOffset)
			.attr('y', -29)
			.style('font-weight', 600)
			.text('Calls');
		chart.append('text')
			.attr('class', 'age-chart-text-label')
			.attr('x', firstGroupOffset)
			.attr('y', -12)
			.style('font-weight', 600)
			.text(areaLabel);
		chart.append('text')
			.attr('class', 'age-chart-text-label')
			.attr('x', secondGroupOffset)
			.attr('y', -29)
			.text(acsLabel);
		chart.append('text')
			.attr('class', 'age-chart-text-label')
			.attr('x', secondGroupOffset)
			.attr('y', -12)
			.text('Population');
		if (showNationwideComparison) {
			chart.append('text')
				.attr('class', 'age-chart-text-label')
				.attr('x', thirdGroupOffset)
				.attr('y', -29)
				.text('Calls');
			chart.append('text')
				.attr('class', 'age-chart-text-label')
				.attr('x', thirdGroupOffset)
				.attr('y', -12)
				.text('Nationwide');
		}

		// draw axes
		const yAxis = d3.axisLeft()
			// .tickValues([2, 6, 18, 50, 65])
			.tickFormat('')
			.scale(yTickScale);
		const yAxisG = chart.append('g')
			.attr('class', 'y-axis axis')
			.call(yAxis);

		// vert axis labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', -height / 2)
			.attr('y', -80)
			.attr('transform', 'rotate(-90)')
			.style('font-weight', 'bold')
			.text('Age Group');

		// draw axis color bar
		chart.selectAll('.color-bar')
			.data(chartData, d => d.age1)
			.enter().append('rect')
				.attr('class', 'color-bar')
				.attr('y', d => {
					return y0(height - d.age1);
				})
				.attr('width', 12)
				.attr('height', (d) => {
					return y(0.2);
				})
				.style('fill', (d, i) => colors[i])
				.on('click', () => {
					App.showContent('calls');
				});
				

		// draw guidelines
		const guidelineData = [2, 6, 18, 50, 65, 100];
		chart.selectAll('.guideline')
			.data(guidelineData)
			.enter().append('line')
				.attr('x2', width)
				.attr('y1', d => yTickScale(d))
				.attr('y2', d => yTickScale(d))
				.style('stroke', 'rgba(0,0,0,0.3)')
				.style('stroke-width', 1)
				.style('stroke-dasharray', '3,3');

		chart.update = function(data) {
			// set nans to zero if they exist
			for (let obj in data) {
				if (isNaN(data[obj].natValue)) data[obj].natValue = 0.0;
				if (isNaN(data[obj].value)) data[obj].value = 0.0;
			}

			chart.selectAll('.text-value-1')
				.data(data, d => d.age1)
					.text(d => Util.percentize(d.value))
					.style('font-size', d => textScale(d.value))
					.style('cursor', 'pointer')
					.each(function(d) {
						const contentStr = `${Util.comma(d.num)} of ${Util.comma(d.numCalls)} calls (${Util.percentizeOne(d.value)})`;
						$(this).tooltipster({content:contentStr, trigger:'hover'});
					});
			if (param.compareToAcs) {
				chart.selectAll('.text-value-2')
					.data(data, d => d.age1)
						.text(d => (d.acsValue) ? Util.percentize(d.acsValue) : '--')
						.style('font-size', d => textScale(d.acsValue));
			}
			if (showNationwideComparison) {
				chart.selectAll('.text-value-3')
					.data(data, d => d.age1)
						.text(d => Util.percentize(d.natValue))
						.style('font-size', d => textScale(d.natValue))
						.style('cursor', 'pointer')
						.each(function(d) {
							const contentStr = `${Util.comma(d.natNum)} of ${Util.comma(d.natCalls)} calls (${Util.percentizeOne(d.natValue)})`;
							$(this).tooltipster({content:contentStr, trigger:'hover'});
						});
			}
		};

		chart.update(chartData);

		return chart;
	};


	/**
	 * Builds a call volume radial chart
	 * @param {String} selector The selector to draw the chart in
	 * @return {Object} The svg of the chart
	 */
	Charts.buildCallVolumeChart = (selector, callData) => {
		d3.select('.systems-volume-chart').html('');
		const numMinutesPerArc = 15;
		const dx = numMinutesPerArc / 60;

		const callDataByTime = callData.map((d) => {
			const callObj = $.extend(true, {}, d);
			const date = new Date(callObj.create_stamp);
			const hour = date.getHours();
			const minutes = date.getMinutes();

			// set value by every 15 minutes
			callObj.index = (hour / dx) + Math.floor(minutes / numMinutesPerArc);
			return callObj;
		});

		const chartData = [];
		for (let i = 0; i < 24; i += dx) {
			const index = i * (60 / numMinutesPerArc);
			const numCalls = callDataByTime.filter(d => d.index === index).length;
			const numAvgCalls = numCalls / 7;
			chartData.push({
				time: i,
				value: numAvgCalls,
			});
		}

		// draw the chart
		const margin = { top: 0, right: 10, bottom: 20, left: 10 };
		const width = 480;
		const height = 480;
		const radius = Math.min(width, height) / 2;
		const innerRadius = 90;

		const chart = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

		const colorScale = d3.scaleLinear()
			.domain([0, d3.max(chartData, d => d.value)])
			.range(['#f2f0f7','#4a1486']);

		const x = d3.scaleLinear()
			.range([innerRadius, radius])
		const arc = d3.arc()
			.startAngle((d, i) => (i * 2 * Math.PI) / (24 / dx))
			.endAngle((d, i) => ((i + 1) * 2 * Math.PI) / (24 / dx))
			.outerRadius(d => x(d.value))
			.innerRadius(innerRadius);

		// add line around
		/*const line = d3.radialLine()
			.angle((d, i) => (i * 2 * Math.PI) / (24 / dx))
			.radius(d => x(d.value));
		chart.append('path')
			.attr('class', 'line')
			.datum(chartData)
			.attr('d', line);*/

		// add total calls label
		chart.append('text')
			.attr('class', 'total-calls-label')
			.attr('y', -10)
			.attr('dy', '.35em')
			.text(Util.comma(callData.length));
		chart.append('text')
			.attr('class', 'total-calls-label')
			.attr('y', 8)
			.attr('dy', '.35em')
			.text('total calls');

		// add axes
		const axisGroup = chart.append('g')
			.attr('class', 'axis');
		const radiusLines = axisGroup.selectAll('.axis-line')
			.data(d3.range(0, 360, 30))
			.enter().append('g')
				.attr('class', 'axis-line')
				.attr('transform', d => `rotate(${-d})`);
		radiusLines.append('line')
			.attr('x1', 20)
			.attr('x2', radius - 10);
		/*axisGroups.append('text')
			.attr('x', radius - 10)
			.attr('dy', '.35em')
			.style('text-anchor', d => (d < 270 && d > 90) ? 'end' : null)
			.attr('transform', d => (d < 270 && d > 90) ? `rotate(180 ${radius + 6}, 0)` : null)
			.text(d => {
				if (d === 0) return 'Midnight';
				else if (d === 180) return 'Noon';
				return `${d}:00`;
			});*/

		// add the actual purple arcs
		const pieces = chart.selectAll('.arc')
			.data(chartData)
			.enter().append('g')
				.attr('class', 'arc');
		pieces.append('path').each(function() {
			$(this).tooltipster({
				trigger: 'hover',
				minWidth: 400,
			});
		});

		// add axes labels
		const labels = chart.selectAll('.label')
			.data(Util.createArray(6, 23).concat(Util.createArray(0, 5)))
			.enter().append('g')
				.attr('transform', (d, i) => {
					const xCoord = 74 * Math.cos(i * 2 * Math.PI / 24);
					const yCoord = 74 * Math.sin(i * 2 * Math.PI / 24);
					return `translate(${xCoord}, ${yCoord})`;
				});
		labels.append('text')
			.attr('class', 'time-label')
			.attr('dy', '.35em')
			.style('display', (d, i) => (i % 6 === 0) ? 'inline' : 'none')
			.text((d) => {
				if (d === 0) return 'Midnight';
				else if (d === 12) return 'Noon';
				return `${d}:00`;
			});

		// add rings
		const ringData = d3.range(innerRadius, radius, 30);
		const ringGroups = axisGroup.selectAll('.ring-group')
			.data(ringData)
			.enter().append('g')
				.attr('class', 'ring-group')
				.attr('transform', 'rotate(12)');
		ringGroups.append('circle')
			.attr('class', 'ring')
			.attr('r', d => d);
		const ringText = ringGroups.append('text')
			.attr('class', 'ring-text')
			.attr('y', d => -d - 6)
			.attr('dy', '.35em')
			.style('display', (d, i) => {
				return (i === 0) ? 'none' : 'inline';
			});
		// adjust the scale
		x.domain([0, 1.1 * d3.max(chartData, d => d.value)]);

		// draw the arcs
		pieces.data(chartData);
		pieces.select('path').transition()
			.attr('d', arc)
			.style('cursor','pointer')
			.style('fill', d => colorScale(d.value));
		pieces.select('path').each(function(d) {
			const startTime = Util.convertToMinutes(d.time);
			const endTime = Util.convertToMinutes(d.time + dx);
			const contentStr = `Between <b>${startTime}</b> and <b>${endTime}</b>, ` +
				`the system handled an average of <b>${Util.decimalizeOne(d.value)}</b> calls.`;
			$(this).tooltipster('content',contentStr);
		});

		// update axes labels
		ringText.text(d => `${Util.decimalizeOne(x.invert(d))} calls`);


		function updateChart() {
			// randomize the data a little
			chartData.forEach((d) => {
				d.value *= 0.8 + 0.4 * Math.random();
			});

		}

		// updateChart();

		return { update: updateChart };
	};


	/**
	 * Builds a call log chart
	 * @param {String} selector The selector to draw the chart in
	 * @return {Object} The svg of the chart
	 */
	Charts.buildCallLogChart = (selector, data) => {
		// draw the chart
		const margin = { top: 100, right: 20, bottom: 20, left: 20 };
		const width = 520;
		const height = 50;
		const rectHeight = 10;

		const chart = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const minDate = d3.min(data, d => new Date(new Date(d.create_stamp)).getTime() - (3600 * 1000));
		const maxDate = d3.max(data, d => new Date(new Date(d.create_stamp)).getTime() + (3600 * 1000));
		const x = d3.scaleTime()
			.domain([minDate, maxDate])
			.rangeRound([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);

		// define fcn to insert line breaks in x-axis tick labels
		var insertLinebreaks = function (d) {
		    var el = d3.select(this);
		    var words = el.text().split(', ');
		    words[0] = words[0] + ", " + words[1];
		    words.splice(1,1);
		    el.text('');
		    for (var i = 0; i < words.length; i++) {
		        var tspan = el.append('tspan').text(words[i]);
		        if (i > 0)
		            tspan.attr('x', 0).attr('dy', '15');
		    }
		};

		// add the axes
		const xAxis = d3.axisTop()
			.scale(x)
			.ticks(5)
			.tickFormat(d3.timeFormat('%b %-d, %Y, %H:%M GMT%Z'));
		const yAxis = d3.axisLeft()
			.tickFormat('')
			.tickSizeInner(0)
			.scale(y);
		chart.append('g')
			.attr('class', 'x-axis axis')
			.call(xAxis);
		chart.append('g')
			.attr('class', 'y-axis axis')
			.call(yAxis);

		// rotate x-axis labels so they're diagonal
		chart.selectAll('.x-axis text')
			.attr('transform','rotate(-45)')
			.style("text-anchor", "start")
			.each(Util.insertLinebreaks);

		// shift x-axis labels so they're over the ticks
		chart.selectAll('.x-axis tspan')
			.attr('y',-20)
			.attr('x',10);

		// add the rectangles indicating each call
		const barGroups = chart.selectAll('.bar-group')
			.data(data)
			.enter().append('g')
				.attr('class', 'bar-group')
				.attr('transform', (d) => {
					return `translate(${x(new Date(d.create_stamp))}, 20)`;
				});
		barGroups.append('rect')
			.attr('class', 'bar')
			.attr('width', (d) => {
				const x1 = x(new Date(d.create_stamp));
				const x2 = x(new Date(d.create_stamp).getTime() + d.call_length * 60000);
				d.width = x2 - x1;
				return x2 - x1;
			})
			.attr('height', rectHeight);
		barGroups.append('line')
			.attr('class', 'bar-line')
			.attr('y1', -5)
			.attr('y2', rectHeight + 5);
		barGroups.append('line')
			.attr('class', 'bar-line')
				.attr('x1', d => d.width)
				.attr('x2', d => d.width)
				.attr('y1', -5)
				.attr('y2', rectHeight + 5);

		return chart;
	};

	Charts.buildPrescriptionChart = (selector, data) => {
		const margin = { top: 0, right: 0, bottom: 20, left: 0 };
		const width = 500;
		const height = 225;
		const chart = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// get scale for sizing
		const boxScale = d3.scaleLinear()
			.range([0.5, 1.0]);
		const origHeight = 149.0;

		// update takehome text
		var avMaj;
		avMaj = (data[0].value > 0.5) ? data[0] : data[1];
		const avMajStr = avMaj.name + ' (' + avMaj.dataName.split('(')[1] + '.';
		$('.av-maj-name').text(avMajStr);

		// TODO need to move the svg build into here to avoid repeating code
		data.forEach((d, i) => {
			$(`.${d.className} .value-label`).html(Util.percentizeOne(d.value));
			
			// TODO messy code for setting transitions
			if (d.name.includes('Tamiflu')) {
				// const yPerc = ((1 - d.value) * 100).toString() + '%';
				// d3.select('#fillpartial1').attr('y', yPerc);
				// d3.select('#feFlood1').attr('y', yPerc);
				// d3.select('#animate1').attr('to', yPerc);
				$('.tamiflu').tooltipster({
					content: 'For callers that were prescribed anti-viral medication, ' +
						`<b>${Util.percentizeOne(d.value)}</b> of callers were prescribed ` +
						`<b>${d.name}</b>.`
				});

				// scale box
				const bbox = d3.select('.tamiflu-box').node().getBBox();
				const scaleFactor = boxScale(d.value);
				const newHeight = origHeight * scaleFactor;
				const yShiftLabel = (origHeight - newHeight) / 2.0;
				
				const xShift = (bbox.x + bbox.width / 2.0) * (1 - scaleFactor);
				const yShift = (bbox.y + bbox.height / 2.0) * (1 - scaleFactor);
				d3.select('.tamiflu-box').transition()
					.attr('transform', `translate(${xShift} ${yShift}) scale(${scaleFactor})`);

				// move percent to right location
				d3.select('.tamiflu .value-label').transition()
					.attr('dy', yShiftLabel);

			} else if (d.name.includes('Relenza')) {
				// const yPerc = ((1 - d.value) * 100).toString() + '%';
				// d3.select('#fillpartial2').attr('y', yPerc);
				// d3.select('#feFlood2').attr('y', yPerc);
				// d3.select('#animate2').attr('to', yPerc);
				$('.relenza').tooltipster({
					content: 'For callers that were prescribed anti-viral medication, ' +
						`<b>${Util.percentizeOne(d.value)}</b> of callers were prescribed ` +
						`<b>${d.name}</b>.`
				});

				// scale box
				const bbox = d3.select('.relenza-box').node().getBBox();
				const scaleFactor = boxScale(d.value);
				const newHeight = origHeight * scaleFactor;
				const yShiftLabel = (origHeight - newHeight) / 2.0;
				
				const xShift = (bbox.x + bbox.width / 2.0) * (1 - scaleFactor);
				const yShift = (bbox.y + bbox.height / 2.0) * (1 - scaleFactor);
				d3.select('.relenza-box').transition()
					.attr('transform', `translate(${xShift} ${yShift}) scale(${scaleFactor})`);

				// move percent to right location
				d3.select('.relenza .value-label').transition()
					.attr('dy', yShiftLabel);
			}

		});

		return chart;
	};
})();
