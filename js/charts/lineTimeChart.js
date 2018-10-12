(() => {
    App.buildLineTimeChart = (selector, data, param = {}) => {
        // remove existing
        d3.select(selector).html('');
        
        console.log(data);

        // start building the chart
        const margin = { top: 25, right: 150, bottom: 35, left: 75 };
        const width = 630;
        const height = 150;
        const color = d3.color(param.color || 'steelblue');
        const lightColor = param.lightColor || color.brighter(2);

        const chart = d3.select(selector).append('svg')
        .classed('time-chart', true)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const x = d3.scaleBand()
        .padding(1)
        .domain(data.map(d => d.year))
        .range([0, width]);
        
        const maxValue = d3.max(data, d => d3.max([d.total_spent, d.total_committed]));

        // define height of zero bar
        const y = d3.scaleLinear()
        .domain([0, 1.2 * maxValue])
        .range([height, 0])
        .nice();

        const xAxis = d3.axisBottom()
        .tickSize(0)
        .tickSizeOuter(3)
        .tickPadding(10)
        .scale(x);
        
        const yAxis = d3.axisLeft()
        .ticks(4)
        .tickSize(3)
        .tickSizeOuter(3)
        .tickPadding(10)
        .tickFormat(App.siFormat)
        .scale(y);
        
        const bandwidth = x.bandwidth();

        chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
        chart.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
        
        //lines

        const areaSpent = chart.selectAll('area-const-spent')
            .data([data])
            .enter().append('g')
        
        const area = d3.area()
            .x(d => x(d.year))
            .y0(height)
            .y1(d => y(d.total_spent));

        areaSpent.append('path')
            .attr('class', 'area')
            .attr('d', area)
            .style('fill', '#c3b3c5');
        
        
        const lineConstComm = chart.selectAll('path-const-comm')
               .data([data])
               .enter().append('g'); 
        
        const lineCommitted = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total_committed));
        
        lineConstComm.append('path')
               .attr('d', lineCommitted)
               .attr('fill', 'none')
                .attr('stroke', '#9064a4')
                .attr('stroke-width', 2)
                .style("stroke-dasharray", ("3, 3"));
        
               const lineConstSpent = chart.selectAll('path-const-spent')
               .data([data])
               .enter().append('g'); 
        
        const lineSpent = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total_spent));
        
        lineConstSpent.append('path')
               .attr('d', lineSpent)
               .attr('fill', 'none')
                .attr('stroke', '#57285a')
                .attr('stroke-width', 3);
        

          /* const lineStyles = {
            All: {
                'stroke': 'red',
                'stroke-width':3,
            },
            'total_committed': {
                'stroke': '#9064a4',
				'stroke-width': 2,
            },
            'total_spent': {
				'stroke': '#57285a',
				'stroke-width': 4,
            },
        }; */ 
        
        const pointGroups = chart.selectAll('.point-group')
            .data(data)
            .enter().append('g');
        
        pointGroups.append('circle')
            .attr('transform',d => {
                return `translate (${x(d.year)},${y(d.total_spent)})`;
            })
            .attr('r',3)
            .style('fill','white')
            .attr('stroke-width',2)
            .attr('stroke','grey')
        
        const textGroups = chart.selectAll('.text-group')
            .data(data)
            .enter().append('g');
        
        textGroups.append('text')
            .attr('class', 'bar-text')
            .attr('x', d => x(d.year))
            .attr('y',d => y(d.total_spent) - 20 )
            .attr('dy', '.35em')
            .text((d) => {
            return App.formatMoneyShort(d.total_spent)
        });
 
        // ??? TOOLTIPS ??? 
        
 
               
        
        /* // add bars
        const barGroups = chart.selectAll('.bar-group')
        .data(data)
        .enter().append('g')
        .attr('transform', d => `translate(${x(d.year)}, 0)`);

        // committed bar
        barGroups.append('rect')
        .attr('class', 'bar')
        .attr('y', d => y(d.total_committed))
        .attr('width', bandwidth / 2)
        .attr('height', d => height - y(d.total_committed))
        .style('fill', lightColor);
        barGroups.append('text')
        .attr('class', 'bar-text')
        .attr('x', bandwidth / 4)
        .attr('y', d => y(d.total_committed) - 8)
        .attr('dy', '.35em')
        .text((d) => {
            return App.formatMoneyShort(d.total_committed)
        });

        // disbursed bar
        barGroups.append('rect')
        .attr('class', 'bar')
        .attr('x', bandwidth / 2)
        .attr('y', d => y(d.total_spent))
        .attr('width', bandwidth / 2)
        .attr('height', d => height - y(d.total_spent))
        .style('fill', color);
        barGroups.append('text')
        .attr('class', 'bar-text')
        .attr('x', 3 * bandwidth / 4)
        .attr('y', d => y(d.total_spent) - 8)
        .attr('dy', '.35em')
        .text((d) => {
            return App.formatMoneyShort(d.total_spent);
        }); */

        // axis labels
        chart.append('text')
        .attr('class', 'chart-label')
        .attr('x', width/2)
        .attr('y', height + 35)
        .style('font-weight', '600')
        .text('Year');

        chart.append('text')
        .attr('class', 'chart-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height + 25)
        .attr('y', -55)
        .style('text-anchor', 'start')
        .style('font-weight', '600')
        .text('Amount (in USD)');

        // add legend
        const rectWidth = 12;
        const legend = chart.append('g')
        .attr('transform', `translate(${width + 25}, 5)`);
        const legendGroups = legend.selectAll('g')
        .data([lightColor, color])
        .enter().append('g')
        .attr('transform', (d, i) => `translate(0, ${44 * i})`);
        legendGroups.append('rect')
        .attr('width', rectWidth)
        .attr('height', 30)
        .style('fill', d => d);
        legendGroups.append('text')
        .attr('class', 'legend-label')
        .attr('x', rectWidth + 8)
        .attr('y', 11)
        .text((d, i) => (i === 0 ? 'Committed' : 'Disbursed'));
        legendGroups.append('text')
        .attr('class', 'legend-label')
        .attr('x', rectWidth + 8)
        .attr('y', 27)
        .text((d, i) => {
            if (param.moneyType === 'r') {
                return (i === 0) ? 'Funds to Receive' : 'Funds Received';
            }
            return 'Funds';
        });

        return chart;
    };
})();
