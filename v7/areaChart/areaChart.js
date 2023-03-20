// Graph Height
const grfHeight = 600;

// d3 animation duration
let DURATION = 700;

// current pan, zoom, and rotation
let curX = 80;
let curY = 80;

// Graph Range
let rangeX = d3.scaleLinear();
let rangeY = d3.scaleLinear();

// create data list
let xData
let yData

function init() {
    lightMode();
    let src_path = "./sampleData.csv"
    drawAreaChart(src_path);
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

function drawAreaChart(src_path) {
    d3.csv(src_path).then(data => {
        // mapping data list
        xData = data.map(d => d.NO);
        yData = data.map(d => d.VALUE);

        // size of the diagram
        let windowWidth = window.innerWidth - 20;
        let windowHeight = grfHeight;
        let width = windowWidth - (curX * 2);
        let height = windowHeight - (curY * 2);

        // clear all graph
        d3.selectAll(".areaChart").remove();

        // define the svgBase, attaching a class for styling
        let svgBase = d3.select("#areaChartGrf").append("svg")
            .attr("class", "areaChart")
            .attr("width", windowWidth)
            .attr("height", windowHeight)

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
            .attr("class", "yticks")

        // add x Label
        let xLabel = svgGroup.append("text")
            .attr("class", "xlabel")
            .text("COUNT");

        // add y Label
        let yLabel = svgGroup.append("text")
            .attr("class", "ylabel")
            .text("NO");

        // set the chart
        let area = svgGroup.datum(data);
        let areaEnter = svgGroup.selectAll(".graph").data(data).enter();
        let grfArea = area.append("path");

        // add click listener
        let clickListener = svgGroup.append("rect")
            .attr("class", "listening-rect")

        // add tooltip
        let tooltip = d3.select("#tooltip");

        // add result table
        let resultTable = d3.select("#resultTable");

        // add tooltip line (y line)
        let tooltipLine = svgGroup
            .append("g")
            .append("rect")
            .attr("class", "tooltip-line")
            .attr("stroke-width", ".1px")
            .attr("width", "2px")
            .attr("height", height);

        // add tooltip circle
        let tooltipCircle = svgGroup
            .append("circle")
            .attr("class", "tooltip-circle")
            .attr("r", 4)
            .style("opacity", 0);

        // set up document events
        d3.select(window).on('resize.areaChart', resize);

        let root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            let duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            data.forEach(d => d.NO = +d.NO);
            data.forEach(d => d.VALUE = +d.VALUE);

            rangeX
                .range([0, width])
                .domain(d3.extent(data, d => d.NO));
            rangeY
                .range([height, 0])
                .domain(d3.extent(data, d => +d.VALUE));

            let areaUpdate = area.transition().duration(duration);

            if (resize === false) {
                grfArea
                    .attr("class", "area")
                    .attr("fill", "#00FF00")
                    .attr("fill-opacity", 1)
                    .attr("stroke", "none")
                    .attr("d", d3.area()
                        .x(1e-6)
                        .y0(height)
                        .y1(d => rangeY(d.VALUE)));

                areaUpdate.selectAll(".area")
                    .attr("d", d3.area()
                        .x(d => rangeX(d.NO))
                        .y0(height)
                        .y1(d => rangeY(d.VALUE)));
            } else {
                areaUpdate.selectAll(".area")
                    .attr("d", d3.area()
                        .x(d => rangeX(d.NO))
                        .y0(height)
                        .y1(d => rangeY(d.VALUE)));
            }

            clickListener
                .attr("width", width < 0 ? 0 : width)
                .attr("height", height)
                .attr('pointer-events', 'all')
                .on("mousemove", onMouseMove);

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
                .attr('x', -(height / 2))
                .attr('y', -curY + 20)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle');

            yLabel
                .attr('x', (width / 2))
                .attr('y', height + 50)
                .attr('text-anchor', 'middle');

            function onMouseMove(event) {
                event.preventDefault();
                let mousePosition = d3.pointer(event)[0];
                let hoveredX = Math.round(rangeX.invert(mousePosition));
                let xPosition = rangeX(hoveredX);
                let yPosition = rangeY(yData[hoveredX - 1]);

                tooltipCircle
                    .attr("cx", xPosition + 1)
                    .attr("cy", yPosition)
                    .style("opacity", 1);

                tooltip
                    .style("transform", `translate(` + `calc(-50% + ${curX}px + 8px + ${xPosition}px),` + `calc(-100% + ${curY}px + 20px + ${yPosition}px)` + `)`)
                    .style("opacity", 1)
                tooltip.select('#tooltip_no_label').html(xData[hoveredX]);
                tooltip.select('#tooltip_value_label').html(yData[hoveredX]);

                resultTable.select("#table_no_label").html(xData[hoveredX]);
                resultTable.select('#table_value_label').html(yData[hoveredX]);
                resultTable.select('#table_link_label').attr('href', "javascript:alert(" + yData[hoveredX] + ");").html("LINK");

                tooltipLine
                    .attr("x", xPosition);
            }
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
