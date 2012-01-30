/** 
    This file contains methods related to saving and Undo/Redo functionality
    (partially implemented)
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Push a command onto the undo stack
**/ 
Graph.prototype.pushToUndo = function(cmd) {
    // Add command to the undo stack
    this.undoStack.push(cmd);
    
    // Add command to the save hash
    if (cmd.objType == this.cmdMulti) {
        // If a multi command, then add all of its constituents to the hash
        for (var id in cmd.newValue) {
            this.cmdHash.addToHash(this.cmdNode, id, this.cmdDim, cmd.newValue[id]);
        }
    } else if (cmd.property == this.cmdLayout) {
        // If a layout command, then add all of its constituents to the hash
        for (var id in cmd.newValue) {
            this.cmdHash.addToHash(this.cmdNode, id, this.cmdDim, cmd.newValue[id]);
        }
        this.cmdHash.addToHash(this.cmdNode, "", this.cmdGraphMove, { 'x' : g.originX, 'y': g.originY });
    } else {
        this.cmdHash.addCmd(cmd);
    }
    
    // Keep the save hash from getting too big and save data periodically
    this.numOperations += 1;
    if (this.numOperations > this.saveThreshold) {
        this.saveChanges();
        this.numOperations = 0;
    }
        
    // Also keep the undo stack from getting too big
    if (this.undoStack.length > this.maxUndoStackSize) {
        this.undoStack.shift();
    }
}

/**
    Remove all commands with the specified id from the undo stack
**/
Graph.prototype.removeFromUndoById = function(nid) {
    if (!nid) {
        return;
    }
    
    for (var i in this.undoStack) {
        var cmd = this.undoStack[i];
        if (cmd.objId == nid) {
            this.undoStack.splice(i, 1);
        } else if (cmd.property == this.cmdLayout) {
            // If layout change, go through old and new values to remove matching nodes
            for (id in cmd.oldValue) {
                if (id == nid) {
                    delete cmd.oldValue[id];
                    delete cmd.newValue[id];
                }
            }
        }
    }
}

Graph.prototype.saveChanges = function() {
    // Save thumbnail 
    var thumb = this.createImage(true);
    this.db_saveImage(thumb, true); 
    
    // Save full-size
    var img = this.createImage(false);
    this.db_saveImage(img, false);
    
    // Save the command hash
    var hash = this.cmdHash.hash;
    debugOut(JSON.stringify(hash));
    this.db_saveHash(hash);
    
    // Reset the hash contents
    this.cmdHash.reset();
}

/**
    Undo function - called by Ctrl-Z 
    This feature is not currently fully supported, but works for some operations
**/
Graph.prototype.undo = function() {
    var cmd = this.undoStack.pop();
    
    // Make sure we have a valid command
    if (cmd === undefined || cmd === null) {
        return;
    }
    
    if (cmd.objType == this.cmdNode) {
        this.hadleNodeCommandUndo(cmd.objId, cmd.property, cmd.oldValue);
    } else if (cmd.objType == this.cmdEdge) {
        this.hadleEdgeCommandUndo(cmd.objId, cmd.property, cmd.oldValue);
    } else if (cmd.objType == this.cmdMulti) {
        for (var nid in cmd.oldValue) {
            this.hadleNodeCommandUndo(nid, cmd.property, cmd.oldValue[nid]);
        }
    } else {
        debugOut("Cannot undo. Unknown command type.");
        debugOut(cmd);
    }
    
    this.repaint();
}

/**
    Handles undo of a node property.
**/
Graph.prototype.hadleNodeCommandUndo = function(nid, property, oldValue) {

    var node = this.nodes[nid];
    
    if (property == this.cmdText) {
        node.text = oldValue;
    } else if (property == this.cmdDim) {
        node.dim = oldValue;
        if (this.selectedObject == node) {
            this.positionSlider(node);
        }
    } else if (property == this.cmdValence) {
        node.valence = oldValue;
    } else if (property == this.cmdNodePlaceholder) {
        // NO-op
    } else if (property == this.cmdAddDB) {
        // Delete from database
        this.db_deleteNode(this.nodes[nid]);
        // Kind of a hack, but mark this node as "new" and 
        // call delete
        // This will delete the node effectively from the graph
        // and undo stack, but not push another undo event
        this.nodes[nid].newNode = true;
        this.deleteNode(nid);
    } else if (property == this.cmdDeleteDB) {
        // Re-add the deleted node
        this.nodes[nid] = oldValue['dead'];
        this.drawOrder.push(nid);
        
        for (var eid in oldValue['edges']) {
            this.edges[eid] = oldValue['edges'][eid];
        }
    } else if (property == this.cmdLayout) {
        for (var nid in oldValue) {
            this.nodes[nid].dim = oldValue[nid];
        }
    } else if (property == this.cmdGraphMove) {
        this.originX = oldValue['x'];
        this.originY = oldValue['y'];
    } else {
        debugOut("Cannot undo. Unknown node property.");
        debugOut(cmd);
    }
}

/**
    Handles undo of an edge property.
**/
Graph.prototype.hadleEdgeCommandUndo = function(eid, property, oldValue) {

    var edge = this.edges[eid];
    
    if (property == this.cmdValence) {
        edge.valence = oldValue;
    } else if (property == this.cmdAddDB) {
        // Delete from database
        this.db_deleteEdge(this.edges[eid]);
        this.edges[eid].newEdge = true;
        this.deleteEdge(eid);
    } else if (property == this.cmdDeleteDB) {
        // Re-add the deleted edge
        this.edges[eid] = oldValue;
    }  else {
        debugOut("Cannot undo. Unknown edge property.");
        debugOut(cmd);
    }
}