/** 
    Auto-layout methods.
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Simple circular layout of nodes arranges nodes evenly in a circle
**/
Graph.prototype.circleLayout = function() {
    var oldValues = {};
    var newValues = {};
    
    // Save old values
    for (var i in g.nodes) {
        var n = g.nodes[i];
        oldValues[i] = {'x': n.dim.x, 'y': n.dim.y, 'width': n.dim.width, 'height': n.dim.height};
    }
    
    var w = g.canvas.width;
    var h = g.canvas.height;
    
    // Radius
    var radius = h;
    if (w < h) {
        radius = w;
    }
    radius /= 2;
    radius -= 50;
    
    // Centre point
    var cx = w/2;
    var cy = h/2;
    
    // Number of objects to layout
    var objCount = 0;
    for (var i in g.nodes) {
        objCount++;
    }
    
    if (objCount == 0) {
        return;
    }
    
    // Layout
    var angPart = Math.PI * 2 / objCount;
    var coordAngle = 0;
    for (var i in g.nodes) {
        var x = radius * Math.cos(coordAngle);
        var y = radius * Math.sin(coordAngle);
        x += cx;
        y += cy;
        
        var n = g.nodes[i];
        
        n.dim = {};
        n.dim.x = x;
        n.dim.y = y;
        n.dim.width = 0;
        n.dim.height = 0;
        g.setSizeByText(g.ctx, n);
        
        newValues[i] = {'x': n.dim.x, 'y': n.dim.y, 'width': n.dim.width, 'height': n.dim.height};
        
        coordAngle += angPart;
    }
    
    this.pushToUndo(this.cmdNode, guid(), this.cmdLayout, oldValues, newValues);   
    this.repaint();
}

/**
    Performs a spring layout on the CAM.
**/
Graph.prototype.springLayout = function() {

    // Hide the valence selector
    this.hideValenceSelector();

    // Define the algorithm's constants
    var epsilon = 30;
    var damping = 0.1;
    var timestep = 0.05;
    var repulsion_constant = -3E8; //-1E8;
    var min_spring_length = 25;
    var spring_constant = 100; //200;
    var timeout = 50;
    var node_count = 0;
    var max_iter = 15000 / timeout; // max runtime 15 seconds
    
    // For undo
    var oldValues = { 'nodes': {}, 'edges': {} };
    var newValues = { 'nodes': {}, 'edges': {} };
    
    // Set up initial node velocities    
    var anchor = '';
    for (var nid in g.nodes) {
        if (node_count == 0) {
            anchor = nid;
        }
        
        var node = g.nodes[nid];        
        node.velocity = [0, 0];
        node_count += 1;
        
        oldValues['nodes'][nid] = jQuery.extend(true, {}, node.dim);
    }
    epsilon *= node_count;
    
    // Delete all edge inner points
    var edge_stats = {};
    for (var eid in g.edges) {
        var edge = g.edges[eid];
        console.log(edge.from);
        console.log(edge.to);
        
        // Track the incoming and outgoing edges
        if (!(edge.to in edge_stats)) {
            edge_stats[edge.to] = 0;
        }
        
        if (!(edge.from in edge_stats)) {
            edge_stats[edge.from] = 0;
        }
        
        edge_stats[edge.to] += 1;
        edge_stats[edge.from] += 1;
        
        if (edge.innerPoints && edge.innerPoints.length > 0) {
            oldValues['edges'][eid] = [];
            newValues['edges'][eid] = [];
            
            // Save old points
            for (var i = 0; i < edge.innerPoints.length; i += 1) {
                var point = edge.innerPoints[i];
                oldValues['edges'][eid].push(new Point(point.x, point.y));
            }
            
            // Reset inner points
            edge.innerPoints = [];
        }
    }
    
    // Compute the anchor node 
    var max = 0;
    for (var nid in edge_stats) {
        if (edge_stats[nid] > max) {
            anchor = nid;
            max = edge_stats[nid];
        }
    }
    
    // Indicate that layout is in progress
    g.layoutInProgress = true;
 
    //set up initial node positions randomly // make sure no 2 nodes are in exactly the same position        
    var counter = 0;
    var func = function() {            
        var total_kinetic_energy = 0; // running sum of total kinetic energy over all particles
        for (var nid in g.nodes) {
            if (nid == anchor) {
                continue;
            }
        
            var this_node = g.nodes[nid];
            var net_force = [0, 0]; // running sum of total force on this particular node            
            
            // Compute repulsion between nodes based on Coloumb's law
            for (var nid_oither in g.nodes) {
                if (nid != nid_oither) {
                    var other_node = g.nodes[nid_oither];
                    
                    var diff_x = other_node.dim.x - this_node.dim.x + 0.01; // Make sure it is not zero
                    var diff_y = this_node.dim.y - other_node.dim.y;
                    var theta = Math.atan(diff_y/diff_x);
                    if (diff_x < 0) {
                        theta += Math.PI;
                    }
                    
                    var distance_squared = Math.pow(Math.max(Math.abs(diff_x) - (this_node.dim.width / 2 + other_node.dim.width / 2), 10), 2) + Math.pow(Math.max(Math.abs(diff_y) - (this_node.dim.height / 2 + other_node.dim.height / 2), 10), 2);
                    var charge = 1; //this_node.valence * other_node.valence;
                    var force = repulsion_constant * charge / distance_squared;
                    
                    net_force[0] += force * Math.cos(theta);
                    net_force[1] -= force * Math.sin(theta);
                }
            }       
            
            // Calculate the attractions based on Hooke's law
            for (var eid in g.edges) {
                var edge = g.edges[eid];
                var from, to;
                if (edge.from == nid) {
                    from = g.nodes[edge.from];
                    to = g.nodes[edge.to];
                } else if (edge.to == nid) {
                    from = g.nodes[edge.to];
                    to = g.nodes[edge.from];
                } else {
                    continue;
                }
                
                var diff_x = to.dim.x - from.dim.x + 0.01; // Make sure it is not zero
                var diff_y = from.dim.y - to.dim.y;
                var theta = Math.atan(diff_y/diff_x);
                if (diff_x < 0) {
                    theta += Math.PI;
                }
                
                var multiplier = 3 * Math.abs(edge.valence) + 1;
                
                // Compute the total displacement
                var total_length = Math.sqrt(Math.pow(Math.abs(diff_x) - (this_node.dim.width / 2 + other_node.dim.width / 2), 2) + Math.pow(Math.abs(diff_y) - (this_node.dim.height / 2 + other_node.dim.height / 2), 2));
                var displacement = total_length - min_spring_length;             
                
                net_force[0] += spring_constant * multiplier * displacement * Math.cos(theta);
                net_force[1] -= spring_constant * multiplier  * displacement * Math.sin(theta);     
            }            
            
            // without damping, it moves forever 
            this_node.velocity[0] = (this_node.velocity[0] + timestep * net_force[0]) * damping;
            this_node.velocity[1] = (this_node.velocity[1] + timestep * net_force[1]) * damping;            
            
            // assume all nodes have mass 1
            total_kinetic_energy += Math.pow(this_node.velocity[0], 2) + Math.pow(this_node.velocity[1], 2);
        }
        
        // Apply position changes
        for (var nid in g.nodes) {
            if (nid == anchor) {
                continue;
            }
        
            var this_node = g.nodes[nid];
            this_node.dim.x += timestep * this_node.velocity[0]
            this_node.dim.y += timestep * this_node.velocity[1];
        }
        
        g.repaint();
        
        if (total_kinetic_energy > epsilon && counter < max_iter) {
            counter += 1;
            setTimeout(func, timeout);
        } else {
            // Remove temp variables and remember changes
            for (var nid in g.nodes) { 
                var node = g.nodes[nid];                
                delete node.velocity;
                newValues['nodes'][nid] = jQuery.extend(true, {}, node.dim);
            }
            
            // Save the origin position
            oldValues['origin'] = { 'x' : g.originX, 'y' : g.originY };
            newValues['origin'] = { 'x' : g.originX, 'y' : g.originY };
            
            // Push the changes to undo
            g.pushToUndo(g.cmdNode, guid(), g.cmdLayout, oldValues, newValues);
            
            // Indicate that layout is no longer in progress
            delete g.layoutInProgress;
            
            // Show the valence selector if appropriate
            g.showValenceSelector();
            g.repaint();
        }
    };
        
    setTimeout(func, timeout);
}

/** 
    Computes the theoretical centre of the CAM.
**/
Graph.prototype.computeGraphCentre = function() {
    // Calculate the theoretical center of the CAM
    var dx = 0;
    var dy = 0;
    var nodeCount = 0;
    for (var nid in this.nodes) {        
        var node = this.nodes[nid];        
        dx += node.dim.x;
        dy += node.dim.y;
        nodeCount += 1;
    }
    if (nodeCount != 0) {
        dx /= nodeCount;
        dy /= nodeCount;
    }
    return [dx, dy];
}

/**
    Position the screen at the geometric centre of the Nodes in the Graph
**/ 
Graph.prototype.centreGraph = function() {
    var center = this.computeGraphCentre();
    
    // For undo
    var oldValues = { 'nodes': {}, 'edges': {} };
    var newValues = { 'nodes': {}, 'edges': {} };
    
    // Move components so that the graph origin and theoretical origin coincide
    for (var nid in this.nodes) {
        var node = this.nodes[nid];
        oldValues['nodes'][nid] = jQuery.extend(true, {}, node.dim);
        node.dim.x -= center[0];
        node.dim.y -= center[1];
        newValues['nodes'][nid] = jQuery.extend(true, {}, node.dim);
    }
    
    // Adjust complex edge positions
    for (var eid in this.edges) {
        var edge = this.edges[eid];
        if (edge.innerPoints && edge.innerPoints.length > 0) {
            oldValues['edges'][eid] = [];
            newValues['edges'][eid] = [];
            for (var i = 0; i < edge.innerPoints.length; i += 1) {
                var point = edge.innerPoints[i];
                oldValues['edges'][eid].push(new Point(point.x, point.y));
                point.x -= center[0];
                point.y -= center[1];
                newValues['edges'][eid].push(new Point(point.x, point.y));
            }
        }
    }
    
    // Update the graph origin
    oldValues['origin'] = { 'x' : this.originX, 'y' : this.originY };
    this.originX = this.canvas.width / 2;
    this.originY = this.canvas.height / 2;
    newValues['origin'] = { 'x' : this.originX, 'y' : this.originY };
    
    // Push the changes to undo
    this.pushToUndo(this.cmdNode, guid(), this.cmdLayout, oldValues, newValues);

    // Show the valence selector if appropriate
    this.showValenceSelector();
    
    // Redraw the graph
    this.repaint();
}

/**
    Modifies node coordinates.
**/
Graph.prototype.move = function(node, offsetX, offsetY) {
    node.dim.x += offsetX / this.zoomScale;
    node.dim.y += offsetY / this.zoomScale;
}

/**
    Moves a single node on the screen.
     
    Assumes you are moving a selected node.
**/
Graph.prototype.moveSingleNode = function(node, offsetX, offsetY) {
    if (!(node instanceof Node)) {
        return;
    }
    
    var oldDim = jQuery.extend(true, {}, node.dim); 
    this.move(node, offsetX, offsetY);
    var newDim = jQuery.extend(true, {}, node.dim);
    
    // Add to undo
    this.pushToUndo(this.cmdNode, node.id, this.cmdDim, oldDim, newDim);
    
    // Reposition the valence selector, if appropriate
    if (this.selectedObject == node) {
        this.positionSlider(node);
    }
    
    // Repaint the graph
    this.repaint();
}

/**
    Moves a group of nodes on the screen.
**/
Graph.prototype.moveSelectedNodes = function(selection, offsetX, offsetY) {

    var oldValues = {};
    var newValues = {};
    for (var id in selection) {
        var obj = selection[id];
        if (obj instanceof Node) {
            oldValues[obj.id] = jQuery.extend(true, {}, obj.dim);
            this.move(obj, offsetX, offsetY);
            newValues[obj.id] = jQuery.extend(true, {}, obj.dim);
        }
    }
    
    // Add to undo
    g.pushToUndo(g.cmdMulti, "multi", g.cmdDim, oldValues, newValues);
    
    // Repaint the graph
    this.repaint();
}

/**
    Moves the graph origin.
**/
Graph.prototype.moveOrigin = function(offsetX, offsetY) {
 
    // Hide control elements
    this.hideValenceSelector();
    this.hideTextEditor();
 
    var oldOrigin = {'x' : this.originX, 'y' : this.originY}; 
    this.originX += offsetX / this.zoomScale;
    this.originY += offsetY / this.zoomScale;
    var newOrigin = {'x' : this.originX, 'y' : this.originY}; 
    
    // Add to undo
    g.pushToUndo(g.cmdNode, "origin", g.cmdGraphMove, oldOrigin, newOrigin);
    
    // Show the valence selector if appropriate
    this.showValenceSelector();
    
    // Repaint the graph
    this.repaint();
}

/**
    Reposition a node in the graph.
**/
Graph.prototype.setPosition = function(n, x, y, pushToUndo) {    
    var oldDim = jQuery.extend(true, {}, n.dim);
    n.dim.x = g.unscaleX(x);
    n.dim.y = g.unscaleY(y);
    var newDim = jQuery.extend(true, {}, n.dim);

    // Push to undo stack
    if (pushToUndo) {
        this.pushToUndo(this.cmdNode, n.id, this.cmdDim, oldDim, newDim);
    }
}