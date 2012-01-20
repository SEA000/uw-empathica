/** 
    Functions used to draw Graph contents to the Canvas context
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Main function called to draw the nodes and edges
**/
Graph.prototype.draw = function() {
    var canvas = this.canvas;
    var ctx = this.ctx;
    
    // TODO: remove the added height these are currently put in to prevent
    // the canvas from showing scrollbars
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 1;

    this.drawEdges(ctx);
    
    this.drawNodes(ctx);
    
    if (this.outlineCanvas) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.canvasOutlineColour;
        ctx.strokeRect(0,0,canvas.width, canvas.height);
    }
}

/**
    Draw the Nodes
**/
Graph.prototype.drawNodes = function(ctx) {
    // Draw based on the draw order stack
    for (var i = 0; i < this.drawOrder.length; i++) {
        var node = this.nodes[this.drawOrder[i]];
        this.drawNode(ctx, node);
    }   
}

/**
    Draw an individual Node to the context
**/
Graph.prototype.drawNode = function(ctx, node) {
    // Draw the paths for the shapes
    if (node.valence > this.neutralValence) {
        this.drawOval(ctx, node);
        ctx.fillStyle = ( node.selected ? this.theme.nodePositiveFillFocused : this.theme.nodePositiveFillNormal );
        ctx.strokeStyle = ( node.selected ? this.theme.nodePositiveLineFocused : this.theme.nodePositiveLineNormal );
        if (!node.selected) {
            if (this.hoverObject == node) {
                ctx.fillStyle = this.theme.nodePositiveFillHover;
                ctx.strokeStyle = this.theme.nodePositiveLineHover;
            }
        }
    } else if (node.valence < this.neutralValence) {
        this.drawHex(ctx, node);
        ctx.fillStyle = ( node.selected ? this.theme.nodeNegativeFillFocused : this.theme.nodeNegativeFillNormal );
        ctx.strokeStyle = ( node.selected ? this.theme.nodeNegativeLineFocused : this.theme.nodeNegativeLineNormal );
        if (!node.selected) {
            if (this.hoverObject == node) {
                ctx.fillStyle = this.theme.nodeNegativeFillHover;
                ctx.strokeStyle = this.theme.nodeNegativeLineHover;
            }
        }
    } else {
        this.drawRect(ctx, node);
        ctx.fillStyle = ( node.selected ? this.theme.nodeNeutralFillFocused : this.theme.nodeNeutralFillNormal );
        ctx.strokeStyle = ( node.selected ? this.theme.nodeNeutralLineFocused : this.theme.nodeNeutralLineNormal );
        if (!node.selected) {
            if (this.hoverObject == node) {
                ctx.fillStyle = this.theme.nodeNeutralFillHover;
                ctx.strokeStyle = this.theme.nodeNeutralLineHover;
            }
        }
    }
    
    // Fill in and outline
    ctx.fill();
    
    // Draw the border
    ctx.lineWidth = this.nodeOutlineWidth + Math.abs(node.valence * this.nodeOutlineVariance);
    ctx.stroke();
    
    // Draw text
    this.drawText(ctx, node);

    if (node.selected) {
        this.drawSelectionHandles(ctx,node);
    }
}

/** 
    Draw the Edges
**/
Graph.prototype.drawEdges = function(ctx) {
    ctx.strokeStyle = this.edgeColour;
    ctx.lineCap = this.edgeLineCap;
    for(i in this.edges) {
        var edge = this.edges[i];
        this.drawEdge(ctx, edge);
    }
}

/**
    Draw an individual Edge to the context
**/
Graph.prototype.drawEdge = function(ctx, edge) {
    ctx.lineCap = this.edgeLineCap;
    
    var from = this.nodes[edge.from];
    var to = this.nodes[edge.to];
    
    ctx.lineWidth = this.edgeWidth + Math.abs(edge.valence * this.edgeVariance);

    ctx.beginPath();
    if (edge.valence < this.neutralValence) {
        // if any inner points
        ctx.strokeStyle = ( edge.selected ? this.theme.edgeNegativeLineFocused : this.theme.edgeNegativeLineNormal );
        if (this.hoverObject == edge && !edge.selected) {
            ctx.strokeStyle = this.theme.edgeNegativeLineHover;
        }
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
        ctx.strokeStyle = ( edge.selected ? this.theme.edgePositiveLineFocused : this.theme.edgePositiveLineNormal );
        if (this.hoverObject == edge && !edge.selected) {
            ctx.strokeStyle = this.theme.edgePositiveLineHover;
        }
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
    
    if (edge.selected) {
        this.edgeSelectedStyleOn(ctx, edge);
        ctx.stroke();
        this.edgeStyleNormal(ctx, edge);
    } else if (this.hoverObject == edge) {
        this.edgeHoverStyleOn(ctx, edge);
        ctx.stroke();
        this.edgeStyleNormal(ctx, edge);
    } else {
        ctx.stroke();
    }
}

/**
    Drawing the shapes
    These functions are also used to draw Node outlines for determining Node selection
**/
Graph.prototype.drawRect = function(ctx, node) {
    ctx.beginPath();
    var xOffset = node.dim.width/2;
    var yOffset = node.dim.height/2;
    ctx.moveTo(this.scaleX(node.dim.x - xOffset), this.scaleY(node.dim.y - yOffset)); 
    ctx.lineTo(this.scaleX(node.dim.x + xOffset), this.scaleY(node.dim.y - yOffset)); 
    ctx.lineTo(this.scaleX(node.dim.x + xOffset), this.scaleY(node.dim.y + yOffset)); 
    ctx.lineTo(this.scaleX(node.dim.x - xOffset), this.scaleY(node.dim.y + yOffset)); 
    ctx.closePath();
}

Graph.prototype.drawOval = function(ctx, node) {
    // Code from http://www.html5canvastutorials.com/tutorials/html5-canvas-ovals/
    var controlRectWidth = node.dim.width * 1.25 ;
 
    ctx.beginPath();
    
    var xOffset = controlRectWidth/2;
    var yOffset = node.dim.height/2;
    
    ctx.moveTo(this.scaleX(node.dim.x), this.scaleY(node.dim.y - node.dim.height/2));
    
    // draw left side of oval
    ctx.bezierCurveTo(this.scaleX(node.dim.x - xOffset), this.scaleY(node.dim.y - yOffset),
                      this.scaleX(node.dim.x - xOffset), this.scaleY(node.dim.y + yOffset),
                      this.scaleX(node.dim.x),           this.scaleY(node.dim.y + yOffset));
 
    // draw right side of oval
    ctx.bezierCurveTo(this.scaleX(node.dim.x + xOffset), this.scaleY(node.dim.y + yOffset),
                      this.scaleX(node.dim.x + xOffset), this.scaleY(node.dim.y - yOffset),
                      this.scaleX(node.dim.x),           this.scaleY(node.dim.y - yOffset));
    
    ctx.closePath();
}

Graph.prototype.drawHex = function(ctx, node) {
    ctx.beginPath();
    
    var xOffset = node.dim.width/2;
    var yOffset = node.dim.height/2;
    
    ctx.moveTo(this.scaleX(node.dim.x - this.hexOffset*xOffset), this.scaleY(node.dim.y - yOffset));
    ctx.lineTo(this.scaleX(node.dim.x + this.hexOffset*xOffset), this.scaleY(node.dim.y - yOffset));
    ctx.lineTo(this.scaleX(node.dim.x + xOffset), this.scaleY(node.dim.y));
    ctx.lineTo(this.scaleX(node.dim.x + this.hexOffset*xOffset), this.scaleY(node.dim.y + yOffset));
    ctx.lineTo(this.scaleX(node.dim.x - this.hexOffset*xOffset), this.scaleY(node.dim.y + yOffset));
    ctx.lineTo(this.scaleX(node.dim.x - xOffset), this.scaleY(node.dim.y)); 
    ctx.lineTo(this.scaleX(node.dim.x - this.hexOffset*xOffset), this.scaleY(node.dim.y - yOffset));
    
    ctx.closePath();
}

/**
    Draw selection handles around outside of shape
**/
Graph.prototype.drawSelectionHandles = function(ctx, node) {

    this.handleContext = ctx;

    var saveFillStyle = ctx.fillStyle;
    var xOffset = node.dim.width/2;
    var yOffset = node.dim.height/2;
    var hOffset = this.handleSize/2;
    
    ctx.fillStyle = this.theme.nodeSelectionHandles;
    ctx.fillRect(this.scaleX(node.dim.x - xOffset) - hOffset, 
                this.scaleY(node.dim.y - yOffset) - hOffset,
                this.handleSize, this.handleSize);
    
    ctx.fillRect(this.scaleX(node.dim.x + xOffset) - hOffset, 
                this.scaleY(node.dim.y - yOffset) - hOffset,
                this.handleSize, this.handleSize);
                
    ctx.fillRect(this.scaleX(node.dim.x - xOffset) - hOffset, 
                this.scaleY(node.dim.y + yOffset) - hOffset,
                this.handleSize, this.handleSize);
                
    ctx.fillRect(this.scaleX(node.dim.x + xOffset) - hOffset, 
                this.scaleY(node.dim.y + yOffset) - hOffset,
                this.handleSize, this.handleSize);
                
    ctx.fillStyle = saveFillStyle;
}

/**
    Turn on shadows for the subsequently drawn elements
**/
Graph.prototype.edgeSelectedStyleOn = function(ctx, edge) {
    ctx.shadowBlur = parseInt(this.theme.edgeGlowSize);
    if (edge.valence < this.neutralValence) {
        ctx.shadowColor = this.theme.edgeNegativeGlowFocused;
    } else {
        ctx.shadowColor = this.theme.edgePositiveGlowFocused;
    }
}

/**
    Turn off shadows for the subsequently drawn elements
**/
Graph.prototype.edgeStyleNormal = function(ctx, edge) {
    ctx.shadowBlur = 0;
    if (edge.valence < this.neutralValence) {
        ctx.shadowColor = this.theme.edgeNegativeGlowNormal;
    } else {
        ctx.shadowColor = this.theme.edgePositiveGlowNormal;
    }
}

/**
    Style hovered Edges
**/
Graph.prototype.edgeHoverStyleOn = function(ctx, edge) {
    ctx.shadowBlur = parseInt(this.theme.edgeGlowSize);
    if (edge.valence < this.neutralValence) {
        ctx.shadowColor = this.theme.edgeNegativeGlowHover;
    } else {
        ctx.shadowColor = this.theme.edgePositiveGlowHover;
    }
}

/**
    Fill in the text of a node centred horizontally and vertically in the node
**/
Graph.prototype.drawText = function(ctx, node) {
    var style = this.theme.nodeFontSize + ' ' + this.theme.nodeFontFamily;
    if (Math.abs(node.valence) > this.strongThreshold) {
        style = "bold " + style;
    }
    
    ctx.font = style;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    
    if (node.valence > this.neutralValence) {
        ctx.fillStyle = ( node.selected ? this.theme.nodePositiveFontFocused : this.theme.nodePositiveFontNormal );
    } else if (node.valence < this.neutralValence) {
        ctx.fillStyle = ( node.selected ? this.theme.nodeNegativeFontFocused : this.theme.nodeNegativeFontNormal );
    } else {
        ctx.fillStyle = ( node.selected ? this.theme.nodeNeutralFontFocused : this.theme.nodeNeutralFontNormal );
    }
    
    // determine x and y - want to centre the text in the node 
    var x = this.scaleX(node.dim.x);
    var y = this.scaleY(node.dim.y);
    
    var lines = this.getTextLines(ctx, node);
    
    // Centre everything vertically based on line height
    var startY = y - lines.length * parseInt(this.theme.nodeFontLineHeight) / 2;
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, startY + parseInt(this.theme.nodeFontLineHeight) * i);
    }
}

/**
    Save the canvas content as a PNG image. If thumb is true, creates a 
    407 x 260 thumbnail for the Conflict Overview page. 
    
    @returns a string containing the PNG image data. 
**/
Graph.prototype.createImage = function(thumb) {
    var canvas = this.canvas;
    var ctx = this.ctx;
    var img = new Image();
    var canvasCopy = document.createElement("canvas");
    
    if (thumb) {
        canvasCopy.width = 407;
        canvasCopy.height = 260;
        var contextCopy = canvasCopy.getContext("2d");
        contextCopy.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasCopy.width, canvasCopy.height);
    } else { 
        var bounds = this.getBounds();
        canvasCopy.width = Math.min(bounds.right - bounds.left + 10, canvas.width);
        canvasCopy.height = Math.min(bounds.bottom - bounds.top + 10, canvas.height);
        var contextCopy = canvasCopy.getContext("2d");
        contextCopy.drawImage(canvas, Math.max(0, bounds.left-5), Math.max(0, bounds.top-5), canvasCopy.width, canvasCopy.height, 0, 0, canvasCopy.width, canvasCopy.height);
    }
    return canvasCopy.toDataURL("image/png");
}

/**
    Find the bounding box fitting all the shapes in the Graph
**/
Graph.prototype.getBounds = function() {
    var bounds = {};
    var nodeCount = 0;
    var first = "";
    for (var i in this.nodes) { nodeCount++; first = i;}
    if (nodeCount == 0) {
        bounds.left = 0;
        bounds.top = 0;
        bounds.right = 100;
        bounds.bottom = 100;
        return bounds;
    }
    
    bounds.left = this.nodes[first].dim.x - this.nodes[first].dim.width/2;
    bounds.top = this.nodes[first].dim.y - this.nodes[first].dim.height/2;
    bounds.right = this.nodes[first].dim.x + this.nodes[first].dim.width/2;
    bounds.bottom = this.nodes[first].dim.y + this.nodes[first].dim.height/2;
    
    for (var i in this.nodes) {
        var n = this.nodes[i];
        if (n.dim.x - n.dim.width/2 < bounds.left) {
            bounds.left = n.dim.x - n.dim.width/2;
        }
        if (n.dim.x + n.dim.width/2 > bounds.right) {
            bounds.right = n.dim.x + n.dim.width/2;
        }
        if (n.dim.y - n.dim.height/2 < bounds.top) {
            bounds.top = n.dim.y - n.dim.width/2;
        }
        if (n.dim.y + n.dim.height/2 > bounds.bottom) {
            bounds.bottom = n.dim.y + n.dim.width/2;
        }
    }
    
    for (var i in this.edges) {
        var e = this.edges[i];
        if (e.innerPoints && e.innerPoints.length > 0) {
            for (var p in e.innerPoints) {
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
    
    bounds.left = this.scaleX(bounds.left);
    bounds.top = this.scaleY(bounds.top);
    bounds.right = this.scaleX(bounds.right);
    bounds.bottom = this.scaleY(bounds.bottom);
    return bounds;
}

/**
    A utility function for proper scaling of shapes and edges.
**/
Graph.prototype.scale = function(x, oX)
{
    return (x - oX) * this.zoomScale + oX;
}

Graph.prototype.scaleX = function(x)
{
    return this.scale(x, this.originX);
}

Graph.prototype.scaleY = function(y)
{
    return this.scale(y, this.originY);
}

Graph.prototype.unscale = function(x, oX)
{
    return (x - oX) / this.zoomScale + oX;
}

Graph.prototype.unscaleX = function(x)
{
    return this.unscale(x, this.originX);
}

Graph.prototype.unscaleY = function(y)
{
    return this.unscale(y, this.originY);
}

