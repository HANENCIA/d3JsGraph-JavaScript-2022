// Graph Height
const grf_height = 600;

function init() {
    var src_path = "./sampleData.csv"
    draw_pie_chart(src_path);
}

function draw_pie_chart(src_path) {
    d3.csv(src_path).then(data => {
        var DURATION = 700; // d3 animation duration

        // size of the diagram
        var windowWidth = window.innerWidth - 30;
        var windowHeight = grf_height;

        // current pan, zoom, and rotation
        var curX = windowWidth / 2;
        var curY = windowHeight / 2;


        var colors = d3.scaleQuantize()
            .domain(d3.extent(data, d => d.YEAR))
            .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
                "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);

        d3.selectAll(".pie").remove();

        // define the svgBase, attaching a class for styling
        var svgBase = d3.select("#pieChart").append("svg")
            .attr("class", "pie")
            .attr("width", windowWidth)
            .attr("height", windowHeight)

        // Group which holds graph
        var svgGroup = svgBase.append("g")
            .attr('transform', 'translate(' + curX + ',' + curY + ')');

        svgGroup.append("g")
            .attr("class", "slices");
        svgGroup.append("g")
            .attr("class", "labels");
        svgGroup.append("g")
            .attr("class", "lines");

        // set up document events
        d3.select(window).on('resize.pie', resize);

        // Define the data root
        var root = data;

        // Transition time
        var totalVal = 0;
        data.forEach(d => {
            totalVal += Math.round(d.VALUE);
        });
        var transitionTime = [];
        data.forEach(d => {
            transitionTime.push(DURATION * (Math.round(d.VALUE) / totalVal));
        });
        var transitionAccmuTime = [0];
        var totalTmp = 0;
        for (var i = 0; i < transitionTime.length - 1; i++) {
            transitionAccmuTime.push(totalTmp + transitionTime[i]);
            totalTmp += transitionTime[i];
        }

        update(root, true, false);

        function update(source, transition, resize) {
            var duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            var radius = Math.min(windowWidth, windowHeight) / 3;

            var pie = d3.pie()
                .sort(null)
                .value(d => d.VALUE);

            var arc = d3.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.4);

            var outerArc = d3.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9);

            var key = d => d.YEAR;

            d3.selectAll(".slice").remove();
            d3.selectAll(".line").remove();
            d3.selectAll(".label").remove();

            var slice = svgGroup.select(".slices").selectAll("path.slice")
                .data(pie(data), key);

            var sliceEnter = slice.enter()

            var line = svgGroup.select(".lines").selectAll("line")
                .data(pie(data));

            var lineEnter = line.enter();

            var label = svgGroup.select(".labels").selectAll("label")
                .data(pie(data));

            var labelEnter = label.enter();

            if (resize == false) {
                sliceEnter.append("path")
                    .attr('class', 'slice')
                    .attr('fill', d => colors(d.data.YEAR))
                    .attr("stroke", "white")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7)
                    // .transition().delay((efd, i) => i * duration).duration(duration)
                    .transition().delay((d, i) => transitionAccmuTime[i]).duration((d, i) => transitionTime[i])
                    .attrTween('d', function (d) {
                        var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                        return function (t) {
                            d.endAngle = i(t);
                            return arc(d);
                        }
                    });

                lineEnter.append("polyline")
                    .attr('class', 'line')
                    .attr("stroke", "black")
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr('points', function (d) {
                        const posA = arc.centroid(d) // line insertion in the slice
                        return [posA, posA, posA]
                    });

                labelEnter.append('text')
                    .attr('class', 'label')
                    .text(d => d.data.YEAR)
                    .attr('transform', function (d) {
                        const pos = outerArc.centroid(d);
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                        return `translate(${pos})`;
                    })
                    .style('text-anchor', function (d) {
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end')
                    })

                lineUpdate = line.merge(lineEnter).transition().duration(duration);

                lineUpdate.selectAll('.line')
                    .attr('points', function (d) {
                        const posA = arc.centroid(d) // line insertion in the slice
                        const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                        const posC = outerArc.centroid(d); // Label position = almost the same as posB
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                        posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                        return [posA, posB, posC]
                    });

            } else {
                sliceEnter.append("path")
                    .attr('class', 'slice')
                    .attr('fill', d => colors(d.data.YEAR))
                    .attr("stroke", "white")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7)
                    .transition().delay((d, i) => transitionAccmuTime[i]).duration((d, i) => transitionTime[i])
                    .attrTween('d', function (d) {
                        var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                        return function (t) {
                            d.endAngle = i(t);
                            return arc(d);
                        }
                    });

                lineEnter.append("polyline")
                    .attr('class', 'line')
                    .attr("stroke", "black")
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr('points', function (d) {
                        const posA = arc.centroid(d) // line insertion in the slice
                        return [posA, posA, posA]
                    });

                lineUpdate = line.merge(lineEnter).transition().duration(duration);

                lineUpdate.selectAll('.line')
                    .attr('points', function (d) {
                        const posA = arc.centroid(d) // line insertion in the slice
                        const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                        const posC = outerArc.centroid(d); // Label position = almost the same as posB
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                        posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                        return [posA, posB, posC]
                    });

                labelEnter.append('text')
                    .attr('class', 'label')
                    .text(d => d.data.YEAR)
                    .attr('transform', function (d) {
                        const pos = outerArc.centroid(d);
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                        return `translate(${pos})`;
                    })
                    .style('text-anchor', function (d) {
                        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end')
                    })
            }
        }

        function resize() { // window resize
            windowWidth = window.innerWidth - 30;
            windowHeight = grf_height;
            curX = windowWidth / 2;
            curY = windowHeight / 2;
            svgBase.attr('width', windowWidth).attr('height', windowHeight);
            svgGroup.attr('transform', 'translate(' + curX + ',' + curY + ')');
            update(root, true, true);
        }
    });
}

init();
