(() => {
    App.buildReadyScoreChart = (selector, value, color, text) => {
        // remove existing
        d3.select(selector).html('');
        
        const height = 170;
        const width = 160;

        const chart = d3.select(selector).append('svg')
        .classed('scoreChartCirc',true)
        .attr('width',width)
        .attr('height',height)
        .append('g');
        
        chart.append('circle')
            .attr('transform',d => {
                return `translate (80,80)`;
            })
            .attr('r',60)
            .style('fill',color);
        
        chart.append('text')
        .attr('class', 'chart-label2')
        .style('text-anchor', 'middle')
        .attr('x', 80)
        .attr('y', 95)
        .style('font-weight', '600')
        .style('font-size','40px')
        .style('fill', 'white')
		.style('font-family', '\'Pathway Gothic One\', sans-serif')
        .text(value);

        chart.append('text')
        .attr('class', 'chart-label2')
        .style('text-anchor', 'middle')
        .attr('x', 80)
        .attr('y', 165)
        .style('font-weight', '600')
        .style('font-size','15px')
        .style('fill', color)
        .text(text);

        return chart;
    };
})();
