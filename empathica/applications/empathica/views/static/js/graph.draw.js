/** 
    Functions used to draw Graph contents to the Canvas context
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Main function called to draw the nodes and edges
**/
Graph.prototype.draw = function(ctx, originX, originY) {
    var oldX = this.originX;
    var oldY = this.originY;
    
    this.originX = originX;
    this.originY = originY;

    this.drawEdges(ctx);
    this.drawNodes(ctx);

    this.originX = oldX;
    this.originY = oldY;
}

/**
    Draw the Nodes
**/
Graph.prototype.drawNodes = function(ctx) {
    // Draw based on the draw order stack
    for (var i = 0; i < this.drawOrder.length; i += 1) {
        this.drawNode(ctx, this.nodes[this.drawOrder[i]]);
    }   
}

/**
    Draw an individual Node to the context
**/
Graph.prototype.drawNode = function(ctx, node) {

    ctx.save();
    if (node.selected) {
        ctx.fillStyle = node.theme['fill']['focused'];
        ctx.strokeStyle = node.theme['line']['focused'];
    } else if (this.hoverObject == node) {
        ctx.fillStyle = node.theme['fill']['hover'];
        ctx.strokeStyle = node.theme['line']['hover'];
    } else {
        ctx.fillStyle = node.theme['fill']['normal'];
        ctx.strokeStyle = node.theme['line']['normal'];
    }
    
    // Compute border width
    ctx.lineWidth = this.nodeOutlineWidth + Math.abs(node.valence * this.nodeOutlineVariance);

    // Draw the shape
    node.draw(ctx);
    
    // Draw text
    this.drawText(ctx, node);

    if (node.selected) {
        this.drawSelectionHandles(ctx, node);
    }
    
    ctx.restore();
}

function drawAmbivalent(ctx) {
    // Fill in and outline the hex
    this.outline = drawHex;
    this.outline(ctx);
    ctx.fill();
    ctx.stroke();

    // Fill in and outline and oval
    this.outline = drawOval;
    this.outline(ctx);
    ctx.fill();
    ctx.stroke();        
    
    // Reset the basic outline function
    this.outline = drawHex;
}

function drawNormal (ctx) {
    // Draw the shape
    this.outline(ctx);
    
    // Fill in and outline
    ctx.fill();
    ctx.stroke();
}

/** 
    Draw the Edges
**/
Graph.prototype.drawEdges = function(ctx) {
    ctx.strokeStyle = this.edgeColour;
    ctx.lineCap = this.edgeLineCap;
    for(var i in this.edges) {
        var edge = this.edges[i];
        this.drawEdge(ctx, edge);
    }
}

/**
    Draw an individual Edge to the context
**/
Graph.prototype.drawEdge = function(ctx, edge) {    
    var from = this.nodes[edge.from];
    var to = this.nodes[edge.to];
    
    // Check that the to and from nodes exists
    if (from === undefined || to === undefined) {
        return;
    }
    
    ctx.save();   
    ctx.beginPath();
    if (edge.valence < this.neutralValence) {     
        // if any inner points
        if (edge.innerPoints && edge.innerPoints.length > 0) {
            var pts = edge.innerPoints;
            ctx.dashedLineTo(this.scaleX(from.dim.x), this.scaleY(from.dim.y), this.scaleX(pts[0].x), this.scaleY(pts[0].y), this.dashedPattern);
            for (var i = 0; i < pts.length - 1; i++) {
                ctx.dashedLineTo(this.scaleX(pts[i].x), this.scaleY(pts[i].y), this.scaleX(pts[i+1].x), this.scaleY(pts[i+1].y), this.dashedPattern);
            }
            ctx.dashedLineTo(this.scaleX(pts[pts.length-1].x), this.scaleY(pts[pts.length-1].y), this.scaleX(to.dim.x), this.scaleY(to.dim.y), this.dashedPattern);
        } else {
            ctx.dashedLineTo(this.scaleX(from.dim.x), this.scaleY(from.dim.y), this.scaleX(to.dim.x), this.scaleY(to.dim.y), this.dashedPattern);
        }
    } else {        
        if (edge.innerPoints && edge.innerPoints.length > 0) {
            var pts = edge.innerPoints;
            ctx.moveTo(this.scaleX(from.dim.x), this.scaleY(from.dim.y));
            for (var i = 0; i < pts.length; i++) {
                ctx.lineTo(this.scaleX(pts[i].x), this.scaleY(pts[i].y));
            }
            ctx.lineTo(this.scaleX(to.dim.x), this.scaleY(to.dim.y));
        } else {
            ctx.moveTo(this.scaleX(from.dim.x), this.scaleY(from.dim.y));
            ctx.lineTo(this.scaleX(to.dim.x), this.scaleY(to.dim.y));
        }
    }
    
    ctx.lineWidth = this.edgeWidth + Math.abs(edge.valence * this.edgeVariance);    
    if (edge.selected) {
        ctx.strokeStyle = edge.theme['line']['focused'];
        ctx.shadowBlur = parseInt(this.theme.edgeGlowSize);
        ctx.shadowColor = edge.theme['glow']['focused'];
    } else if (this.hoverObject == edge) {
        ctx.strokeStyle = edge.theme['line']['hover'];
        ctx.shadowBlur = parseInt(this.theme.edgeGlowSize);
        ctx.shadowColor = edge.theme['glow']['hover'];
    } else {
        ctx.strokeStyle = edge.theme['line']['normal'];
        ctx.shadowBlur = 0;
        ctx.shadowColor = edge.theme['glow']['normal'];
    }
    ctx.stroke();
    ctx.restore();
}

/**
    Drawing the shapes
    These functions are also used to draw Node outlines for determining Node selection
**/
function drawRect(ctx) {
    ctx.beginPath();
    
    var dim = this.dim;
    var xOffset = dim.width/2;
    var yOffset = dim.height/2;
    ctx.moveTo(g.scaleX(dim.x - xOffset), g.scaleY(dim.y - yOffset)); 
    ctx.lineTo(g.scaleX(dim.x + xOffset), g.scaleY(dim.y - yOffset)); 
    ctx.lineTo(g.scaleX(dim.x + xOffset), g.scaleY(dim.y + yOffset)); 
    ctx.lineTo(g.scaleX(dim.x - xOffset), g.scaleY(dim.y + yOffset)); 
    ctx.closePath();
}

function drawOval(ctx) {    
 
    ctx.beginPath();
    
    var dim = this.dim;
    var controlRectWidth = dim.width * 1.2;
    var xOffset = controlRectWidth/2;
    var yOffset = dim.height/2;
    
    ctx.moveTo(g.scaleX(dim.x), g.scaleY(dim.y - dim.height/2));
    
    // draw left side of oval
    ctx.bezierCurveTo(g.scaleX(dim.x - xOffset), g.scaleY(dim.y - yOffset),
                      g.scaleX(dim.x - xOffset), g.scaleY(dim.y + yOffset),
                      g.scaleX(dim.x),           g.scaleY(dim.y + yOffset));
 
    // draw right side of oval
    ctx.bezierCurveTo(g.scaleX(dim.x + xOffset), g.scaleY(dim.y + yOffset),
                      g.scaleX(dim.x + xOffset), g.scaleY(dim.y - yOffset),
                      g.scaleX(dim.x),           g.scaleY(dim.y - yOffset));
    
    ctx.closePath();
}

function drawHex(ctx) {
    ctx.beginPath();
    
    var dim = this.dim;
    var xOffset = dim.width/2;
    var yOffset = dim.height/2;
    
    ctx.moveTo(g.scaleX(dim.x - g.hexOffset*xOffset), g.scaleY(dim.y - yOffset));
    ctx.lineTo(g.scaleX(dim.x + g.hexOffset*xOffset), g.scaleY(dim.y - yOffset));
    ctx.lineTo(g.scaleX(dim.x + xOffset), g.scaleY(dim.y));
    ctx.lineTo(g.scaleX(dim.x + g.hexOffset*xOffset), g.scaleY(dim.y + yOffset));
    ctx.lineTo(g.scaleX(dim.x - g.hexOffset*xOffset), g.scaleY(dim.y + yOffset));
    ctx.lineTo(g.scaleX(dim.x - xOffset), g.scaleY(dim.y)); 
    ctx.lineTo(g.scaleX(dim.x - g.hexOffset*xOffset), g.scaleY(dim.y - yOffset));
    
    ctx.closePath();
}

/**
    Draw selection handles around outside of shape
**/
Graph.prototype.drawSelectionHandles = function(ctx, node) {

    this.handleContext = ctx;

    var saveFillStyle = ctx.fillStyle;
    
    var dim = node.dim;
    var xOffset = dim.width/2;
    var yOffset = dim.height/2;
    var hOffset = this.handleSize/2;
    
    ctx.fillStyle = this.theme.nodeSelectionHandles;
    ctx.fillRect(this.scaleX(dim.x - xOffset) - hOffset, 
                 this.scaleY(dim.y - yOffset) - hOffset,
                 this.handleSize, this.handleSize);
    
    ctx.fillRect(this.scaleX(dim.x + xOffset) - hOffset, 
                 this.scaleY(dim.y - yOffset) - hOffset,
                 this.handleSize, this.handleSize);
                
    ctx.fillRect(this.scaleX(dim.x - xOffset) - hOffset, 
                 this.scaleY(dim.y + yOffset) - hOffset,
                 this.handleSize, this.handleSize);
                
    ctx.fillRect(this.scaleX(dim.x + xOffset) - hOffset, 
                 this.scaleY(dim.y + yOffset) - hOffset,
                 this.handleSize, this.handleSize);
                
    ctx.fillStyle = saveFillStyle;
}

/**
    Fill in the text of a node centred horizontally and vertically in the node
**/
Graph.prototype.drawText = function(ctx, node) {
    
    var fontSize;
    if (!this.settings['fixedFont']) {
        // Linearly adjust the font sizes for nodes differing from the standard node size
        var increaseX = Math.round((node.dim.width - this.defaultNodeWidth) / this.fontIncreaseDivider) * this.fontIncreaseStep;
        var increaseY = Math.round((node.dim.height - this.defaultNodeHeight) / this.fontIncreaseDivider) * this.fontIncreaseStep;
        fontSize = Math.round((this.theme.nodeFontSize + Math.min(increaseX, increaseY)) * this.zoomScale);
    } else {
        fontSize = this.theme.nodeFontSize;
    }
    
    ctx.save();
    ctx.font = this.setFont(node, fontSize);
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    ctx.fillStyle = ( node.selected ? node.theme['font']['focused'] : node.theme['font']['normal'] );
    
    // determine x and y - want to centre the text in the node 
    var x = this.scaleX(node.dim.x);
    var y = this.scaleY(node.dim.y);
    
    // Get the lines partitioning based on the preset font style
    var lines = this.getTextLines(ctx, node);
    
    // Compute the new font height and width
    var textWidth = this.lengthOfLongestLine(ctx, lines);
    var textHeight = lines.length * fontSize;
    var xThreshold = 0.8 * node.dim.width * this.zoomScale;
    var yThreshold = node.dim.height * this.zoomScale;
    
    // If they exceed the scaled node boundaries, need to resize the font
    if (!this.settings['fixedFont'] && (textWidth > xThreshold || textHeight > yThreshold)) {
        fontSize *= Math.min(xThreshold / textWidth, yThreshold / textHeight);
        ctx.font = this.setFont(node, fontSize);
    }
    
    // Centre everything vertically based on line height (font offset works differently in Firefox!!)
    // BUGBUG - The first line should be offset slightly more
    var startY = y - (lines.length - 1) * fontSize / 2;
    if (navigator.userAgent.indexOf("Firefox") != -1) {
        startY -= 0.5 * fontSize;
    } else {
        startY -= 0.75 * fontSize;
    }
    
    for (var i = 0; i < lines.length; i++) {
        if (lines[i] != '') {
            ctx.fillText(lines[i], x, startY + fontSize * i);
        }
    }
    
    ctx.restore();
}

/**
    Save the canvas content as a PNG image. If thumb is true, creates a 
    407 x 260 thumbnail for the Conflict Overview page. 
    
    @returns a string containing the PNG image data. 
**/
Graph.prototype.createImage = function(thumb) {
    var canvas = this.canvas;
    var canvasCopy = document.createElement("canvas");
    var contextCopy = canvasCopy.getContext("2d");
    
    var bounds = this.getBounds();
    var sourceWidth = bounds.right - bounds.left + 20;
    var sourceHeight = bounds.bottom - bounds.top + 20;
    
    if (thumb) {
        var thumbX = 407;
        var thumbY = 260;
    
        canvasCopy.width = thumbX;
        canvasCopy.height = thumbY;
        
        var oldZoom = this.zoomScale;
                
        while ((sourceWidth > thumbX || sourceHeight > thumbY) && this.zoomScale > 0.1) {
            this.zoomScale -= 0.1;
            bounds = this.getBounds();
            sourceWidth = bounds.right - bounds.left + 20;
            sourceHeight = bounds.bottom - bounds.top + 20;
        }
        
        // Make sure the proportions are integers
        sourceWidth = Math.round(sourceWidth + thumbX * (Math.ceil(sourceWidth / thumbX) - sourceWidth / thumbX));
        sourceHeight = Math.round(sourceHeight + thumbY * (Math.ceil(sourceHeight / thumbY) - sourceHeight / thumbY));
        
        // Now make sure proportions are the same
        var proportionDiff = sourceWidth / thumbX - sourceHeight / thumbY;
        sourceWidth -= proportionDiff < 0 ? proportionDiff * thumbX : 0;
        sourceHeight += proportionDiff > 0 ? proportionDiff * thumbY : 0;
        
        // Draw the CAM on a full canvas
        var tempCanvas = document.createElement("canvas");
        tempCanvas.width = sourceWidth;
        tempCanvas.height = sourceHeight;
        this.draw(tempCanvas.getContext("2d"), (tempCanvas.width - bounds.left - bounds.right) / 2, (tempCanvas.height - bounds.top - bounds.bottom) / 2);
        this.zoomScale = oldZoom;
        
        contextCopy.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvasCopy.width, canvasCopy.height);
    } else { 
        // This is the target for the image
        canvasCopy.width = sourceWidth;
        canvasCopy.height = sourceHeight;
        
        // Draw the CAM
        this.draw(contextCopy, (canvasCopy.width  - bounds.left - bounds.right) / 2, (canvasCopy.height - bounds.top - bounds.bottom) / 2);
    }

    return canvasCopy.toDataURL("image/png");
}

/**
    Find the bounding box for a given node.
**/
Graph.prototype.getBoundingBox = function(node) {
    var bounds = {};
    var dim = node.dim;
    bounds.left = dim.x - dim.width/2;
    bounds.top = dim.y - dim.height/2;
    bounds.right = dim.x + dim.width/2;
    bounds.bottom = dim.y + dim.height/2;
    return bounds;
}

/**
    Find the bounding box fitting all the shapes in the Graph
**/
Graph.prototype.getBounds = function() {
    var nodeCount = 0;
    var first = "";
    for (var i in this.nodes) { nodeCount++; first = i;}
    if (nodeCount == 0) {
        var bounds = {};
        bounds.left = 0;
        bounds.top = 0;
        bounds.right = 100;
        bounds.bottom = 100;
        return bounds;
    }
    
    var bounds = this.getBoundingBox(this.nodes[first]);
    for (var i in this.nodes) {
        var node_bounds = this.getBoundingBox(this.nodes[i]);
        if (node_bounds.left < bounds.left) {
            bounds.left = node_bounds.left;
        }
        if (node_bounds.right > bounds.right) {
            bounds.right = node_bounds.right;
        }
        if (node_bounds.top < bounds.top) {
            bounds.top = node_bounds.top;
        }
        if (node_bounds.bottom > bounds.bottom) {
            bounds.bottom = node_bounds.bottom;
        }
    }
    
    for (var i in this.edges) {
        var e = this.edges[i];
        if (e.innerPoints && e.innerPoints.length > 0) {
            for (var pid in e.innerPoints) {
                var p = e.innerPoints[pid];
                if (p.x < bounds.left) {
                    bounds.left = p.x;
                }
                if (p.x > bounds.right) {
                    bounds.right = p.x;
                }
                if (p.y < bounds.top) {
                    bounds.top = p.y;
                }
                if (p.y > bounds.bottom) {
                    bounds.bottom = p.y;
                }
            }
        }
    }
    
    bounds.left *= this.zoomScale;
    bounds.top *= this.zoomScale;
    bounds.right *= this.zoomScale;
    bounds.bottom *= this.zoomScale;
    return bounds;
}

/**
    A utility function for proper scaling of shapes and edges.
    
    Implements the Hack bitwise shift rounding http://www.html5rocks.com/en/tutorials/canvas/performance/.
**/
Graph.prototype.scaleX = function(x) {
    return (0.5 + x * this.zoomScale + this.originX) << 0;
}

Graph.prototype.scaleY = function(y) {
    return (0.5 + y * this.zoomScale + this.originY) << 0;
}

Graph.prototype.unscaleX = function(x) {
    return (x - this.originX) / this.zoomScale;
}

Graph.prototype.unscaleY = function(y) {
    return (y - this.originY) / this.zoomScale;
}

/**
    Checks if a point is contained in a bounding box
    defined by (x1,y1) - top left, and (x2,y2) - bottom right.
**/
Graph.prototype.containedIn = function(x, y, x1, y1, x2, y2) {
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}