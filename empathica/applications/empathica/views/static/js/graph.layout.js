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
    
    this.pushToUndo(new Command(this.cmdNode, guid(), this.cmdLayout, oldValues, newValues));   
    this.repaint();
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
    this.pushToUndo(new Command(this.cmdNode, guid(), this.cmdLayout, oldValues, newValues));

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
    this.pushToUndo(new Command(this.cmdNode, node.id, this.cmdDim, oldDim, newDim));
    
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
    g.pushToUndo(new Command(g.cmdMulti, "", g.cmdDim, oldValues, newValues));
    
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
    g.pushToUndo(new Command(g.cmdNode, "", g.cmdGraphMove, oldOrigin, newOrigin));
    
    // Show the valence selector if appropriate
    this.showValenceSelector();
    
    // Repaint the graph
    this.repaint();
}

/**
    Reposition a node in the graph.
**/
Graph.prototype.setPosition = function(n, x, y) {    
    var oldDim = jQuery.extend(true, {}, n.dim);
    n.dim.x = g.unscaleX(x);
    n.dim.y = g.unscaleY(y);
    var newDim = jQuery.extend(true, {}, n.dim);

    // Push to undo stack
    this.pushToUndo(new Command(this.cmdNode, n.id, this.cmdDim, oldDim, newDim));
}