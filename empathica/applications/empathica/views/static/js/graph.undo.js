/** 
    This file contains methods related to saving and Undo/Redo functionality
    (partially implemented)
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/**
    Push a command onto the undo stack
**/ 
Graph.prototype.pushToUndo = function(objType, objId, property, oldValue, newValue) {
    // Add command to the undo stack
    this.undoIdCounter += 1;
    this.undoStack.push(new Command(this.undoIdCounter, objType, objId, property, oldValue, newValue));
    
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

    // Make sure we have stuff to save
    if (this.undoStack.length == 0 || this.pendingSaves == 1) {
        this.onSaveComplete();
        return;
    }

    // Add command to the save hash
    var cmdHash = new CmdHash();
    for (var i = 0; i < this.undoStack.length; i += 1) {
        var cmd = this.undoStack[i];
        if (cmd.objType == this.cmdMulti) {
            // If a multi command, then add all of its constituents to the hash
            for (var id in cmd.newValue) {
                cmdHash.addToHash(this.cmdNode, id, this.cmdDim, cmd.newValue[id]);
            }
        } else if (cmd.property == this.cmdLayout) {
            // If a layout command, then add all of its constituents to the hash
            for (var id in cmd.newValue['nodes']) {
                cmdHash.addToHash(this.cmdNode, id, this.cmdDim, cmd.newValue['nodes'][id]);
            }
            for (var id in cmd.newValue['edges']) {
                cmdHash.addToHash(this.cmdEdge, id, this.cmdInnerPoints, cmd.newValue['edges'][id]);
            }
            cmdHash.addToHash(this.cmdNode, "", this.cmdGraphMove, { 'x' : g.originX, 'y': g.originY });
        } else {
            cmdHash.addCmd(cmd);
        }
    }
    
    // Save the command hash
    var hash = cmdHash.hash;
    var thumb = this.createImage(true);
    var img = this.createImage(false);
    this.db_save(hash, thumb, img);
}

/**
    Save Graph data to the database. 
    If a redirect is provided, the page will redirect after saving is completed.
**/
Graph.prototype.onSaveComplete = function() {
    $.unblockUI({
        onUnblock: function() {
            // Clear the undo stack
            g.undoStack.length = 0;
        
            // Redirect if needed
            if (g.redirectOnSave != "") {
                location.href = g.redirectOnSave;
            }
        }
    });
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
    
    if (cmd.property == this.cmdLayout) {
        for (var nid in cmd.oldValue['nodes']) {
            this.hadleNodeCommandUndo(nid, this.cmdDim, cmd.oldValue['nodes'][nid]);
        }
        for (var eid in cmd.oldValue['edges']) {
            this.hadleEdgeCommandUndo(eid, this.cmdInnerPoints, cmd.oldValue['edges'][eid]);
        }
        this.hadleNodeCommandUndo("", this.cmdGraphMove, cmd.oldValue['origin']);
    } else if (cmd.objType == this.cmdNode) {
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
        node.setValence(oldValue);
        if (this.selectedObject == node) {
            this.showValenceSelector(node);
        }
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
    } else if (property == this.cmdGraphMove) {
        this.originX = oldValue['x'];
        this.originY = oldValue['y'];
    } else {
        debugOut("Cannot undo. Unknown node property.");
        debugOut(property);
    }
}

/**
    Handles undo of an edge property.
**/
Graph.prototype.hadleEdgeCommandUndo = function(eid, property, oldValue) {

    var edge = this.edges[eid];
    
    if (property == this.cmdValence) {
        edge.setValence(oldValue);
        if (this.selectedObject == edge) {
            this.showValenceSelector(edge);
        }
    } else if (property == this.cmdAddDB) {
        // Delete from database
        this.db_deleteEdge(this.edges[eid]);
        this.edges[eid].newEdge = true;
        this.deleteEdge(eid);
    } else if (property == this.cmdInnerPoints) {
        edge.innerPoints = oldValue;
    } else if (property == this.cmdDeleteDB) {
        // Re-add the deleted edge
        this.edges[eid] = oldValue;
    }  else {
        debugOut("Cannot undo. Unknown edge property.");
        debugOut(property);
    }
}