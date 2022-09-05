// Graph Height
const grf_height = 600;

function init() {
    var src_path = "./sampleData.csv"
    draw_bar_chart(src_path);
}

function draw_bar_chart(src_path) {
    d3.csv(src_path).then(data => {

        var DURATION = 700; // d3 animation duration

        // current pan, zoom, and rotation
        var curX = 80;
        var curY = 80;

        // size of the diagram
        var windowWidth = window.innerWidth - 20;
        var windowHeight = grf_height;
        var width = windowWidth - (curX * 2);
        var height = windowHeight - (curY * 2);

        var colors = d3.scaleQuantize()
            .domain([0, height])
            .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
                "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);

        d3.selectAll(".bar_chart").remove();

        // define the svgBase, attaching a class for styling
        var svgBase = d3.select("#barChart").append("svg")
            .attr("class", "bar_chart")
            .attr("width", windowWidth)
            .attr("height", windowHeight)

        // Group which holds graph
        var svgGroup = svgBase.append("g")
            .attr('transform', 'translate(' + curX + ',' + curY + ')');

        // add the title
        svgGroup.append("text")
            .attr("class", "grf_title")
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
            .text("YEAR");

        // add grid
        svgGroup.append("g")
            .attr("class", "grid")

        // set up document events
        d3.select(window).on('resize.bar_chart', resize);

        var root = data;

        update(root, true, false);

        function update(source, transition, resize) {
            var duration = transition ? DURATION : 0;

            svgGroup.transition().duration(duration)
                .attr('transform', 'translate(' + curX + ',' + curY + ')');

            // set the ranges
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);

            data.forEach(d => d.VALUE = +d.VALUE);

            x.domain(data.map(d => d.YEAR));
            y.domain([0, d3.max(data, d => d.VALUE)]);

            var bar = svgGroup.selectAll(".graph").data(data);

            // var barEnter = bar.enter().insert("g");
            var barEnter = bar.enter();

            if (resize == false) {
                barEnter.append("rect")
                    .attr("class", "bar")
                    .attr("fill", d => colors(height - y(d.VALUE)))
                    .attr("x", d => x(d.YEAR))
                    .attr("width", x.bandwidth())
                    .attr("y", d => height)
                    .attr("height", 1e-6);

                barEnter.append('text')
                    .attr('class', 'bar_txt')
                    .attr('x', d => x(d.YEAR) + x.bandwidth() / 2)
                    .attr('y', d => y(d.VALUE) - 10)
                    .attr('text-anchor', 'middle')
                    .style('opacity', 0.9)
                    .style('fill-opacity', 0)
                    .text(d => d.VALUE);

                var barUpdate = bar.merge(barEnter).transition().duration(duration);

                barUpdate.selectAll(".bar_txt")
                    .attr('fill', 'black')
                    .attr('dy', '.35em')
                    .style('fill-opacity', 1);

                barUpdate.selectAll(".bar")
                    .attr("y", d => y(d.VALUE))
                    .attr("height", d => height - y(d.VALUE));
            } else {
                var barUpdate = bar.merge(barEnter).transition().duration(duration)

                barUpdate.selectAll(".bar")
                    .attr("x", d => x(d.YEAR))
                    .attr("y", d => y(d.VALUE))
                    .attr("width", x.bandwidth())
                    .attr("height", d => height - y(d.VALUE));

                barUpdate.selectAll('.bar_txt')
                    .attr('x', d => x(d.YEAR) + x.bandwidth() / 2)
                    .attr('y', d => y(d.VALUE) - 10);
            }
            svgGroup.selectAll(".grf_title")
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
        }

        function resize() { // window resize
            windowWidth = window.innerWidth - 20;
            windowHeight = grf_height
            width = windowWidth - (curX * 2);
            height = windowHeight - (curY * 2);
            svgBase.attr('width', windowWidth).attr('height', windowHeight);
            svgGroup.attr('transform', 'translate(' + curX + ',' + curY + ')');
            update(root, true, true);
        }
    });
}

init();
