// Graph Height
const grfHeight = 600;

function init() {
    lightMode();
    var src_path = "./sampleData.csv"
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
        // create data list
        const xData = data.map(d => d.NO);
        const yData = data.map(d => d.VALUE);

        // d3 animation duration
        let DURATION = 700;

        // current pan, zoom, and rotation
        let curX = 80;
        let curY = 80;

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

        // add click listener
        svgGroup.append("rect")
            .attr("class", "listening-rect")

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
            .attr("class", "yticks")

        // add x Label
        svgGroup.append("text")
            .attr("class", "xlabel")
            .text("COUNT");

        // add y Label
        svgGroup.append("text")
            .attr("class", "ylabel")
            .text("NO");

        // add grid
        svgGroup.append("g")
            .attr("class", "grid")

        const tooltip = d3.select("#tooltip");

        const tooltipCircle = svgGroup
            .append("circle")
            .attr("class", "tooltip-circle")
            .attr("r", 4)
            .attr("stroke", "#af9358")
            .attr("fill", "white")
            .attr("stroke-width", 2)
            .style("opacity", 0);

        const tooltipLine = svgGroup
            .append("g")
            .append("rect")
            .attr("class", "dotted")
            .attr("stroke-width", "1px")
            .attr("width", ".5px")
            .attr("height", height);

        // set up document events
        d3.select(window).on('resize.areaChart', resize);

        var root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            var duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            data.forEach(d => d.NO = +d.NO);
            data.forEach(d => d.VALUE = +d.VALUE);

            var x = d3.scaleLinear()
                .range([0, width])
                .domain(d3.extent(data, d => d.NO));
            var y = d3.scaleLinear()
                .range([height, 0])
                .domain(d3.extent(data, d => +d.VALUE));

            // set the chart
            var area = svgGroup.datum(data);
            var areaEnter = svgGroup.selectAll(".graph").data(data).enter();

            if (resize == false) {
                area.append("path")
                    .attr("class", "area")
                    .attr("fill", "#69b3a2")
                    .attr("fill-opacity", .3)
                    .attr("stroke", "none")
                    .attr("d", d3.area()
                        .x(d => x(d.NO))
                        .y0(height)
                        .y1(1e-6));

                areaEnter.append("path")
                    .attr("class", "mouseLine")
                    .style("stroke", "black")
                    .style("stroke-width", "1px")
                    .style("opacity", "0");

                var areaUpdate = area.transition().duration(duration);

                areaUpdate.selectAll(".area")
                    .attr("d", d3.area()
                        .x(d => x(d.NO))
                        .y0(height)
                        .y1(d => y(d.VALUE)));
            } else {
                var areaUpdate = area.transition().duration(duration)

                areaUpdate.selectAll(".area")
                    .attr("d", d3.area()
                        .x(d => x(d.NO))
                        .y0(height)
                        .y1(d => y(d.VALUE))
                    );
            }
            svgGroup.selectAll(".listening-rect")
                .attr("width", width)
                .attr("height", height)
                .attr('pointer-events', 'all')
                .on("mousemove", onMouseMove)
                .on("mouseout", onMouseLeave);

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
                .attr('x', -(height / 2))
                .attr('y', -curY + 20)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle');

            svgGroup.selectAll(".ylabel")
                .attr('x', (width / 2))
                .attr('y', height + 50)
                .attr('text-anchor', 'middle');

            svgGroup.selectAll(".grid")
                .call(d3.axisLeft()
                    .scale(y)
                    .tickSize(-width, 0, 0)
                    .tickFormat(''))

            function onMouseLeave(event) {
                // tooltip.style("opacity", 0);
                // tooltipCircle.style("opacity", 0);
            }

            function onMouseMove(event) {
                var mousePosition = d3.pointer(event)[0];
                var hoveredX = Math.round(x.invert(mousePosition));
                var xPosition = x(hoveredX);
                // console.log(mousePosition);
                // console.log(hoveredX)
                // console.log(xPosition);
                // console.log(y(100));
                console.log(y.range());

                var yPosition = height - y(hoveredX);
                tooltip
                    .style("transform", `translate(` + `calc(${x(hoveredX)}px),` + `calc(-100% + ${height}px)` + `)`)
                    .style("opacity", 1);

                tooltip.select('#data_no').html(xData[hoveredX]);
                tooltip.select('#data_value').html(yData[hoveredX]);

                tooltipCircle
                    .attr("cx", xPosition)
                    .attr("cy", height)
                    .style("opacity", 1);

                tooltipLine
                    .attr("x", xPosition);


                // console.log(data[hoveredX].VALUE);
                // console.log(data.NO[hoveredX]);
                // console.log(xValues);
                // svgGroup.select('.dotted')
                //     .attr("x", mousePosition)
                //     .attr("height", d => d.VALUE);
                // svgGroup.selectAll('.areaCircle')
                //     .each((d, i) => {
                //         if (d.NO == xValues) {

            }

            //     area.select(this)
            //         // .attr("cx", xValues)
            //         // .attr("cy", d.VALUE)
            //         // .attr("r", 3)
            //         .attr("fill", "blue")
            //         .attr("stroke", "none");
            // });
            // }
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
