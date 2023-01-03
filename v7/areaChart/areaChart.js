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
            .domain([0, height])
            .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
                "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);

        d3.selectAll(".areaChart").remove();

        // define the svgBase, attaching a class for styling
        var svgBase = d3.select("#areaChartGrf").append("svg")
            .attr("class", "areaChart")
            .attr("width", windowWidth)
            .attr("height", windowHeight)

        // Group which holds graph
        var svgGroup = svgBase.append("g")
            .attr('transform', 'translate(' + curX + ',' + curY + ')');

        // add click listener
        svgGroup.append("rect")
            .attr("class", "listening-rect")
            .attr("width", width)
            .attr("height", height)

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

        // set up document events
        d3.select(window).on('resize.areaChart', resize);

        var root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            var duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            var x = d3.scaleLinear()
                .range([0, width]);
            var y = d3.scaleLinear()
                .range([height, 0]);

            data.forEach(d => d.NO = +d.NO);
            data.forEach(d => d.VALUE = +d.VALUE);

            x.domain(d3.extent(data, d => d.NO));
            y.domain(d3.extent(data, d => +d.VALUE));

            var area = svgGroup.datum(data);
            var areaEnter = svgGroup.selectAll(".graph").data(data).enter();

            if (resize == false) {
                svgGroup.selectAll(".listening-rect")
                    .attr("width", width)
                    .attr("height", height)
                    .attr('pointer-events', 'all')
                    .on("mouseout", onMouseOut)
                    .on("mouseover", onMouseOver)
                    .on("mousemove", onMouseMove);

                area.append("path")
                    .attr("class", "area")
                    .attr("fill", "#69b3a2")
                    .attr("fill-opacity", .3)
                    .attr("stroke", "none")
                    .attr("d", d3.area()
                        .x(d => x(d.NO))
                        .y0(height)
                        .y1(1e-6));

                areaEnter.append('circle')
                    .attr('class', 'areaCircle')
                    .attr("cx", d => x(d.NO))
                    .attr("cy", d => y(d.VALUE))
                    .attr("r", 1e-6)
                    .attr("fill", "none")
                    .attr("stroke", "none");

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

                areaUpdate.selectAll(".areaCircle")
                    .attr("fill", "red")
                    .attr("r", 3);


            } else {
                var areaUpdate = area.transition().duration(duration)

                areaUpdate.selectAll(".area")
                    .attr("d", d3.area()
                        .x(d => x(d.NO))
                        .y0(height)
                        .y1(d => y(d.VALUE))
                    );

                areaUpdate.selectAll(".areaCircle")
                    .attr("cx", d => x(d.NO))
                    .attr("cy", d => y(d.VALUE))
                    .attr("r", 3)
                    .attr("fill", "red")
                    .attr("stroke", "none");

                svgGroup.selectAll(".listening-rect")
                    .attr("width", width)
                    .attr("height", height)
                    .attr('pointer-events', 'all')
                    .on("mouseout", onMouseOut)
                    .on("mouseover", onMouseOver)
                    .on("mousemove", onMouseMove);
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


            svgGroup.append("g")
                .append("rect")
                .attr("class", "dotted")
                .attr("stroke-width", "1px")
                .attr("width", ".5px")
                .attr("height", height);

            function onMouseOut() {
                // svgGroup.selectAll(".areaCircle")
                //     .attr("fill", "none");

            }

            function onMouseOver() {
                // svgGroup.selectAll(".areaCircle")
                //     .attr("fill", "red");
            }

            function onMouseMove(event) {
                xCoor = d3.pointer(event)[0];
                xValues = Math.round(x.invert(xCoor));
                console.log(xValues);
                svgGroup.select('.dotted')
                    .attr("x", xCoor);
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
