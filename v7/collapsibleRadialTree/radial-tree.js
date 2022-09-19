// Get JSON data
d3.csv("./flare.csv").then(treeData => {

    let DURATION = 700; // d3 animation duration
    let STAGGERN = 4; // delay for each node
    let STAGGERD = 200; // delay for each depth
    let NODE_DIAMETER = 4; // diameter of circular nodes
    let MIN_ZOOM = 0.5; // minimum zoom allowed
    let MAX_ZOOM = 10;  // maximum zoom allowed
    let HAS_CHILDREN_COLOR = 'lightsteelblue';
    let SELECTED_COLOR = '#a00';  // color of selected node
    let SELECTED_COLOR_DARK = "#ffff00";
    let ZOOM_INC = 0.04;  // zoom factor per animation frame
    let PAN_INC = 3;  //  pan per animation frame
    let ROT_INC = 0.3;  // rotation per animation frame

    let counter = 0;  // node ids
    let curNode;  // currently selected node
    let curPath;  // array of nodes in the path to the currently selected node

    // size of the diagram
    let width = window.innerWidth - 20;
    let height = window.innerHeight - 20;

    // current pan, zoom, and rotation
    let curX = width / 2;
    let curY = height / 2;
    let curZ = 1.0; // current zoom
    let curR = 270; // current rotation

    // keyboard key codes
    let KEY_LIGHT = 76;     // l (light mode)
    let KEY_DARK = 68;     // d (dark mode)
    let KEY_PLUS = 187;     // + (zoom in)
    let KEY_MINUS = 189;    // - (zoom out)
    let KEY_SLASH = 191;    // / (slash)
    let KEY_PAGEUP = 33;    // (rotate CCW)
    let KEY_PAGEDOWN = 34;  // (rotate CW)
    let KEY_LEFT = 37;      // left arrow
    let KEY_UP = 38;        // up arrow
    let KEY_RIGHT = 39;     // right arrow
    let KEY_DOWN = 40;      // down arrow
    let KEY_SPACE = 32;     // (expand node)
    let KEY_RETURN = 13;    // (expand tree)
    let KEY_HOME = 36;      // (center root)
    let KEY_END = 35;       // (center selection)

    // set dark mode default
    document.documentElement.setAttribute('color-theme', 'dark');
    let isDark = true;

    var stratify = d3.stratify()
        .parentId(d => d.id.substring(0, d.id.lastIndexOf("|")));

    // d3 diagonal projection for use by the node paths
    var diagonal = d3.linkRadial()
        .angle(d => d.x / 180 * Math.PI)
        .radius(d => d.y);

    // d3 tree layout
    var tree = d3.tree()
        .size([360, Math.min(width, height) / 2 - 120])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);


    // define the svgBase, attaching a class for styling and the zoomListener
    var svgBase = d3.select('#tree-container').append('svg')
        .attr('class', 'svgBase')
        .attr('width', width)
        .attr('height', height)
        .on('mousedown', mousedown);

    // Group which holds all nodes and manages pan, zoom, rotate
    var svgGroup = svgBase.append('g')
        .attr('transform', 'translate(' + curX + ',' + curY + ')');

    d3.select(document) // set up document events
        .on('wheel', wheel)  // zoom, rotate
        .on('keydown', keydown)
        .on('keyup', keyup);
    d3.select(window).on('resize', resize);
    d3.selectAll('.button')
        .on('mousedown', tooldown)
        .on('mouseup', toolup);
    d3.select('#selection').on('mousedown', switchroot);
    d3.select('#contextmenu').on('mouseup', menuSelection);

    // Define the data root
    var treeData = stratify(treeData);
    var root = treeData;
    root.x0 = curY;
    root.y0 = 0;
    selectNode(root); // current selected node

    // Collapse all children of root's children before rendering
    // if (root.children) {
    //   root.children.forEach(function(child) {
    //       collapseTree(child);
    //   });
    // }

    update(root, true); // Layout the tree initially and center on the root node

    // update the tree
    // source - source node of the update
    // transition - whether to do a transition
    function update(source, transition) {
        // var duration = transition ? (event && event.altKey ? DURATION * 4 : DURATION) : 0;
        var duration = transition ? DURATION : 0;

        // Compute the new tree layout.
        var nodes = root.descendants();
        var links = root.links();

        tree(root);

        // Toggle Root x-axis 보정
        if (root.parent != null) {
            root.y0 = 0;
            root.y = 0;
        }

        // Update the view
        svgGroup.transition().duration(duration)
            .attr('transform',
                'rotate(' + curR + ' ' + curX + ' ' + curY +
                ')translate(' + curX + ' ' + curY +
                ')scale(' + curZ + ')');

        // Update the nodes…
        var node = svgGroup.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++counter));

        // Enter any new nodes at the parent's previous position
        var nodeEnter = node.enter().insert('g', ':first-child')
            .attr('class', 'node')
            .attr('transform', 'rotate(' + (source.x0 - 90) + ')translate(' + source.y0 + ')')
            .on('click', click)
            .on('dblclick', dblclick)
            .on('contextmenu', showContextMenu);
        // .on('mousedown', suppress);

        nodeEnter.append('circle')
            .attr('r', 1e-6)
            .style('fill', d => d._children ? HAS_CHILDREN_COLOR : 'white');

        nodeEnter.append('text')
            .text(d => d.id.substring(d.id.lastIndexOf("|") + 1))
            .style('opacity', 0.9)
            .style('fill-opacity', 0)
            .attr('transform', () => ((source.x0 + curR) % 360 <= 180 ?
                'translate(8)scale(' : 'rotate(180)translate(-8)scale(') + reduceZ() + ')');

        // update existing graph nodes

        // Change the circle fill depending on whether it has children and is collapsed
        node.merge(nodeEnter).select('circle')
            .attr('r', NODE_DIAMETER * reduceZ())
            .style('fill', d => d._children ? HAS_CHILDREN_COLOR : 'white')
            .attr('stroke', d => d.selected ? (isDark? SELECTED_COLOR_DARK: SELECTED_COLOR) : 'steelblue')
            .attr('stroke-width', d => d.selected ? 3 : 1.5);

        node.merge(nodeEnter).select('text')
            .attr('text-anchor', d => (d.x + curR) % 360 <= 180 ? 'start' : 'end')
            .attr('transform', d => ((d.x + curR) % 360 <= 180 ?
                'translate(8)scale(' : 'rotate(180)translate(-8)scale(') + reduceZ() + ')')
            .attr('fill', d => d.selected ? (isDark? SELECTED_COLOR_DARK: SELECTED_COLOR) : (isDark ? 'white' : 'black'))
            .attr('dy', '.35em');

        // var nodeUpdate = node.transition().duration(duration)
        var nodeUpdate = node.merge(nodeEnter).transition().duration(duration)
            .delay(transition ?
                (d, i) => i * STAGGERN + Math.abs(d.depth - curNode.depth) * STAGGERD : 0)
            .attr('transform', d => 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')');

        nodeUpdate.select('circle')
            .attr('r', NODE_DIAMETER * reduceZ());
        // .style('fill', function(d) {
        //   return d._children ? HAS_CHILDREN_COLOR : 'white';
        // });

        nodeUpdate.selectAll('text')
            .style('fill-opacity', 1);

        // Transition exiting nodes to the parent's new position and remove
        var nodeExit = node.exit().transition().duration(duration).remove()
            .delay(transition ? (d, i) => i * STAGGERN : 0)
            .attr('transform', () => 'rotate(' + (source.x - 90) + ')translate(' + source.y + ')');

        nodeExit.select('circle').attr('r', 0);
        nodeExit.select('text').style('fill-opacity', 0);

        // Update the links…
        var link = svgGroup.selectAll('path.link')
            .data(links, d => d.target.id);

        // Enter any new links at the parent's previous position
        var linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position
        link.merge(linkEnter).transition().duration(duration)
            .delay(transition ? (d, i) => i * STAGGERN + Math.abs(d.source.depth - curNode.depth) * STAGGERD : 0)
            .attr('d', diagonal);

        // Transition exiting nodes to the parent's new position
        link.exit().transition().duration(duration).remove()
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Stash the old positions for transition
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    } // end update

    // Helper functions for collapsing and expanding nodes

    function lightMode() {
        document.documentElement.setAttribute('color-theme', 'light');
        isDark = false;
    }

    function darkMode() {
        document.documentElement.setAttribute('color-theme', 'dark');
        isDark = true;
    }

    // Toggle expand / collapse
    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
    }

    function toggleTree(d) {
        if (d.children) {
            collapseTree(d);
        } else {
            expandTree(d);
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
    }

    // expand all children, whether expanded or collapsed
    function expandTree(d) {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        if (d.children) {
            d.children.forEach(expandTree);
        }
    }

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        }
    }

    // collapse all children
    function collapseTree(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        }
        if (d._children) {
            d._children.forEach(collapseTree);
        }
    }

    // expand one level of tree
    function expand1Level(d) {
        var q = [d]; // non-recursive
        var cn;
        var done = null;
        while (q.length > 0) {
            cn = q.shift();
            if (done !== null && done < cn.depth) {
                return;
            }
            if (cn._children) {
                done = cn.depth;
                cn.children = cn._children;
                cn._children = null;
                cn.children.forEach(collapse);
            }
            if (cn.children) {
                q = q.concat(cn.children);
            }
        }
        // no nodes to open
    }

    // highlight selected node
    function selectNode(node) {
        if (curNode) {
            delete curNode.selected;
        }
        curNode = node;
        curNode.selected = true;
        curPath = []; // filled in by fullpath
        d3.select('#selection').html(fullpath(node));
    }

    // for displaying full path of node in tree
    function fullpath(d, idx) {
        idx = idx || 0;
        curPath.push(d);
        return (d.parent ? fullpath(d.parent, curPath.length) : '') +
            '/<span class="nodepath' + (d.id.substring(d.id.lastIndexOf("|") + 1) ===
            root.id.substring(root.id.lastIndexOf("|") + 1) ? ' highlight' : '') +
            '" data-sel="' + idx + '" title="Set Root to ' + d.id.substring(d.id.lastIndexOf("|") + 1) + '">' +
            d.id.substring(d.id.lastIndexOf("|") + 1) + '</span>';
    }

    // d3 event handlers

    function switchroot(event) {
        event.preventDefault();
        var pathelms = document.querySelectorAll('#selection .nodepath');
        for (var i = 0; i < pathelms.length; i++) {
            pathelms[i].classList.remove('highlight');
        }
        var target = event.target;
        var node = curPath[+target.dataset.sel];
        if (event.shiftKey) {
            if (curNode !== node) {
                selectNode(node);
            }
        } else {
            root = node;
            target.classList.add('highlight');
        }
        update(root, true);
    }

    function resize() { // window resize
        var oldwidth = width;
        var oldheight = height;
        width = window.innerWidth - 20;
        height = window.innerHeight - 20;
        tree.size([360, Math.min(width, height) / 2 - 120]);
        svgBase.attr('width', width).attr('height', height);
        curX += (width - oldwidth) / 2;
        curY += (height - oldheight) / 2;
        svgGroup.attr('transform', 'rotate(' + curR + ' ' + curX + ' ' + curY +
            ')translate(' + curX + ' ' + curY + ')scale(' + curZ + ')');
        update(root);
    }

    function click(event, d) { // select node
        if (event.defaultPrevented || d === curNode) {
            return;
        } // suppressed
        event.preventDefault();
        selectNode(d);
        update(d);
    }

    function dblclick(event, d) {  // Toggle children of node
        if (event.defaultPrevented) {
            return;
        } // click suppressed
        event.preventDefault();
        if (event.shiftKey) {
            expand1Level(d); // expand node by one level
        } else {
            toggle(d);
        }
        update(d, true);
    }

    function tooldown(event) {  // tool button pressed
        event.preventDefault();
        d3.select(event.target).on('mouseout', toolup);
        var key = +event.target.dataset.key;
        keydown(event, Math.abs(key), key < 0 || event.shiftKey);
    }

    function toolup(event) {  // tool button released
        event.preventDefault();
        d3.select(event.target).on('mouseout', null);
        keyup(event, Math.abs(+event.target.dataset.key));
    }

    // right click, show context menu and select this node
    function showContextMenu(event, d) {
        event.preventDefault();
        selectNode(d);
        update(d);
        d3.selectAll('.expcol').text(d.children ? 'Collapse' : 'Expand');
        d3.select('#contextmenu')
            .style('left', (event.pageX + 3) + 'px')
            .style('top', (event.pageY + 8) + 'px')
            .style('display', 'block');
        d3.select(document).on('mouseup', hideContextMenu, true);

    }

    function hideContextMenu(isShowContextMenu) {
        d3.select('#contextmenu').style('display', 'none');
        if (isShowContextMenu) {
            d3.select(document).on('mouseup', null);
        }
    }

    function menuSelection(event) {
        event.preventDefault();
        var key = +event.target.dataset.key;
        keydown(event, Math.abs(key), key < 0 || event.shiftKey);
    }

    var startposX, startposY; // initial position on mouse button down for pan

    function mousedown(event) {  // pan
        event.preventDefault();
        if (event.which !== 1 || event.ctrlKey) {
            return;
        } // ingore other mouse buttons
        startposX = curX - event.clientX;
        startposY = curY - event.clientY;
        d3.select(document).on('mousemove', mousemove, true);
        d3.select(document).on('mouseup', mouseup, true);
    }

    function mousemove(event) {
        // 버그 수정: hideContextMenu와 충돌
        hideContextMenu(false);
        event.preventDefault();
        curX = startposX + event.clientX;
        curY = startposY + event.clientY;
        setview();
    }

    function mouseup() {
        // 버그 수정: hideContextMenu와 충돌
        hideContextMenu(false);
        d3.select(document).on('mousemove', null);
        d3.select(document).on('mouseup', null);
    }

    var keysdown = [];  // which keys are currently down
    var moveX = 0, moveY = 0, moveZ = 0, moveR = 0; // animations
    var aniRequest = null;

    function wheel(event) {  // mousewheel
        var dz, newZ;
        // var slow = event.altKey ? 0.25 : 1;
        var slow = event.altKey ? 0.25 : 1;
        if (event.wheelDeltaY !== 0) {  // up-down
            dz = Math.pow(1.2, event.wheelDeltaY * 0.001 * slow);
            newZ = limitZ(curZ * dz);
            dz = newZ / curZ;
            curZ = newZ;

            curX -= (event.clientX - curX) * (dz - 1);
            curY -= (event.clientY - curY) * (dz - 1);
            setview();
        }
        if (event.wheelDeltaX !== 0) {  // left-right
            curR = limitR(curR + event.wheelDeltaX * 0.01 * slow);
            update(root);
        }
    }

    // keyboard shortcuts
    function keydown(event, key, shift) {
        if (!key) {
            key = event.which;  // fake key
            shift = event.shiftKey;
        }
        var parch; // parent's children
        var slow = event.altKey ? 0.25 : 1;
        if (keysdown.indexOf(key) >= 0) {
            return;
        } // defeat auto repeat
        switch (key) {
            case KEY_LIGHT: // light mode
                lightMode();
                update(root, true);
                break;
            case KEY_DARK: // dark mode
                darkMode();
                update(root, true);
                break;
            case KEY_PLUS: // zoom in
                moveZ = ZOOM_INC * slow;
                break;
            case KEY_MINUS: // zoom out
                moveZ = -ZOOM_INC * slow;
                break;
            case KEY_SLASH: // toggle root to selection
                root = root === curNode ? treeData : curNode;
                update(root, true);
                curPath = []; // filled in by fullpath
                d3.select('#selection').html(fullpath(curNode));
                return;
            case KEY_PAGEUP: // rotate counterclockwise
                moveR = -ROT_INC * slow;
                break;
            case KEY_PAGEDOWN: // zoom out
                moveR = ROT_INC * slow; // rotate clockwise
                break;
            case KEY_LEFT: // left arrow
                if (shift) { // move selection to parent
                    if (!curNode) {
                        selectNode(root);
                    } else if (curNode.parent) {
                        selectNode(curNode.parent);
                    }
                    update(curNode);
                    return;
                }
                moveX = -PAN_INC * slow;
                break;
            case KEY_UP: // up arrow
                if (shift) { // move selection to previous child
                    if (!curNode) {
                        selectNode(root);
                    } else if (curNode.parent) {
                        parch = curNode.parent.children;
                        selectNode(parch[(parch.indexOf(curNode) +
                            parch.length - 1) % parch.length]);
                    }
                    update(curNode);
                    return;
                }
                moveY = -PAN_INC * slow;
                break;
            case KEY_RIGHT: // right arrow
                if (shift) { // move selection to first/last child
                    if (!curNode) {
                        selectNode(root);
                    } else {
                        if (curNode.children) {
                            selectNode(curNode.children[event.altKey ? curNode.children.length - 1 : 0]);
                        }
                    }
                    update(curNode);
                    return;
                }
                moveX = PAN_INC * slow;
                break;
            case KEY_DOWN: // down arrow
                if (shift) { // move selection to next child
                    if (!curNode) {
                        selectNode(root);
                    } else if (curNode.parent) {
                        parch = curNode.parent.children;
                        selectNode(parch[(parch.indexOf(curNode) + 1) % parch.length]);
                    }
                    update(curNode);
                    return;
                }
                moveY = PAN_INC * slow;
                break;
            case KEY_SPACE: // expand/collapse node
                if (!curNode) {
                    selectNode(root);
                }
                toggle(curNode);
                update(curNode, true);
                return;
            case KEY_RETURN: // expand/collapse tree
                if (!curNode) {
                    selectNode(root);
                }
                if (shift) {
                    expandTree(curNode);
                } else {
                    expand1Level(curNode);
                }
                update(curNode, true);
                return;
            case KEY_HOME: // reset transform
                if (shift) {
                    root = treeData;
                }
                curX = width / 2;
                curY = height / 2;
                curR = limitR(90 - root.x);
                curZ = 1;
                update(root, true);
                return;
            case KEY_END: // zoom to selection
                if (!curNode) {
                    return;
                }
                curX = width / 2 - curNode.y * curZ;
                curY = height / 2;
                curR = limitR(90 - curNode.x);
                update(curNode, true);
                return;
            default:
                return;  // ignore other keys
        } // break jumps to here
        keysdown.push(key);
        // start animation if anything happening
        if (keysdown.length > 0 && aniRequest === null) {
            aniRequest = requestAnimationFrame(frame);
        }
    }

    function keyup(event, key) {
        console.lop
        key = key || event.which;
        var pos = keysdown.indexOf(key);
        if (pos < 0) {
            return;
        }

        switch (key) {
            case KEY_PLUS: // zoom out
            case KEY_MINUS: // zoom in
                moveZ = 0;
                break;
            case KEY_PAGEUP: // rotate CCW
            case KEY_PAGEDOWN: // rotate CW
                moveR = 0;
                break;
            case KEY_LEFT: // left arrow
            case KEY_RIGHT: // right arrow
                moveX = 0;
                break;
            case KEY_UP: // up arrow
            case KEY_DOWN: // down arrow
                moveY = 0;
                break;
        }
        keysdown.splice(pos, 1);  // remove key
        if (keysdown.length > 0 || aniRequest === null) {
            return;
        }
        cancelAnimationFrame(aniRequest);
        aniRequest = aniTime = null;
    }

    var aniTime = null;

    // update animation frame
    function frame(frametime) {
        var diff = aniTime ? (frametime - aniTime) / 16 : 0;
        aniTime = frametime;

        var dz = Math.pow(1.2, diff * moveZ);
        var newZ = limitZ(curZ * dz);
        dz = newZ / curZ;
        curZ = newZ;
        curX += diff * moveX - (width / 2 - curX) * (dz - 1);
        curY += diff * moveY - (height / 2 - curY) * (dz - 1);
        curR = limitR(curR + diff * moveR);
        setview();
        aniRequest = requestAnimationFrame(frame);
    }

    // enforce zoom extent
    function limitZ(z) {
        return Math.max(Math.min(z, MAX_ZOOM), MIN_ZOOM);
    }

    // keep rotation between 0 and 360
    function limitR(r) {
        return (r + 360) % 360;
    }

    // limit size of text and nodes as scale increases
    function reduceZ() {
        return Math.pow(1.1, -curZ);
    }

    // set view with no animation
    function setview() {
        svgGroup.attr('transform', 'rotate(' + curR + ' ' + curX + ' ' + curY +
            ')translate(' + curX + ' ' + curY + ')scale(' + curZ + ')');
        svgGroup.selectAll('text')
            .attr('text-anchor', d => (d.x + curR) % 360 <= 180 ? 'start' : 'end')
            .attr('transform', d => ((d.x + curR) % 360 <= 180 ?
                'translate(8)scale(' : 'rotate(180)translate(-8)scale(') + reduceZ() + ')');
        svgGroup.selectAll('circle').attr('r', NODE_DIAMETER * reduceZ());
    }

});