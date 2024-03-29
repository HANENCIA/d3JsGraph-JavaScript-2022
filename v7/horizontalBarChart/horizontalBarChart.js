// Graph Height
const grfHeight = 800;

// d3 animation duration
let DURATION = 700;

// current pan, zoom, and rotation
let curX = 80;
let curY = 80;

// Graph Range
let rangeX = d3.scaleLinear();
let rangeY = d3.scaleBand();

function init() {
    lightMode();
    let src_path = "./sampleData.csv"
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
        // size of the diagram
        let windowWidth = window.innerWidth - 20;
        let windowHeight = grfHeight;
        let width = windowWidth - (curX * 2);
        let height = windowHeight - (curY * 2);

        let colors = d3.scaleQuantize()
            .domain([0, width])
            .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43",
                "#D53E4F", "#9E0142"]);

        // clear all graph
        d3.selectAll(".barChart").remove();

        // define the svgBase, attaching a class for styling
        let svgBase = d3.select("#barChartGrf").append("svg")
            .attr("class", "barChart")
            .attr("width", windowWidth)
            .attr("height", windowHeight);

        // Group which holds graph
        let svgGroup = svgBase.append("g")
            .attr('transform', 'translate(' + curX + ',' + curY + ')');

        // add the title
        let grfTitle = svgGroup.append("text")
            .attr("class", "grfTitle")
            .attr("x", width / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text("Title");

        // add the x Axis
        let xTicks = svgGroup.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "xticks");

        // add the y Axis
        let yTicks = svgGroup.append("g")
            .attr("class", "yticks");

        // add x Label
        let xLabel = svgGroup.append("text")
            .attr("class", "xlabel")
            .text("COUNT");

        // add y Label
        let yLabel = svgGroup.append("text")
            .attr("class", "ylabel")
            .text("YEAR");

        // add grid
        let grfGrid = svgGroup.append("g")
            .attr("class", "grid")

        // set up document events
        d3.select(window).on('resize.barChart', resize);

        let root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            let duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            data.forEach(d => d.VALUE = +d.VALUE);

            rangeX
                .range([0, width])
                .domain([0, d3.max(data, d => d.VALUE)]);
            rangeY
                .range([0, height])
                .padding(0.1)
                .domain(data.map(d => d.YEAR));

            let bar = svgGroup.selectAll(".graph").data(data);

            let barEnter = bar.enter();

            if (resize === false) {
                barEnter.append("rect")
                    .attr("class", "bar")
                    .attr("fill", d => colors(rangeX(d.VALUE)))
                    .attr("x", 0)
                    .attr("width", 1e-6)
                    .attr("y", d => rangeY(d.YEAR))
                    .attr("height", rangeY.bandwidth());

                barEnter.append('text')
                    .attr('class', 'barTxt')
                    .attr('x', d => rangeX(d.VALUE) + 15)
                    .attr('y', d => rangeY(d.YEAR) + rangeY.bandwidth() / 2)
                    .attr('text-anchor', 'middle')
                    .style('opacity', 0.9)
                    .style('fill-opacity', 0)
                    .text(d => d.VALUE);

                let barUpdate = bar.merge(barEnter).transition().duration(duration);

                barUpdate.selectAll(".barTxt")
                    .attr('fill', 'black')
                    .attr('dy', '.35em')
                    .style('fill-opacity', 1);

                barUpdate.selectAll(".bar")
                    .attr("x", 0)
                    .attr("width", d => rangeX(d.VALUE));
            } else {
                let barUpdate = bar.merge(barEnter).transition().duration(duration)

                barUpdate.selectAll(".bar")
                    .attr("x", 0)
                    .attr("y", d => rangeY(d.YEAR))
                    .attr("width", d => rangeX(d.VALUE))
                    .attr("height", rangeY.bandwidth());

                barUpdate.selectAll('.barTxt')
                    .attr('x', d => rangeX(d.VALUE) + 15)
                    .attr('y', d => rangeY(d.YEAR) + rangeY.bandwidth() / 2);
            }
            grfTitle
                .attr("x", width / 2)
                .attr("y", -40);

            xTicks
                .call(d3.axisBottom(rangeX))
                .selectAll("text")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)")
                .style("text-anchor", "end");

            yTicks
                .call(d3.axisLeft(rangeY));

            xLabel
                .attr('x', (width / 2))
                .attr('y', height + 50)
                .attr('text-anchor', 'middle');

            yLabel
                .attr('x', -(height / 2))
                .attr('y', -curY + 20)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle');

            grfGrid
                .call(d3.axisBottom(rangeX)
                    .scale(rangeX)
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
