/** 
    Mouse and keyboard event handlers
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Initialize event listeners and some other handlers
**/
Graph.prototype.initEventListeners = function() {
    
    // Add the canvas and context to the graph's properties
    this.canvas.addEventListener("mousedown", this.eventMouseDown, false);
    this.canvas.addEventListener("mouseup", this.eventMouseUp, false);
    this.canvas.addEventListener("mousemove", this.eventMouseMove, false);
    this.canvas.addEventListener("dblclick", this.eventMouseDoubleClick, false);
    this.canvas.addEventListener("mousewheel", this.eventMouseWheel, false); 
    this.canvas.addEventListener("DOMMouseScroll", this.eventMouseWheel, false); 
    
    // Register shortcuts 
    var defaultOptions = {'target': window, 'disable_in_input':true};
    
    shortcut.add("Ctrl+S", function() {
        g.saveGraph();
        $.blockUI({
            message: "Saving. Just a moment... ",
        });
    });
    
    shortcut.add("PageUp", function() {
        g.zoomIn();
    });
    
    shortcut.add("PageDown", function() {
        g.zoomOut();
    });
    
    shortcut.add("Ctrl+Z", function() {
        g.undo();
    });
    
    shortcut.add("Ctrl+A", function() {
        $('#btnAddConcepts').toolbarButton('toggle');
    }, defaultOptions);
    
    shortcut.add("Ctrl+E", function() {
        $('#btnAddConnections').toolbarButton('toggle');
    }, defaultOptions);
    
    shortcut.add("Delete", function() {
        g.eventDeleteKey();
    }, defaultOptions);
    
    shortcut.add("Backspace", function() {
        g.eventDeleteKey();
    }, defaultOptions);
    
    shortcut.add("Esc", function() {
        $('#btnSelect').toolbarButton('toggle');
        g.selectedObject = {};
    }, {'target': window});
    
    shortcut.add("Esc", function() {
        g.hideTextEditor();
        if (g.selectedObject.newNode) {
            // Escaping out of first naming - delete node
            g.deleteNode(g.selectedObject.id);
        } else {
            // Escaping out of simple renaming
            g.interactionMode = g.draggingNode;
        }
        $('#btnSelect').toolbarButton('toggle');
    }, {'target': 'textEditInput'});
    
    shortcut.add("Enter", function() {
        var selectedObject = g.onEndRenaming();
    
        g.selectedObject = selectedObject;
        g.selectedObject.selected = true;
        
        g.repaint();
        
        g.showValenceSelector();
        g.interactionMode = g.draggingNode;
    }, {'target': 'textEditInput'});
    
    shortcut.add("Any", function() {
        if (g.selectedObject instanceof Node && g.interactionMode != g.renamingNode) {
            g.interactionMode = g.renamingNode;
            g.showTextEditor(g.selectedObject);
        } 
    }, defaultOptions);
    
    // Keyboard control shortcuts
    shortcut.add("Up", function() {
        if (g.interactionMode == g.multiSelect) {
            g.moveSelectedNodes(g.selection, 0, -g.moveOffset);
        } else {
            g.moveSingleNode(g.selectedObject, 0, -g.moveOffset);
        }
    }, defaultOptions);
    
    shortcut.add("Down", function() { 
        if (g.interactionMode == g.multiSelect) {
            g.moveSelectedNodes(g.selection, 0, g.moveOffset);
        } else {
            g.moveSingleNode(g.selectedObject, 0, g.moveOffset);
        }
    }, defaultOptions);
    
    shortcut.add("Left", function() { 
        if (g.interactionMode == g.multiSelect) {
            g.moveSelectedNodes(g.selection, -g.moveOffset, 0);
        } else {
            g.moveSingleNode(g.selectedObject, -g.moveOffset, 0);
        }
    }, defaultOptions);
    
    shortcut.add("Right", function() { 
        if (g.interactionMode == g.multiSelect) {
            g.moveSelectedNodes(g.selection, g.moveOffset, 0);
        } else {
            g.moveSingleNode(g.selectedObject, g.moveOffset, 0);
        }
    }, defaultOptions);
    
    // Graph move shortcuts
    shortcut.add("Ctrl+Up", function() { 
        g.moveOrigin(0, -g.moveOffset);
    }, defaultOptions);
    
    shortcut.add("Ctrl+Down", function() { 
        g.moveOrigin(0, g.moveOffset);
    }, defaultOptions);
    
    shortcut.add("Ctrl+Left", function() { 
        g.moveOrigin(-g.moveOffset, 0);
    }, defaultOptions);
    
    shortcut.add("Ctrl+Right", function() { 
        g.moveOrigin(g.moveOffset, 0);
    }, defaultOptions);
    
    // Disable the context menu
    document.oncontextmenu = function() {
        return false;
    };
}

/**
    Handles a delete key press.
**/
Graph.prototype.eventDeleteKey = function() {
    if (g.selectedObject instanceof Node) {
        g.deleteNode(g.selectedObject.id);
        g.interactionMode = g.draggingGraph;
        g.hideValenceSelector();
    } else if (g.selectedObject instanceof Edge) {
        g.deleteEdge(g.selectedObject.id);
        g.interactionMode = g.draggingGraph;
        g.hideValenceSelector();
    } else if (g.interactionMode == g.multiSelect) {
        g.deleteSelection();
    }
}

/**
    Finishes the renaming process.
**/
Graph.prototype.onEndRenaming = function() {

    g.hideTextEditor();

    var text = $.trim(g.textInput.val());
    if (text == '') {
        if (g.selectedObject.newNode) {
            // Escaping out of first naming - delete node
            g.deleteNode(g.selectedObject.id);
        }
        
        $('#btnSelect').toolbarButton('toggle');
        return false;
    }

    g.setNodeText(g.selectedObject, text);    
    g.setSizeByText(g.ctx, g.selectedObject);
    
    // Check if naming a new node for the first time
    if (g.selectedObject.newNode) {
        // If new node, then save it in the database
        g.pushToUndo(new Command(g.cmdNode, g.selectedObject.id, g.cmdAddDB, "", g.selectedObject.id));
        g.db_addNode(g.selectedObject);
    }
    
    var selectedObject = g.selectedObject;
    $('#btnSelect').toolbarButton('toggle');
    return selectedObject;
}

/**
    Handle mouse movements
**/
Graph.prototype.eventMouseMove = function(e) {
    
    var coords = g.getCursorPosition(e);
    var mx = coords[0];
    var my = coords[1];
    
    // Only move shapes if the mouse is pressed
    if (g.inputModeState == g.stateDefault && g.mouseDown) {
        g.possibleDeselect = {};
        var xOffset = mx - g.prevX;
        var yOffset = my - g.prevY;
        
        if (g.interactionMode == g.renamingNode) {
            // ignore movement on the graph while renaming node
            return;
        } else if (g.interactionMode == g.draggingNode) {
            // If there is a node currently selected, move it
            if (g.selectedObject instanceof Node) {
                g.move(g.selectedObject, xOffset, yOffset);
                g.positionSlider(g.selectedObject);
                g.resizedOrMoved = true;
            } 
        } else if (g.interactionMode == g.resizingNode) {
        
            if (!(g.selectedObject instanceof Node)) {
                debugOut("ERROR: Resizing a node which does not exist");
                return;
            }
            
            var xOffset = (mx - g.prevX) / g.zoomScale;
            var yOffset = (my - g.prevY) / g.zoomScale;
            
            var oldy = g.selectedObject.dim.y;
            var oldx = g.selectedObject.dim.x;
            var oldw = g.selectedObject.dim.width;
            var oldh = g.selectedObject.dim.height;
            
            // See which handle is being dragged
            if (g.resizingDirection == g.handleTL) {
                // Dragging top left corner
                if (!( (yOffset > 0) && (yOffset > oldh - 10) ) && 
                    !( (xOffset > 0) && (xOffset > oldw - 10) ) ) {                        
                    g.selectedObject.dim.y += yOffset/2;
                    g.selectedObject.dim.height -= yOffset;
                    g.selectedObject.dim.x += xOffset/2;
                    g.selectedObject.dim.width -= xOffset;
                } else {                        
                    if (!g.isClickOnHandle(mx, my)) {
                        g.resizingDirection = g.notAHandle;
                    }
                }
            } else if (g.resizingDirection == g.handleTR) {
                // Dragging top right corner
                if (!( (yOffset > 0) && (yOffset > oldh - 10) ) && 
                    !( (xOffset < 0) && (Math.abs(xOffset) > oldw - 10) ) ) {
                    g.selectedObject.dim.y += yOffset/2;
                    g.selectedObject.dim.height -= yOffset;
                    g.selectedObject.dim.x += xOffset/2;
                    g.selectedObject.dim.width += xOffset;
                } else {
                    if (!g.isClickOnHandle(mx, my)) {
                        g.resizingDirection = g.notAHandle;
                    }
                }
            } else if (g.resizingDirection == g.handleBL) {
                // Dragging bottom left corner
                if (!( (yOffset < 0) && (Math.abs(yOffset) > oldh - 10) ) && 
                    !( (xOffset > 0) && (xOffset > oldw - 10) ) ) {
                    g.selectedObject.dim.y += yOffset/2;
                    g.selectedObject.dim.height += yOffset;
                    g.selectedObject.dim.x += xOffset/2;
                    g.selectedObject.dim.width -= xOffset;
                } else {
                    if (!g.isClickOnHandle(mx, my)) {
                        g.resizingDirection = g.notAHandle;
                    }
                }
            } else if (g.resizingDirection == g.handleBR) {
                // Dragging bottom right corner
                if (!( (yOffset < 0) && (Math.abs(yOffset) > oldh - 10) ) && 
                    !( (xOffset < 0) && (Math.abs(xOffset) > oldw - 10) ) ) {
                    g.selectedObject.dim.y += yOffset/2;
                    g.selectedObject.dim.height += yOffset;
                    g.selectedObject.dim.x += xOffset/2;
                    g.selectedObject.dim.width += xOffset;
                } else {
                    if (!g.isClickOnHandle(mx, my)) {
                        g.resizingDirection = g.notAHandle;
                    }
                }
            }
            g.resizedOrMoved = true;
            g.positionSlider(g.selectedObject);
            
        } else if (g.interactionMode == g.draggingGraph) {
            g.originX += xOffset;
            g.originY += yOffset;
            g.resizedOrMoved = true;
        } else if (g.interactionMode == g.multiSelect) {
            for (var id in g.selection) {
                if (g.selection[id] instanceof Node) {
                    g.move(g.selection[id], xOffset, yOffset);
                }                    
            }
            g.resizedOrMoved = true;
        }
        
        g.totalX += xOffset;
        g.totalY += yOffset;
        
        g.prevX = mx;
        g.prevY = my;
        
        g.repaint();
    } else {
        g.mouseOverHandler(e);
    
        // Show the semi drawn edge
        if (g.inputModeState == g.stateAddingEdges && g.interactionMode == g.addingEdgeAddedOne) {
            g.repaint();
            
            g.ctx.save();
            g.ctx.beginPath();
            g.ctx.strokeStyle = g.newEdgeColour;
            g.ctx.lineWidth = g.newEdgeWidth;
            g.ctx.moveTo(g.scaleX(g.addingEdgeFromNode.dim.x), g.scaleY(g.addingEdgeFromNode.dim.y));
            for (var i = 0; i < g.pointArray.length; i++) {
                g.ctx.lineTo(g.scaleX(g.pointArray[i].x), g.scaleY(g.pointArray[i].y));
            }
            g.ctx.lineTo(mx,my);
            g.ctx.stroke();
            g.ctx.restore();
                
            g.repaintNode(g.addingEdgeFromNode);
        }
    }
}

/**
    Helper function to set/unset objects cursor is hovering over
**/
Graph.prototype.mouseOverHandler = function(e) {
    var coords = g.getCursorPosition(e);
    var mx = coords[0];
    var my = coords[1];
    var newNode = g.getObjectUnderPointer(mx, my);
    var oldHover = g.hoverObject;
    if (newNode instanceof Node) {
        if (!newNode.selected) {
            g.hoverObject = newNode;
        } else if (newNode != g.hoverObject) {
            g.hoverObject = null;
        }
    } else if (newNode instanceof Edge) {
        g.hoverObject = newNode;
    } else if (g.hoverObject) {
        g.hoverObject = null;
    }
    
    // Only need to repaint if hover changed
    if (oldHover != g.hoverObject) {
        g.repaint();
    }
}

/**
   Handle mouse up events
**/
Graph.prototype.eventMouseUp = function(e) {

    // Only care about the mouse up events if we are in default state
    if (g.inputModeState != g.stateDefault) {
        return;
    }
    
    g.mouseDown = false;
        
    // Deselect the suspect node
    if (g.possibleDeselect instanceof Node) {
        g.removeFromSelection(g.possibleDeselect);
        g.hideValenceSelector();
        g.repaint();
        g.possibleDeselect = {};
        return;
    }
    
    // If we've moved or resized the selected node then record this
    if (g.resizedOrMoved) {
        if (g.interactionMode == g.multiSelect) {
            var oldValues = {};
            var newValues = {};        

            for (var i in g.selection) {
                var n = g.selection[i];
                oldValues[n.id] = {'x': n.dim.x - g.totalX, 'y': n.dim.y - g.totalY, 'width': n.dim.width, 'height': n.dim.height};
                newValues[n.id] = {'x': n.dim.x, 'y': n.dim.y, 'width': n.dim.width, 'height': n.dim.height};
            }
            
            g.pushToUndo(new Command(g.cmdMulti, "", g.cmdDim, oldValues, newValues));
        } else if (g.selectedObject instanceof Node) {
            var sn = g.selectedObject;
            if (g.oldDim.x != sn.x || g.oldDim.y != sn.y || g.oldDim.width != sn.width || g.oldDim.height != sn.height) {
                g.pushToUndo(new Command(g.cmdNode, g.selectedObject.id, g.cmdDim, g.oldDim, g.selectedObject.dim));
            }
            g.interactionMode = g.draggingNode;
        } else {
            var oldOrigin = { 'x' : g.originX - g.totalX, 'y': g.originY - g.totalY };
            var newOrigin = { 'x' : g.originX, 'y': g.originY };
            g.pushToUndo(new Command(g.cmdNode, "", g.cmdGraphMove, oldOrigin, newOrigin));
        }
    }
    
    // Reset everything for next mousedown event
    g.resizedOrMoved = false;
    g.oldDim = {};
}

/**
    Handle mouse down events
**/
Graph.prototype.eventMouseDown = function(e) {
    
    // A click in renamingNode interaction mode submits
    if (g.interactionMode == g.renamingNode) {
        g.onEndRenaming();
        return;
    }
    
    var coords = g.getCursorPosition(e);
    var mx = coords[0];
    var my = coords[1];
    
    if (g.inputModeState == g.stateDefault && e.button == 0) {
        
        // Set previous coordinates and mouse down
        g.mouseDown = true;
        g.prevX = mx;
        g.prevY = my;
        g.totalX = 0;
        g.totalY = 0;
        
        // Node selection logic
        var oldNode = g.selectedObject;
        var newNode = g.getObjectUnderPointer(mx, my);
                
        // If Ctrl or Shift keys are pressed, don't replace, but add to selection
        if (e.ctrlKey || e.shiftKey) {
            if (newNode instanceof Node) {
                if (!newNode.selected) {
                    g.appendToSelection(newNode);
                } else {
                    g.possibleDeselect = newNode;
                }
            } else if (newNode instanceof Edge) {
                // Edges do not participate in multi-select
                g.setSelection(newNode);
            }
        } else {
            if (newNode instanceof Node || newNode instanceof Edge) {
                // If we click outside of the selection, reset
                if (!newNode.selected) {
                    g.setSelection(newNode);
                }
            } else if (newNode == g.handle) {
                // Attempt to get the parent node
                newNode = g.getNodeFromHandle(mx, my);
                if (newNode != this.notANode) {
                    g.setSelection(newNode);
                    g.interactionMode = g.resizingNode;                    
                    g.setOldDim(newNode.dim);
                    g.resizingDirection = g.whichHandle(newNode, mx, my);
                }
            } else if (newNode == g.nothingSelected) {
                g.clearSelection();
            }        
        }
        
        // Effects of selection
        if (g.selectedObject instanceof Node) {
            g.setOldDim(g.selectedObject.dim);
            if (oldNode != g.selectedNode) {
                g.showValenceSelector();
                
                // Push node to front of draw stack
                for(var i = 0; i < g.drawOrder.length; i++) {
                    if (g.drawOrder[i] == g.selectedObject.id) {
                        g.drawOrder.splice(i, 1);
                        g.drawOrder.push(g.selectedObject.id);
                        break;
                    }
                }
            }
        } else if (g.selectedObject instanceof Edge) {
            g.showValenceSelector(g.selectedObject, mx, my);
        } else if (g.interactionMode == g.multiSelect || g.interactionMode == g.draggingGraph) {
            g.hideValenceSelector();
        }
        
        g.repaint();
        return;
    }
    
    // If right click, go back to default mode
    if (e.button == 2) {
        $('#btnSelect').toolbarButton('toggle');
        return;
    }
    
    if (g.inputModeState == g.stateAddingNodes || g.inputModeState == g.stateAddingSpecial) {
        var newNode = g.addNode("", g.defaultValence, mx, my);
        
        // Set the special property of the node, if we are adding custom concepts (like ambivalence)
        if (g.inputModeState == g.stateAddingSpecial && g.addingSpecialType !== undefined) {
            newNode.setSpecial(g.addingSpecialType);
        }
        
        $('#btnSelect').toolbarButton('toggle');
        
        g.setSelection(newNode);
        g.interactionMode = g.renamingNode;
        g.showTextEditor(newNode);
        return;
    } 
    
    if (g.inputModeState == g.stateAddingEdges) {        
        var node = g.getNodeUnderPointer(mx, my);
        if (node == g.notANode) {
            // Check if its a complex edge and we've already added one node
            if (g.allowComplexEdge && g.interactionMode == g.addingEdgeAddedOne) {
                g.pointArray.push(new Point(g.unscaleX(mx), g.unscaleY(my)));
            }
            return;
        }
        
        if (g.interactionMode == g.addingEdgeAddedZero) {
            g.addingEdgeFromNode = node;
            g.interactionMode = g.addingEdgeAddedOne;
        } else if (g.interactionMode == g.addingEdgeAddedOne) {
            // validate edge
            var edgeExists = false;
            for (var i in g.edges) {
                var e = g.edges[i];
                if (    (e.from == g.addingEdgeFromNode.id && e.to == node.id) ||
                        (e.from == node.id && e.to == g.addingEdgeFromNode.id) ) {
                    edgeExists = true;
                }
            }
            
            // Make sure the edge does not exists and there are no edge circles
            var edge;
            if (!edgeExists && g.addingEdgeFromNode.id != node.id) {
                // add edge
                edge = g.addEdge(g.addingEdgeFromNode.id, node.id, g.defaultValence, g.pointArray);
                g.db_addEdge(edge);
                g.pushToUndo(new Command(g.cmdEdge, edge.id, g.cmdAddDB, "", edge.id));
            }
            
            // reset state
            $("#btnSelect").toolbarButton('toggle');
            if (edge !== undefined) {
                g.setSelection(edge);
                g.showValenceSelector();
            }
            
            g.repaint();
        }
    }
}

/**
    Handle double click events
**/
Graph.prototype.eventMouseDoubleClick = function(e) {
    if (g.inputModeState == g.stateDefault && e.button == 0) {
        if (g.selectedObject instanceof Node) {
            g.interactionMode = g.renamingNode;
            g.showTextEditor(g.selectedObject);
        }
    }
}

/**
    Handle mouse wheel events. 
    
    Note: this method is not currently used and is retained for posterity. 
    Can be used as a suggested future implementation for zooming between different levels
    of a CAM. 
**/
Graph.prototype.eventMouseWheel = function (e) {   
    var coords = g.getCursorPosition(e);
    var mx = coords[0];
    var my = coords[1];

    var move = 0;
    if (e.wheelDelta) {
        // Chrome, IE
        move = e.wheelDelta / 120;
    } else {
        // Firefox
        move = e.detail / -3;
    }     
    
    g.zoom(move / 10, mx, my);
}

/**
    Helper method to save the node dimensions before mousemove
**/
Graph.prototype.setOldDim = function (dim) {
    if(dim !== undefined) {
        var d = {};
        d.x = dim.x;
        d.y = dim.y;
        d.width = dim.width;
        d.height = dim.height;
        g.oldDim = d;
    }    
}
