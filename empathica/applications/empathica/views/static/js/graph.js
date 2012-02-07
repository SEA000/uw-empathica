
// Internal representation of the Graph object 
// used in mouse handler events where 'this' is 
// implicitly redefined. 
var g = new Object();

function Graph() {
    // Name of canvas html element
    this.canvasName = "cam";
    
    // HTML5 canvas elements
    this.canvas = document.getElementById(this.canvasName);
    this.ctx = this.canvas.getContext("2d");
    
    // Other UI elements
    this.valenceSlider = $('#valenceDiv');
    this.valenceInput = $('#valenceInput');
    this.textEditor = $('#textEditDiv');
    this.textInput = $('#textEditInput');
    
    this.mapID = {{=cam.id}};
    this.hash = "{{=can_update}}";
    
    // Min and max values for node and edge valence values
    this.minValence = -1;
    this.neutralValence = 0;
    this.maxValence = 1;
    this.defaultValence = 0;

    /*
        Illustration of hexOffset. It determines the proportion of the 
        hexagon's width on either side of the centre before it begins 
        tapering. 
        
        Note: this is a default value defined for now - each node will have 
        its own hexOffest field in node.format that will be set depending on 
        the size of the contained text. 
       _________________
      /                 \
     /   w/2*p           \
    /  |<----->|          \
    \                     /
     \                   /
      \_________________/
    */
    this.hexOffset = 0.6; 
    this.defaultNodeWidth = 100;
    this.defaultNodeHeight = 60;
    
    // Special node types
    this.ambivalent = "ambivalent";
    
    // Colour scheme for the graph
    this.theme = THEMES.DEFAULT;
    
    // For highlighting nodes
    this.lowColour = 200;
    this.highColour = 245;
    
    // Node outline size
    this.nodeOutlineWidth = 2;
    this.nodeOutlineVariance = 4;

    // Edges
    this.edgeColour = "rgba(1,1,1,255)";
    this.edgeWidth = 1.5;
    this.edgeVariance = 2.0;
    this.edgeLineCap = "square";
    this.dashedPattern = [2, 8]; // Used to determine line/blank interval. See canvasExtension.js
    this.edgePadding = 12;       // pixels on either side of an edge to be used for edge picking
    this.newEdgeColour = "rgba(128,128,128,255)";
    this.newEdgeWidth = 1.5;
    
    // Complex edges
    this.pointArray = new Array();

    // Selection handles
    this.handleTL = "handleTL";
    this.handleTR = "handleTR";
    this.handleBL = "handleBL";
    this.handleBR = "handleBR";
    this.handleSize = 10;

    // Text
    this.fontSize = 14;
    this.fontVariance = 10;
    this.fontLineHeight = 20;
    this.fontStyle = "sans-serif";
    this.textAlign = "center";
    this.textBaseline = "top";
    this.strongThreshold = 0.8;  // if Math.abs(node.valence) exceeds this threshold make the text bold
    this.textWidthInNode = 0.8;  // How much of the width of a node can be occupied by text (on auto-resize)
    this.textHeightInNode = 0.8; // How much of the height of a node can be occupied by text (on auto-resize)
    this.nodeWidthIncrease = 1.2; // Interval by which a node gets wider on auto-resize
    
    // Mouse event flags
    this.mouseDown = false;
    this.prevX = 0;
    this.prevY = 0;
    this.totalX = 0;
    this.totalY = 0;
    this.resizingDirection = "";
    this.resizedOrMoved = false;
    this.oldDim = {};
    
    // Graph selection handling
    this.selectedObject = new Object();
    this.selection = [];
    this.hoverObject = null;
    this.possibleDeselect = new Object();   // This is used if there are multiple nodes selected and the 
                                            // the user (while holding shift) clicks on one of the nodes in 
                                            // order to drag the selected set. Unless the motion includes a drag
                                            // the "possibleDeselect" node is deselected on mouse-up
    
    // Interaction modes
    this.draggingNode = "draggingNode";     // a node has been selected
    this.draggingGraph = "draggingGraph";   // draggingGraph is the default interaction mode
                                            // that allows dragging and selection
    this.resizingNode = "resizingNode";
    this.pickedEdge = "pickedEdge";
    this.renamingNode = "renamingNode";
    this.multiSelect = "multiSelect";
    this.interactionMode = this.draggingGraph;

    // Canvas outline
    this.outlineCanvas = false;
    this.canvasOutlineColour = "rgba(0,0,0,255)";

    // Selection constants
    this.notANode = "notANode";
    this.notAnEdge = "notAnEdge";
    this.handle = "handle";
    this.nothingSelected = "nothingSelected";
    
    // Edge addition state machine
    this.addingEdgeFromNode = new Object();
    this.addingEdgeAddedZero = "addingEdgeZero";
    this.addingEdgeAddedOne = "addingEdgeOne";
    this.addingSpecialType = "";
    this.allowComplexEdge = true;       // Set this to false to disallow the creation of multi-point edges

    // UI Input mode state machine - defines Graph behaviour based on UI settings
    this.stateAddingNodes = "stateAddingNodes";
    this.stateAddingEdges = "stateAddingEdges";
    this.stateAddingSpecial = "stateAddingSpecial";
    this.stateDefault = "stateDefault";
    
    this.inputModeState = this.stateDefault;        // current graph state
    
    // Data structures to keep track of the nodes and edges
    this.nodes = {};
    this.drawOrder = new Array();
    this.edges = {};
    
    // Undo
    this.undoStack = new Array();
    this.cmdHash = new CmdHash();
    this.maxUndoStackSize = 100;
    this.saveThreshold = 60;
    this.numOperations = 0;
    
    // Types
    this.cmdEdge = "cmdEdge";
    this.cmdNode = "cmdNode";
    this.cmdMulti = "cmdMulti";
    
    // Modified "properties"
    this.cmdNodePlaceholder = "cmdNodePlaceholder"; // earliest occurrence of node in undo stack
    this.cmdAddDB = "cmdAddDB";
    this.cmdDeleteDB = "cmdDeleteDB";
    this.cmdValence = "cmdValence";
    this.cmdText = "cmdText";
    this.cmdDim = "cmdDim";
    this.cmdLayout = "cmdLayout";
    this.cmdGraphMove = "cmdGraphMove";
    this.cmdInnerPoints = "cmdInnerPoints";
    this.cmdDragGraph = "cmdDragGraph";
    this.cmdAddSuggested = "cmdAddSuggested";
    
    // Saving
    this.pendingSaves = 0;
    this.redirectOnSave = "";
    
    // Graph and node move
    this.moveOffset = 10;
    
    // Zoom
    this.zoomScale = 1;
    this.originX = 0;
    this.originY = 0;
    this.maxZoomOut = 1;
    this.maxZoomIn = 5;
    this.fontIncreaseDivider = 50;
    this.fontIncreaseStep = 4;
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Initialize UI elements
    var sliderOptions = {
        max: 7,
        min: 1,
        value: 4, 
        slide: this.valenceSlide,
        start: this.sliderStart,
        stop: this.sliderStop
    };
    this.valenceInput.slider(sliderOptions);
    this.valenceInput.css('width', 100);
    this.valenceInput.css('height', 10);    
    this.valenceOld = 0;
    
    // Hide UI elements
    this.hideTextEditor();
    this.hideValenceSelector();
    
    // Setting up the canvas
    this.canvas.width = window.innerWidth - 2;
    this.canvas.height = window.innerHeight - 3;
    this.ctx.lineCap = this.edgeLineCap;
    
    // Setting up the settings array
    this.settings = { 'theme' : '{{=cam.theme}}',
                      'showTitle' : '{{=cam.show_title or True}}' == 'True',
                      'fixedFont' : '{{=cam.fixed_font or False}}' == 'True'};
    
    g = this;
}

/**
    Data structure for a graph node.
**/
function Node (id, text, nodeValence) {
    this.id = id;
    this.text = text;

    // Do not allow null text
    if(this.text == null) {
        this.text = "";
    }
    
    this.dim = {};
    this.special = "";
    this.nodeType = "";
    this.draw = drawNormal;
    
    this.newNode = true;
    this.selected = false;
    
    this.setValence(nodeValence);
}

Node.prototype.setValence = function(valence) {
    this.valence = valence;
    
    // Special node type override the normal themes and draw functions
    if (this.special != ""){
        return;
    }

    if (this.valence > g.neutralValence) {
        this.nodeType = 'positiveNode';   
        this.outline = drawOval;
    } else if (this.valence < g.neutralValence) {
        this.nodeType = 'negativeNode';
        this.outline = drawHex;
    } else {
        this.nodeType = 'neutralNode';
        this.outline = drawRect;
    }
    
    this.updateTheme(); 
}

Node.prototype.setSpecial = function(type) {
    this.special = type;
    if (this.special == null) {
        this.special = "";
    }
    
    // Update the draw function and theme
    if (this.special == g.ambivalent){
        this.nodeType = 'ambivalentNode';
        this.outline = drawHex;
        this.draw = drawAmbivalent;
    }
    
    this.updateTheme();
}

Node.prototype.updateTheme = function() {
    this.theme = g.theme[this.nodeType];
}

/**
    Data structure for a graph edge.
**/
function Edge(id, from, to, v) {
    this.id = id;
    this.from = from;
    this.to = to;
    
    this.edgeType = "";
    this.innerPoints = new Array();
    this.complex = false;
    
    this.newEdge = true;
    this.selected = false;
    
    this.setValence(v);
}

Edge.prototype.setValence = function(valence) {
    this.valence = valence;
    
    if (this.valence < g.neutralValence) {
        this.edgeType = 'negativeEdge';
    } else {
        this.edgeType = 'positiveEdge';
    }
    
    this.updateTheme();
}

Edge.prototype.updateTheme = function() {
    this.theme = g.theme[this.edgeType];
}

/**
    Data structure for an intermediate point in the edge.
**/
function Point(x,y) {
    this.x = x;
    this.y = y;
}

/**
    Method to set state from the UI interface above the graph
    Available states: 
    this.stateAddingNodes
    this.stateAddingEdges
    this.stateAddingSpecial
    this.stateDefault
    
    this.inputModeState = this.stateDefault;        // current graph state
**/
Graph.prototype.setStateFromUI = function(newState) {
    if (this.stateAddingNodes != newState &&
        this.stateAddingEdges != newState &&
        this.stateAddingSpecial != newState &&
        this.stateDefault != newState) {
        debugOut('Attempting to set unknown state: ' + newState);
        return;
    }

    // Stuff that should always happen
    this.clearSelection();
    
    this.addingEdgeFromNode = new Object();   
    this.pointArray = [];
    
    this.hideValenceSelector();
    this.hideTextEditor();
        
    // Repaint the graph
    this.repaint();
    
    // Update the graph state
    if (newState == this.stateAddingEdges) {
        this.interactionMode = this.addingEdgeAddedZero;
    }
    this.inputModeState = newState;
}

/**
    Add a node from the suggestion list
**/
Graph.prototype.suggestedNode = function(id, nodeText, nodeValence, x, y) {

    // Create node
    var n = new Node(id, nodeText, nodeValence);

    // Add to control structures
    this.nodes[n.id] = n;
    this.drawOrder.push(n.id);
    
    // Change the display
    this.setPosition(n, x, y);
    this.setSizeByText(this.ctx, n, true);
        
    this.pushToUndo(new Command(this.cmdNode, n.id, this.cmdAddSuggested, "", n));
    g.db_addNode(n);
    
    this.repaint();
} 

/**
    Add a node via clicking on the canvas.
**/
Graph.prototype.addNode = function(nodeText, nodeValence, x, y) {
    if (nodeValence < this.minValence || nodeValence > this.maxValence) {
        return;
    } 
    
    // Create node
    var n = new Node(guid(), nodeText, nodeValence);
    
    // Push node to undo stack
    this.pushToUndo(new Command(this.cmdNode, n.id, this.cmdNodePlaceholder, "", n.id));
    
    // Add to control structures
    this.nodes[n.id] = n;
    this.drawOrder.push(n.id);
    
    // Change the display
    this.setPosition(n, x, y);
    this.setSizeByText(this.ctx, n, true);

    // Repaint
    this.repaint();

    return n;
}

/**
    Add an edge through interaction with the canvas.
**/
Graph.prototype.addEdge = function(id1, id2, v, inPts) {
    // Verify that the nodes exist and that the edge is not a self cycle
    if (this.nodes[id1] === undefined || this.nodes[id2] === undefined || id1 == id2) {
        return;
    }
    
    if (v < this.minValence || v > this.maxValence) {
        return;
    }
    
    // Create a new edge
    var e = new Edge(guid(), id1, id2, v);
    if (inPts) { // exists and true
        // add points to complex edge
        e.innerPoints = inPts;
        e.complex = true;
    }
    
    // Add it to the undo stack
    this.pushToUndo(new Command(this.cmdEdge, e.id, this.cmdNodePlaceholder, "", e.id));
    
    // Insert into datastructures
    this.edges[e.id] = e;
    
    // Repaint
    this.repaint();
    
    return e;
}

/**
    Changes the text of a node by id.
**/
Graph.prototype.setNodeText = function(node, newText) {
    if (!(node instanceof Node) || newText == null) {
        return;
    }
    
    // Filter out duplicate spaces, so that we do not get empty words later (space split)
    var words = newText.split(' ');
    var textSoFar = "";
    for (var i = 0; i < words.length; i += 1) {
        var word = jQuery.trim(words[i]);
        if (word != "") {
            textSoFar += word + " ";
        }
    }
    textSoFar = jQuery.trim(textSoFar);
    
    this.pushToUndo(new Command(this.cmdNode, node.id, this.cmdText, node.text, textSoFar));
    node.text = textSoFar;
    
    this.repaint();
}

/**
    Delete a node by id.
**/
Graph.prototype.deleteNode = function(id) {
    var node = this.nodes[id];
    if (!(node instanceof Node)) {
        return;
    }
    
    var deletingNewNode = node.newNode;
    if (this.selectedObject.id == node.id) {
        this.selectedObject = {};
    }
    
    // Copy    
    var dead = new Node(node.id, node.text, node.valence);
    dead.newNode = node.newNode;
    dead.dim = jQuery.extend(true, {}, node.dim);
    dead.setSpecial(node.special);
    
    var oldValue = { 'dead' : dead, 'edges' : {} };
    
    // Remove the node from the drawOrder queue
    for(var i = 0; i < this.drawOrder.length; i++) {
        if (this.drawOrder[i] == node.id) {
            var ar1 = this.drawOrder.slice(0,i);
            var ar2 = this.drawOrder.slice(i+1,this.drawOrder.length);
            ar1 = ar1.concat(ar2);
            this.drawOrder = ar1;
            break;
        }
    }
    
    delete this.nodes[id];
    
    // Delete all edges touching this node
    for (var i in this.edges) {
        var edge = this.edges[i];
        if (edge.from == id || edge.to == id) {
        
            // Update the selected object
            if (edge.selected) {
                this.selectedObject = {};
            }
            
            // Save the edge
            var deadEdge = new Edge(edge.id, edge.from, edge.to, edge.valence);
            deadEdge.selected = edge.selected;
            deadEdge.newEdge = edge.newEdge;            
            oldValue['edges'][i] = deadEdge;
            
            // Remove from the data struct
            delete this.edges[i];
        }
    }
    
    if (deletingNewNode) {
        // don't push a delete command because we haven't pushed an add yet. 
        // instead - delete everything from the undo stack containing this node's guid - it has not been committed yet
        this.removeFromUndoById(id);
    } else {
        this.pushToUndo(new Command(this.cmdNode, id, this.cmdDeleteDB, oldValue, ""));
    }
    
    this.repaint();
}

/**
    Delete an edge by id.
**/
Graph.prototype.deleteEdge = function(id) {
    var edge = this.edges[id];
    if (!(edge instanceof Edge )) {
        return;
    }
    
    var deletingNewEdge = edge.newEdge;
    
    var dead = new Edge(edge.id, edge.from, edge.to, edge.valence);
    dead.selected = edge.selected;
    dead.newEdge = edge.newEdge;
    
    // Update the selected object
    if (edge.selected) {
        this.selectedObject = {};
    }
    
    // Remove from the data struct
    delete this.edges[id];
    
    // If it is a new edge, then remove by token id
    if (deletingNewEdge) {
        this.removeFromUndoById(id);
    } else {
        this.pushToUndo(new Command(this.cmdEdge, id, this.cmdDeleteDB, dead, ""));
    }
    
    this.repaint();
}

/**
    Delete all nodes in the current selection (used with multi-select)
**/ 
Graph.prototype.deleteSelection = function () {
    for (var i in this.selection) {
        var obj = this.selection[i];
        if (obj instanceof Edge) {
            this.deleteEdge(obj.id);
        } else if (obj instanceof Node) {
            // Delete all edges connected to this node first
            for (var e in this.edges) {
                if (this.edges[e].to == obj.id || this.edges[e].from == obj.id) {
                    this.deleteEdge(e);
                }
            }
            this.deleteNode(obj.id);
        }
    }
}

/**
    Set the size of a node based on the text it contains.
**/
Graph.prototype.setSizeByText = function(ctx, node, push) {
    if (!(node instanceof Node)) {
        return;
    }
    
    if (node.text == null) {
        return;
    }
    
    var scaledBaseTextWidth = this.textWidthInNode * this.zoomScale; 
    var scaledBaseTextHeight = this.textHeightInNode * this.zoomScale; 
    
    var textWidth = ctx.measureText(node.text).width;
    var nodeWidth = node.dim.width * scaledBaseTextWidth; 
        
    // if text already fits in node, return
    if (textWidth <= nodeWidth) {
        return;
    }
    
    // reset node width and height
    var oldDim = node.dim;
    node.dim.width = this.defaultNodeWidth / this.zoomScale;
    node.dim.height = this.defaultNodeHeight / this.zoomScale;
    
    // continue resizing node until it fits
    var lineArray = new Array();
    
    // increase width first, then height
    var increaseWidth = true;
    var count = 0;
    
    // Set default font style for measurement purposes    
    ctx.save();
    ctx.font = this.setFont(node, this.theme.nodeFontSize);
    
    while (count < 30) {  
        lineArray = this.getTextLines(ctx, node);        
        
        var textWidth = this.lengthOfLongestLine(ctx, lineArray) * this.textWidthInNode;
        var textHeight = lineArray.length * parseInt(this.theme.nodeFontLineHeight);
        
        // getTextLines fits text to width, so now check height
        // the total height (in pixels) of the node that is allowed to be occupied by text
        var maxHeight = node.dim.height * scaledBaseTextHeight;
        var maxWidth = node.dim.width * scaledBaseTextWidth;
        
        // Break if line fits height AND width wise
        if (maxHeight >= textHeight && maxWidth >= textWidth) {
            break;
        }
        
        // Which direction to increase
        if (increaseWidth) {
            // increase width and see if it now fits height-wise
            node.dim.width *= this.nodeWidthIncrease;
        } else {
            // increase height and see if it now fits length-wise
            if (maxHeight < textHeight) {
                node.dim.height += parseInt(this.theme.nodeFontLineHeight);
            }
        }
        
        increaseWidth = !increaseWidth;
        count += 1;
    }
    
    if (push) {
        this.pushToUndo(new Command(this.cmdNode, node.id, this.cmdDim, oldDim, node.dim));
    }
    
    ctx.restore();
    
    return lineArray;
}

/**
    Returns the length of a longest line in a given line array.
**/
Graph.prototype.lengthOfLongestLine = function(ctx, lineArray) {
    var maxlen = 0;
    for (var line in lineArray) {
        var len = ctx.measureText(lineArray[line]).width;
        if (len > maxlen) {
            maxlen = len;
        }
    }
    return maxlen;
}

/**
    Split node text into lines by node width.
**/
Graph.prototype.getTextLines = function(ctx, node) {
    
    var words = node.text.split(' ');
    var arr = new Array();
    var lineSoFar = "";
    
    var length = node.dim.width * this.zoomScale * this.textWidthInNode;
    var lineWidth = 0;
    for (var i = 0; i < words.length; i += 1) {
        var word = words[i];
        lineWidth = ctx.measureText(lineSoFar + " " + word).width;        
        if (lineWidth < length) {
            if (lineSoFar != "") {
                lineSoFar += " ";
            }
            lineSoFar += word;
        } else {
            // Skip empty lines
            if (lineSoFar != "") {
                arr.push(lineSoFar);
            }
            lineSoFar = word;
        }
        
        if (i == words.length - 1) {
            arr.push(lineSoFar);
            break;
        }
    }    
    
    return arr;
}

/**
    Utility function for setting canvas font style based on node valence.
**/
Graph.prototype.setFont = function(node, size) {
    var style = size + 'px ' + this.theme.nodeFontFamily;
    if (Math.abs(node.valence) > this.strongThreshold) {
        style = "bold " + style;
    }
    return style;
}

/**
    Adjust cursor position to account for canvas offset.
**/
Graph.prototype.getCursorPosition = function(e) {   
    var x;
    var y;
    
    if (e.pageX && e.pageY) {
        x = e.pageX; 
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    x -= this.canvas.offsetLeft;
    y -= this.canvas.offsetTop; 

    return new Array(x, y);
}

///////////////////////////////////////////////////////////////////////////////////////////
// OBJECT SELECTION METHODS
///////////////////////////////////////////////////////////////////////////////////////////

/**
    Get the object under the pointer
    Returns: resize handle, node, edge, or indication of nothing
**/
Graph.prototype.getObjectUnderPointer = function(mx, my) {        
    if (this.isClickOnHandle(mx, my)) {
        return this.handle;
    }
    
    var n = this.getNodeUnderPointer(mx, my);
    if (n instanceof Node) {
        return n;
    }
    
    var e = this.getEdgeUnderPointer(mx, my); 
    if (e instanceof Edge) {
        return e;
    }
    
    return this.nothingSelected;
}

/**
    Checks whether a resize handle has been clicked.
**/
Graph.prototype.isClickOnHandle = function(x, y) {

    var imgData = this.ctx.getImageData(x, y, 1, 1);
    var pix = imgData.data;

    // Construct colour code for the clicked pixel
    var pixColour = "rgba(" + pix[0];
    for (var i = 1; i < pix.length; i++) {
        pixColour += "," + pix[i];
    }
    pixColour += ")";
    
    return pixColour == this.theme.nodeSelectionHandles;
}

/**
    Figure out which handle has been clicked.
**/
Graph.prototype.whichHandle = function(node, mx, my) {
    var scaledX = this.scaleX(node.dim.x);
    var scaledY = this.scaleY(node.dim.y);

    if (mx < scaledX && my < scaledY) {
        return this.handleTL;
    } else if (mx < scaledX && my > scaledY) {
        return this.handleBL;
    } else if (mx > scaledX && my < scaledY) {
        return this.handleTR;
    } 
    
    return this.handleBR;
}

/**
    Figure out which node was clicked.
**/
Graph.prototype.getNodeUnderPointer = function(mx, my) {
    // Traverse the nodes in reverse draw order, so we get the top-most node first
    for (var i = this.drawOrder.length - 1; i >= 0; i -= 1) {
        var node = this.nodes[this.drawOrder[i]];
        
        node.outline(this.ctx);
        
        if (this.ctx.isPointInPath(mx, my)) {
            return node;
        }
    }
    return this.notANode;
}

/**
    Given that mx, my is within a handle, returns its parent node.
**/
Graph.prototype.getNodeFromHandle = function(mx, my) {

    var halfHandleSize = this.handleSize/2;

    // Traverse the nodes
    for (var nid in this.nodes) {
        var node = this.nodes[nid];
                
        var left = this.scaleX(node.dim.x - node.dim.width/2);
        var right = this.scaleX(node.dim.x + node.dim.width/2);
        var top = this.scaleY(node.dim.y - node.dim.height/2);
        var bottom = this.scaleY(node.dim.y + node.dim.height/2);

        if (this.containedIn(mx, my, left  - halfHandleSize, top    - halfHandleSize, left  + halfHandleSize, top    + halfHandleSize) ||
            this.containedIn(mx, my, left  - halfHandleSize, bottom - halfHandleSize, left  + halfHandleSize, bottom + halfHandleSize) ||
            this.containedIn(mx, my, right - halfHandleSize, top    - halfHandleSize, right + halfHandleSize, top    + halfHandleSize) ||
            this.containedIn(mx, my, right - halfHandleSize, bottom - halfHandleSize, right + halfHandleSize, bottom + halfHandleSize)) {
            return node;
        }
    }
    
    return this.notANode;
}

/**
    Figure out which edge was clicked.
    
    Creates a bounding box around the each edge and checks whether
    the mouse pointer is within it.
**/
Graph.prototype.getEdgeUnderPointer = function(mx, my) {      
    for (var eid in this.edges) {
        var edge = this.edges[eid];
        var to = this.nodes[edge.to];
        var from = this.nodes[edge.from];
        
        // Make sure the source and destination are valid
        if (from === undefined || to === undefined){
            continue;
        }
        
        var pts = edge.innerPoints;
        var padding = this.edgePadding * Math.min(1, this.zoomScale);
        
        // Add beginning and end to point array
        pts.unshift(new Point(from.dim.x, from.dim.y));
        pts.push(new Point(to.dim.x, to.dim.y));
        
        this.ctx.beginPath();
        
        // Create bounding box
        // ang should be the direction from 'from' to 'to'        
        var ang = Math.atan2(this.scaleY(to.dim.y) - this.scaleY(from.dim.y), 
                             this.scaleX(to.dim.x) - this.scaleX(from.dim.x));
        var perp = Math.PI/2 + ang;
        if (perp > Math.PI * 2) {
            perp -= Math.PI*2;
        }
        
        // Move to first point
        this.ctx.moveTo( this.scaleX(from.dim.x) + padding * Math.cos(perp), 
                         this.scaleY(from.dim.y) + padding * Math.sin(perp));
        
        for (var count = 0; count < 2; count += 1) {
            for (var i = 0; i < pts.length - 1; i += 1) {
                
                var f = pts[i];
                var t = pts[i + 1];
                ang = Math.atan2(this.scaleY(t.y) - this.scaleY(f.y), this.scaleX(t.x) - this.scaleX(f.x));
                perp = Math.PI/2 + ang;
                if (perp > Math.PI * 2) {
                    perp -= Math.PI * 2;
                }
                
                this.ctx.lineTo( this.scaleX(f.x) + padding * Math.cos(perp), 
                                 this.scaleY(f.y) + padding * Math.sin(perp));
                            
                // Draw line on first side
                this.ctx.lineTo( this.scaleX(t.x) + padding * Math.cos(perp), 
                                 this.scaleY(t.y) + padding * Math.sin(perp));
            }
            
            // Draw connecting edge on end side
            if (count == 0) {
                this.ctx.lineTo( this.scaleX(t.x) - padding * Math.cos(-perp), 
                                 this.scaleY(t.y) + padding * Math.sin(-perp));
            }
            pts.reverse();
        }
        
        this.ctx.lineTo( this.scaleX(from.dim.x) - padding * Math.cos(-perp),
                         this.scaleY(from.dim.y) + padding * Math.sin(-perp));
        
        this.ctx.closePath();
        
        // get rid of those points
        pts.shift();
        pts.pop();
        
        if (this.ctx.isPointInPath(mx, my)) {
            return edge;
        }
    }
    return this.notAnEdge;
}

///////////////////////////////////////////////////////////////////////////////////////////
// TEXT INPUT
///////////////////////////////////////////////////////////////////////////////////////////

Graph.prototype.showTextEditor = function(node,  mode) {
    this.textEditor.css('position', 'absolute');
    
    this.textEditor.show();
    var width = this.textInput.width(); 
    var height = this.textInput.height();
    this.textEditor.hide();
    
    this.textInput.val(node.text);
    
    // If no mode specified, fade the edit field
    if (mode === undefined || mode) {
        this.textEditor.fadeIn(100, function() {
            g.textInput.focus();
        });
    } else {
        this.textEditor.show();
        this.textInput.focus();
    }
     
    this.textEditor.css('left', this.scaleX(node.dim.x) - width/2 - 6);
    this.textEditor.css('top', this.scaleY(node.dim.y) - height/2 - 6);
}

Graph.prototype.hideTextEditor = function() {
    this.textEditor.hide();
    this.canvas.focus();
}

///////////////////////////////////////////////////////////////////////////////////////////
// VALENCE SELECTOR/SLIDER
///////////////////////////////////////////////////////////////////////////////////////////

Graph.prototype.normalize = function(val) {
    var x = val - 1; // from 1-7 to 0-6
    x = (x / 6) * 2; // from 0-6 to 0-2
    x -= 1; 
    return x;
}

Graph.prototype.deNormalize = function(val) {
    var x = val; // -1 to 1
    val += 1; // 0 to 2
    val *= 3; // 0 to 6
    val = Math.round(val);
    return val + 1; // 1 to 7
}

Graph.prototype.showValenceSelector = function(obj, mx, my) {
    this.valenceSlider.css('position', 'absolute');
    
    // If the object is not initialized, attempt to show the slider at currently selected object
    if (obj === undefined) {
        if (this.selectedObject instanceof Node || this.selectedObject instanceof Edge) {
            obj = this.selectedObject;
        } else {
            return;
        }
    }
    
    if (obj instanceof Node) {
        // Only show the valence selector for non-special nodes
        if (obj.special != "") {
            this.hideValenceSelector();
            return;
        }
    
        this.valenceSlider.css('left', this.scaleX(obj.dim.x) - 50);
        this.valenceSlider.css('top', this.scaleY(obj.dim.y + obj.dim.height / 2) + 10);
    } else if (obj instanceof Edge) {
        var from = this.nodes[obj.from];
        var to = this.nodes[obj.to];
        if (mx && my) {
            this.valenceSlider.css('left', mx - 50);
            this.valenceSlider.css('top', my + 15);
        } else {
            // Determine midpoint of the edge
            var midx = this.scaleX((from.dim.x + to.dim.x) / 2);
            var midy = this.scaleY((from.dim.y + to.dim.y) / 2);
            this.valenceSlider.css('left', midx - 50);
            this.valenceSlider.css('top', midy + 15);
        }
    }
    
    this.valenceSlider.show();
    this.valenceInput.slider("option", "value", this.deNormalize(obj.valence));
}

Graph.prototype.hideValenceSelector = function() {
    this.valenceSlider.hide();
}

// Set the position of the valence slider based on node position
Graph.prototype.positionSlider = function(node) {
    if (!(node instanceof Node)) {
        return;
    } 

    this.valenceSlider.css('left', this.scaleX(node.dim.x) - 50);
    this.valenceSlider.css('top', this.scaleY(node.dim.y + node.dim.height / 2) + 10);
}

// Event handler for valence slider
Graph.prototype.valenceSlide = function(e, ui) {
    if (g.selectedObject instanceof Node || g.selectedObject instanceof Edge) {
        g.selectedObject.setValence(g.normalize(ui.value));
        g.repaint();
    } else {
        debugOut(g.selectedObject);
    }
}

// Record old valence at the beginning of slide action
Graph.prototype.sliderStart = function(e, ui) {
    if (g.selectedObject instanceof Node || g.selectedObject instanceof Edge) {
        g.valenceOld = g.selectedObject.valence;
    }
}

/**
    Record valence change once slider is dropped
**/
Graph.prototype.sliderStop = function(e, ui) {
    if (g.selectedObject instanceof Node) {
        g.pushToUndo(new Command(g.cmdNode, g.selectedObject.id, g.cmdValence, g.valenceOld, g.selectedObject.valence));
    } else if (g.selectedObject instanceof Edge) {
        g.pushToUndo(new Command(g.cmdEdge, g.selectedObject.id, g.cmdValence, g.valenceOld, g.selectedObject.valence));
    }
}

///////////////////////////////////////////////////////////////////////////////////////////
// SELECTION METHODS
///////////////////////////////////////////////////////////////////////////////////////////

/**
    Select an object: set as selectedObject or add to multi-select array
    If replaceSelection is true, obj becomes the selectedObject and everything else is cleared    
**/
Graph.prototype.appendToSelection = function(obj) {

    // Make sure we have a valid object
    if (!(obj instanceof Node)) {
        return;
    }
    
    // If selection is empty, simply set selection to this object
    if (!(this.selectedObject instanceof Node) && this.selection.length == 0) {
        this.setSelection(obj);
        return;
    }
    
    // If node is not the currently selected node, need to also push the selected node onto the selection
    if (this.selectedObject instanceof Node && obj != this.selectedObject) {
        this.selection.push(this.selectedObject);        
    }
    this.selectedObject = {};
    
    // Push the node to selection
    this.selection.push(obj);
    obj.selected = true;
    
    // Set interaction mode to multiselect
    this.interactionMode = this.multiSelect;
}

/**
    Remove the provided object from the selection array, or 
    clear whole selection. 
    
    obj - node or edge to remove
**/
Graph.prototype.removeFromSelection = function(obj) {

    // Make sure we have a valid node
    if (!(obj instanceof Node)) {
        return;
    }
    
    // If we are in multiselect, then remove the node from selection
    if (this.interactionMode == this.multiSelect) {    
        obj.selected = false;
        for (var i in this.selection) {
            if (this.selection[i].id == obj.id) {
                this.selection.splice(i, 1);
                break;
            }
        }
        
        // Reset to single select
        if (this.selection.length == 1) {
            this.selectedObject = this.selection[0];
            this.interactionMode = this.draggingNode;
            this.selection = [];
        }
        
    // Otherwise, unselect the node
    } else {
        obj.selected = false;
        this.selectedObject = {};
        this.interactionMode = this.draggingGraph;
    }
}

/**
    Update the selection to the provided object.
**/
Graph.prototype.setSelection = function(obj) {

    // Make sure we have a valid node
    if (!(obj instanceof Node) && !(obj instanceof Edge)) {
        return;
    }

    // Clear the current selection
    this.clearSelection();
    
    // Update the object selection state
    obj.selected = true;
    this.selectedObject = obj;
    
    // Update interaction status
    if (obj instanceof Node) {
        this.interactionMode = this.draggingNode;
    } else {
        this.interactionMode = this.pickedEdge;
    }
}

/**
    If a node or edge has been selected, deselect it.
**/
Graph.prototype.clearSelection = function() {
    // Clear the multi-selection
    for (var i in g.selection) {
        this.selection[i].selected = false;
    }
    this.selection = [];
    
    // Clear the selected object
    this.selectedObject.selected = false;
    this.selectedObject = {};
    
    // Reset the interaction mode
    this.interactionMode = this.draggingGraph;
}

///////////////////////////////////////////////////////////////////////////////////////////
// ZOOM METHODS
///////////////////////////////////////////////////////////////////////////////////////////

/**
    Zooms in on the CAM.
**/
Graph.prototype.zoomIn = function() {
    this.zoom(0.1, this.canvas.width / 2, this.canvas.height / 2);
}

/**
    Zooms out from the CAM.
**/
Graph.prototype.zoomOut = function() {
    this.zoom(-0.1, this.canvas.width / 2, this.canvas.height / 2);
}

/**
    Performs a zoom operation.
**/
Graph.prototype.zoom = function(zoomBy, x, y) {

    var oldZoom = this.zoomScale;

    this.zoomScale = Math.min(Math.max(this.zoomScale + zoomBy, this.maxZoomOut), this.maxZoomIn);
    this.zoomScale = Math.round(this.zoomScale * Math.pow(10, 2)) / Math.pow(10, 2);

    var zoomDiff = oldZoom - this.zoomScale;
    if (zoomDiff == 0) {
        return;
    }
    
    if (zoomDiff > 0) {
        // If we are zooming out, the point is irrelevant and we simply need to decay the zoom offset
        var scaler = Math.min(1, zoomBy / (this.maxZoomOut - oldZoom));
        var c = this.computeGraphCentre();
        this.originX -= (this.originX - this.canvas.width / 2 + c[0]) * scaler;
        this.originY -= (this.originY - this.canvas.height / 2 + c[1]) * scaler;
    } else {
        // Update the zoom offset
        this.originX += zoomDiff * this.unscaleX(x);
        this.originY += zoomDiff * this.unscaleY(y);
    }
    
    // Hide interaction components
    this.hideValenceSelector();
    this.hideTextEditor();
    
    this.repaint();
    
    // If interactions are active, restore the interaction components
    this.showValenceSelector();
    
    if (this.interactionMode == this.renamingNode && this.selectedObject instanceof Node) {
        this.showTextEditor(this.selectedObject, false);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////
// REPAINT METHODS
///////////////////////////////////////////////////////////////////////////////////////////

/**
    Repaints a given node.
**/
Graph.prototype.repaintNode = function(node) {
    if (!(node instanceof Node)) {
        return;
    }
    
    this.ctx.save();
    
    node.outline(this.ctx);
    this.ctx.clip();
    
    this.drawNode(this.ctx, node);
    this.ctx.restore();
}

/**
    Repaints the CAM.
**/
Graph.prototype.repaint = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        
    this.draw(this.ctx, this.originX, this.originY);
}

///////////////////////////////////////////////////////////////////////////////////////////
// IMPORT/EXPORT METHODS
///////////////////////////////////////////////////////////////////////////////////////////

/**
    For recovery purposes: creates a string representation of the graph.
    The string can then be fed back into the Graph to reconstruct nodes and edges.
**/
Graph.prototype.createSaveString = function() {
    var save = {};
    save.nodes = {};
    save.edges = {};
    
    for (var nid in this.nodes) {
        save.nodes[nid] = this.nodes[nid];
    }
    
    for (var eid in this.edges) {
        save.edges[eid] = this.edges[eid];
    }

    return JSON.stringify(save);
}

/**
    Recreates the graph from a save string.
**/
Graph.prototype.generateGraphFromString = function(saveText) {
    var save;
    try{
        save = JSON.parse(saveText);
    }catch(e){
        return false;
    }
    
    // Clear the current UI states
    $('#btnSelect').toolbarButton('toggle');

    // Remove all existing nodes
    this.drawOrder.length = 0;
    for (var nid in this.nodes) {
        delete this.nodes[nid];
    }
    
    for (var eid in this.edges) {
        delete this.edges[eid];
    }
    
    // Add exported nodes
    nodeMap = {};
    for (var nid in save.nodes) {
        var record = save.nodes[nid];
        
        var node = new Node(guid(), record.text, record.valence);        
        node.dim = jQuery.extend(true, {}, record.dim)
        node.setSpecial(record.special);
                
        // Add to control structures
        this.nodes[node.id] = node;
        this.drawOrder.push(node.id);
        
        nodeMap[record.id] = node.id;
    }
    
    for (var eid in save.edges) {
        var record = save.edges[eid];
        
        var edge = new Edge(guid(), nodeMap[record.from], nodeMap[record.to], record.valence);
        if (record.innerPoints) { // exists and true
            // add points to complex edge
            edge.innerPoints = record.innerPoints;
            edge.complex = true;
        }
        
        // Insert into data structures
        this.edges[edge.id] = edge;
    }
    
    // Compute the new origin
    this.centreGraph();
    
    // Push nodes and edges to DB
    g.db_setGraphData(this.nodes, this.edges, { 'x': this.originX, 'y': this.originY });
    return true;
}