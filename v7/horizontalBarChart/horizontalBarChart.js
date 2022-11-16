// Graph Height
const grfHeight = 800;

function init() {
    lightMode();
    var src_path = "./sampleData.csv"
    drawBarChart(src_path);
}

function changeColorMode(md) {
    md === "light" ? lightMode() : darkMode();
}

function lightMode() {
    document.documentElement.setAttribute('color-theme', 'light');
}

function darkMode() {
    document.documentElement.setAttribute('color-theme', 'dark');
}

function drawBarChart(src_path) {
    d3.csv(src_path).then(data => {

        var DURATION = 700; // d3 animation duration

        // current pan, zoom, and rotation
        var curX = 80;
        var curY = 80;

        // size of the diagram
        var windowWidth = window.innerWidth - 20;
        var windowHeight = grfHeight;
        var width = windowWidth - (curX * 2);
        var height = windowHeight - (curY * 2);

        var colors = d3.scaleQuantize()
            .domain([0, width])
            .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
                "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);

        d3.selectAll(".barChart").remove();

        // define the svgBase, attaching a class for styling
        var svgBase = d3.select("#barChartGrf").append("svg")
            .attr("class", "barChart")
            .attr("width", windowWidth)
            .attr("height", windowHeight);

        // Group which holds graph
        var svgGroup = svgBase.append("g")
            .attr('transform', 'translate(' + curX + ',' + curY + ')');

        // add the title
        svgGroup.append("text")
            .attr("class", "grfTitle")
            .attr("x", width / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text("Title");

        // add the x Axis
        svgGroup.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "xticks");

        // add the y Axis
        svgGroup.append("g")
            .attr("class", "yticks");

        // add x Label
        svgGroup.append("text")
            .attr("class", "xlabel")
            .text("COUNT");

        // add y Label
        svgGroup.append("text")
            .attr("class", "ylabel")
            .text("YEAR");

        // add grid
        svgGroup.append("g")
            .attr("class", "grid")

        // set up document events
        d3.select(window).on('resize.barChart', resize);

        var root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            var duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            var x = d3.scaleLinear()
                .range([0, width]);
            var y = d3.scaleBand()
                .range([0, height])
                .padding(0.1);

            data.forEach(d => d.VALUE = +d.VALUE);

            x.domain([0, d3.max(data, d => d.VALUE)]);
            y.domain(data.map(d => d.YEAR));

            var bar = svgGroup.selectAll(".graph").data(data);

            var barEnter = bar.enter();

            if (resize == false) {
                barEnter.append("rect")
                    .attr("class", "bar")
                    .attr("fill", d => colors(x(d.VALUE)))
                    .attr("x", 0)
                    .attr("width", 1e-6)
                    .attr("y", d => y(d.YEAR))
                    .attr("height", y.bandwidth());

                barEnter.append('text')
                    .attr('class', 'barTxt')
                    .attr('x', d => x(d.VALUE) + 15)
                    .attr('y', d => y(d.YEAR) + y.bandwidth() / 2)
                    .attr('text-anchor', 'middle')
                    .style('opacity', 0.9)
                    .style('fill-opacity', 0)
                    .text(d => d.VALUE);

                var barUpdate = bar.merge(barEnter).transition().duration(duration);

                barUpdate.selectAll(".barTxt")
                    .attr('fill', 'black')
                    .attr('dy', '.35em')
                    .style('fill-opacity', 1);

                barUpdate.selectAll(".bar")
                    .attr("x", 0)
                    .attr("width", d => x(d.VALUE));
            } else {
                var barUpdate = bar.merge(barEnter).transition().duration(duration)

                barUpdate.selectAll(".bar")
                    .attr("x", 0)
                    .attr("y", d => y(d.YEAR))
                    .attr("width", d => x(d.VALUE))
                    .attr("height", y.bandwidth());

                barUpdate.selectAll('.barTxt')
                    .attr('x', d => x(d.VALUE) + 15)
                    .attr('y', d => y(d.YEAR) + y.bandwidth() / 2);
            }
            svgGroup.selectAll(".grfTitle")
                .attr("x", width / 2)
                .attr("y", -40);

            svgGroup.selectAll(".xticks")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)")
                .style("text-anchor", "end");

            svgGroup.selectAll(".yticks")
                .call(d3.axisLeft(y));

            svgGroup.selectAll(".xlabel")
                .attr('x', (width / 2))
                .attr('y', height + 50)
                .attr('text-anchor', 'middle');

            svgGroup.selectAll(".ylabel")
                .attr('x', -(height / 2))
                .attr('y', -curY + 20)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle');

            svgGroup.selectAll(".grid")
                .call(d3.axisBottom(x)
                    .scale(x)
                    .tickSize(height, 0, 0)
                    .tickFormat(''));
        }

        function resize() { // window resize
            windowWidth = window.innerWidth - 20;
            windowHeight = grfHeight
            width = windowWidth - (curX * 2);
            height = windowHeight - (curY * 2);
            svgBase.attr('width', windowWidth).attr('height', windowHeight);
            svgGroup.attr('transform', 'translate(' + curX + ',' + curY + ')');
            update(root, true, true);
        }
    });
}

init();
