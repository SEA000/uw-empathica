/** 
    This file contains methods related to saving and Undo/Redo functionality
    (partially implemented)
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 

/*
  Data structure to aggregate commands into database updates
*/
function CmdHash () {
    this.hash = {};
    return this;
}

/**
    Store a new value for: 
    CmdHash[objType][objId][property] = newValue
    
    As values are pushed, they will erase previous entries
**/
CmdHash.prototype.addCmd = function(cmd) {
    // First, check if the entry exists and create if necessary
    if (this.hash[cmd.objType] === undefined) {
        this.hash[cmd.objType] = {};
    }
    if (this.hash[cmd.objType][cmd.objId] === undefined) {
        this.hash[cmd.objType][cmd.objId] = {};
    }
    
    this.hash[cmd.objType][cmd.objId][cmd.property] = cmd.newValue;
}

/**
    Object representing an operation to be saved to the database
**/
function Command (objType, objId, property, oldValue, newValue) {
    this.objType = objType;
    this.objId = objId;
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
}

/**
    Push a command onto the undo stack
**/ 
Graph.prototype.pushToUndo = function(cmd) {
    this.undoStack.push(cmd);
    
    // Keep the stack from getting too big and also save our data periodically
    if (this.undoStack.length > this.undoStackSize * 2) {
        this.squishAndSave(this.undoStackSize);
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

/**
    Remove <count> commands from the start of the undo stack
    and insert them to the CmdHash for aggregation
    
    If called without count, then save everything from the stack
**/
Graph.prototype.squishAndSave = function(count) {
    var n = count;
    if (!count) {
        debugOut('Saving whole stack to DB');
        n = this.undoStack.length;
    }
    
    var toSave = this.undoStack.splice(0, n);
    var cmdHash = new CmdHash();
    for (var i in toSave) {
        var cmd = toSave[i];        
        if (cmd.property == this.cmdLayout) {
            // If a layout command, then add all of its constituents to the hash
            for (id in cmd.newValue) {
                cmdHash.addCmd(new Command(this.cmdNode, id, this.cmdDim, cmd.oldValue[id], cmd.newValue[id]));
            }
            cmdHash.addCmd(new Command(this.cmdNode, "", this.cmdGraphMove, "", { 'x' : g.originX, 'y': g.originY }));
        } else {
            cmdHash.addCmd(cmd);
        }
    }
    
    // Save thumbnail 
    var thumb = this.createImage(true);
    this.db_saveImage(thumb, true); 
    
    // Save full-size
    var img = this.createImage(false);
    this.db_saveImage(img, false);
    
    // Save the command hash
    debugOut(JSON.stringify(cmdHash.hash));
    this.db_saveHash(cmdHash.hash);
}

/**
    Undo function - called by Ctrl-Z 
    This feature is not currently fully supported, but works for some operations
**/
Graph.prototype.undo = function() {
    var cmd = this.undoStack.pop();
    
    if (cmd === undefined || cmd === null) {
        return;
    }
    
    if (cmd.objType == this.cmdNode) {
        var node = this.nodes[cmd.objId];
        if (cmd.property == this.cmdText) {
            node.text = cmd.oldValue;
        } else if (cmd.property == this.cmdDim) {
            node.dim = cmd.oldValue;
            if (g.selectedObject.id == cmd.objId) {
                g.showValenceSelector(g.selectedObject);
            }
        } else if (cmd.property == this.cmdValence) {
            node.valence = cmd.oldValue;
        } else if (cmd.property == this.cmdNodePlaceholder) {
            // NO-op
        } else if (cmd.property == this.cmdAddDB) {
            // Delete from database
            this.db_deleteNode(this.nodes[cmd.objId]);
            // Kind of a hack, but mark this node as "new" and 
            // call delete
            // This will delete the node effectively from the graph
            // and undo stack, but not push another undo event
            this.nodes[cmd.objId].newNode = true;
            this.deleteNode(cmd.objId);
        } else if (cmd.property == this.cmdDeleteDB) {
            // Re-add the deleted node
            this.nodes[cmd.objId] = cmd.oldValue['dead'];
            this.drawOrder.push(cmd.objId);
            
            for (var eid in cmd.oldValue['edges']) {
                this.edges[eid] = cmd.oldValue['edges'][eid];
            }
        } else if (cmd.property == this.cmdLayout) {
            for (var i in cmd.oldValue) {
                node = this.nodes[i];
                node.dim = cmd.oldValue[i];
            }
        }  else if (cmd.property == this.cmdGraphMove) {
            this.originX = cmd.oldValue['x'];
            this.originY = cmd.oldValue['y'];
        }
    } else if (cmd.objType == this.cmdEdge) {
        var edge = this.edges[cmd.objId];
        if (cmd.property == this.cmdValence) {
            edge.valence = cmd.oldValue;
        } else if (cmd.property == this.cmdAddDB) {
            // Delete from database
            this.db_deleteEdge(this.edges[cmd.objId]);
            this.edges[cmd.objId].newEdge = true;
            this.deleteEdge(cmd.objId);
        } else if (cmd.property == this.cmdDeleteDB) {
            // Re-add the deleted edge
            this.edges[cmd.objId] = cmd.oldValue;
        }
    } else {
        debugOut("Cannot undo.");
        debugOut(cmd);
    }
    
    this.repaint();
}
