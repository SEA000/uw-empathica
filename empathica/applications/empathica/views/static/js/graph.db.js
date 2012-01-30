/** 
    Database calls made by the Graph library. Calls are made using the 
    jQuery library. URLs for the AJAX calls are constructed for us by web2py. 
    
    In the case of a Database error (authentication or other unknown error)
    the library notes it. If this happens, the user will also be prompted with 
    the stringified JSON text of the graph that they can later use to recover 
    the graph in case of a DB crash (TODO). 
    
    In debug mode (set in graph.util.js) each call prints its URL to the 
    console before invoking the AJAX call. 
    
    Author:         Alex Bass
    Last Updated:   2011-04-17
 **/ 
 
/**
    Process a DB save the command hash.
**/
Graph.prototype.db_saveHash = function(hash) {
    var url = "{{=URL('call/json/save_hash')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:     g.mapID, 
            hash:       JSON.stringify(hash)      
        }, function(data) {
            if (g.db_validate_response(data)) {
                debugOut('Command hash successfully saved.');
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to the changes you have made. Please, retry.');
        g.decrementPendingSaves();
    });
}
 
/**
    Add a new node on the Graph to the DB
**/
Graph.prototype.db_addNode = function(node) {
    if (! (node instanceof Node) ) {
        debugOut('Tried to add a node that is not a node!');
        return;
    }
    
    var url = "{{=URL('call/json/add_node')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:     g.mapID, 
            token:      node.id,
            x:          node.dim.x,
            y:          node.dim.y,
            width:      node.dim.width,
            height:     node.dim.height,
            name:       node.text
        }, function(data) {
            if (g.db_validate_response(data)) {
                g.update_node_id(data.token, data.node_id);
                debugOut('Node successfully added to the database.');
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to save node [' + node.text + '].');
        g.decrementPendingSaves();
    });
}

/**
    Add a new Edge on the graph to the DB
**/
Graph.prototype.db_addEdge = function(edge) {
    if (! (edge instanceof Edge)) {
        debugOut('Tried to add an edge that is not an edge!');
        return;
    }
    
    var url = "{{=URL('call/json/create_connection')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID, 
            token:          edge.id,
            node_one_id:    edge.from,
            node_two_id:    edge.to, 
            valence:        edge.valence,
            inner_points:   JSON.stringify(edge.innerPoints)
        }, function(data) {
            if (g.db_validate_response(data)) {
                g.update_edge_id(data.token, data.id);
                debugOut('Edge successfully added to the database.');
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to save edge with token [' + edge.id + '].');
        g.decrementPendingSaves();
    });
}

/**
    Delete a node from the DB once it has been removed from the Graph
**/
Graph.prototype.db_deleteNode = function(node) {
    if (! (node instanceof Node) ) {
        debugOut('Tried to delete unknown object from database!');
        debugOut(node);
        return;
    }
    
    var url = "{{=URL('call/json/remove_node')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID,
            node_id:        node.id
        }, function(data) {        
            if (g.db_validate_response(data)) {
                debugOut('Node successfully deleted from the database.');
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to delete node [' + node.text + '].');
        g.decrementPendingSaves();
    });
}

/**
    Delete an Edge from the DB once it has been removed from the Graph
**/
Graph.prototype.db_deleteEdge = function(edge) {
    if (!(edge instanceof Edge)) {
        debugOut('Tried to delete unknown object from database!');
        debugOut(edge);
        return;
    }
    
    var url = "{{=URL('call/json/remove_connection')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID, 
            edge_id:        edge.id
        }, function(data) {
            if (g.db_validate_response(data)) {
                debugOut('Edge successfully deleted from the database.');
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to delete edge with id [' + edge.id + '].');
        g.decrementPendingSaves();
    });
}

/**
    Retrieve data for this Map from the DB and populate the Graph
**/
Graph.prototype.db_getGraphData = function() {
    
    var url = "{{=URL('call/json/get_graph_data')}}";
    
    this.incrementPendingSaves();
    $.getJSON(
        url,
        {   
            map_id:         g.mapID
        }, function(data) {
            //debugOut(data);
            if (g.db_validate_response(data)) {
            
                // Create nodes
                var nodeCount = 0;
                for (var id in data.mapdata.nodes) {
                    var record = data.mapdata.nodes[id];
                    
                    // Have to create new Node objects from returned data
                    var n = new Node(id, record.text, record.valence);
                    n.dim = record.dim;
                    n.selected = false;
                    n.newNode = false;
                    
                    // Insert into the data structures
                    g.nodes[id] = n;
                    g.drawOrder.push(id);
                    nodeCount += 1;
                }
                
                // Create edges
                for (var id in data.mapdata.edges) {
                    var record = data.mapdata.edges[id];
                    
                    // Have to create a new Edge object from returned data
                    var e = new Edge(record.id, record.from, record.to, record.valence);
                    var innerPoints = JSON.parse(record.inner_points);
                    if (!innerPoints || innerPoints == null) {
                        innerPoints = [];
                    }
                    e.innerPoints = innerPoints;
                    e.selected = false;
                    
                    // Insert into data structures
                    g.edges[id] = e;
                }
                
                // Set theme
                var savedTheme = data.mapdata.theme;
                if (savedTheme != null && savedTheme != "") {
                    debugOut("Not null theme: " + savedTheme)
                    for (var i in THEMES) {
                        var t = THEMES[i];
                        if (t.themeName == savedTheme) {
                            g.setTheme(t);
                            break;
                        }
                    }
                } else {
                    g.setTheme(THEMES.DEFAULT);
                }
                
                g.originX = data.mapdata.origin['x'];
                g.originY = data.mapdata.origin['y'];
                
                // Make sure the origin is not null
                if (g.originX == null || g.originY == null || nodeCount == 0) {
                    g.originX = g.canvas.width / 2;
                    g.originY = g.canvas.height / 2;
                    g.db_saveOrigin();
                }

                g.repaint();
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to retrieve your CAM data. Please, try again.');
        g.decrementPendingSaves();
    });
}

// Sets the graph data based on the input nodes and edges
Graph.prototype.db_setGraphData = function(nodes, edges, origin)
{
    var url = "{{=URL('call/json/set_graph_data')}}";
    
    this.incrementPendingSaves();
    $.getJSON(
        url,
        {   
            map_id:         g.mapID, 
            nodes:          JSON.stringify(nodes),
            edges:          JSON.stringify(edges),
            origin:         JSON.stringify(origin)
        }, function(data) {
            if (g.db_validate_response(data)) {
                for (var token in data.nodes) {
                    g.update_node_id(token, data.nodes[token]);
                }
                
                // Update all edges
                for (var token in data.edges) {
                    g.update_edge_id(token, data.edges[token]);
                }
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to import your CAM data. Please, try again.');
        g.decrementPendingSaves();
    });
}

/**
    Save current origin to the DB
**/
Graph.prototype.db_saveOrigin = function() {
    
    var url = "{{=URL('call/json/save_origin')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID, 
            origin:         JSON.stringify({'x': g.originX, 'y': g.originY})
        }, function(data) {
            if (g.db_validate_response(data)) {
                debugOut("Save origin success!");
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to save the current CAM origin.');
        g.decrementPendingSaves();
    });
}

/**
    Save the graph image (either full image or thumbnail) to the DB
**/ 
Graph.prototype.db_saveImage = function(imgdata, isThumbnail) {    
    
    // Get the JSON url
    var url = "{{=URL('call/json/set_png')}}";
    if (isThumbnail) {
        url = "{{=URL('call/json/set_thumbnail')}}";
    }
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID,
            imgdata:        imgdata
        }, function(data) {
            if (g.db_validate_response(data)) {
                if (isThumbnail) {
                    debugOut("Save thumbnail success!");
                } else {
                    debugOut("Save image success!");
                }
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed store an image representation of your CAM.');
        g.decrementPendingSaves();
    });
}

/**
    Save current theme to the DB
**/
Graph.prototype.db_saveTheme = function() {
    
    var url = "{{=URL('call/json/set_theme')}}";
    
    this.incrementPendingSaves();
    $.post(
        url,
        {   
            map_id:         g.mapID, 
            theme:          g.theme.themeName
        }, function(data) {
            if (g.db_validate_response(data)) {
                debugOut("Save theme success!");
            }
            g.decrementPendingSaves();
        }
    ).error(function(data) {
        alert('Oops. Empathica failed to save the current theme.');
        g.decrementPendingSaves();
    });
}

/**
    incrementPendingSaves and decrementPendingSaves are used to keep track
    of the AJAX calls made. 
    
    TODO: this can probably be handled by jQuery in the future. 
**/
Graph.prototype.incrementPendingSaves = function() {
    this.pendingSaves += 1;
}

Graph.prototype.decrementPendingSaves = function() {
    this.pendingSaves -= 1;
    if (this.pendingSaves == 0) {
        // Clear the "Saving" message from the screen and redirect if necessary
        $.unblockUI({
            onUnblock: function() {
                if (g.redirectOnSave != "") {
                    location.href = g.redirectOnSave;
                }
            }
        });
    } 
}

// Validates a JSON response
Graph.prototype.db_validate_response = function(data) {
    if (typeof(data.success) != "undefined") {
        if (data.success) {
            return true;
        } else {
            alert('You are not authorized to make modifications to this CAM.');
            return false;
        }
    }
    debugOut('DB returned unexpected result!');
    alert('Oops. Empathica encountered an unexpected DB error :(');
    return false;
}

// Updates the state of an uncommitted node (not in db) to indicate that it has been
// successfully saved. Hence, also assigns a new id to this node.
Graph.prototype.update_node_id = function(token, new_id) {

    var node = this.nodes[token];
    node.newNode = false;
    node.id = new_id;
    this.nodes[new_id] = node;
    delete this.nodes[token];
    
    // Draw order
    for (var i = this.drawOrder.length - 1; i >= 0; i--) {
        if (this.drawOrder[i] == token) {
            this.drawOrder[i] = new_id;
            break;
        }
    }
    
    // Edges
    for (var id in this.edges) {
        var edge = this.edges[id];
        if (edge.from == token) {
            edge.from = new_id;
        } else if (edge.to == token) {
            edge.to = new_id;
        }
    }
    
    // Undo stack
    for (var j = this.undoStack.length - 1; j >= 0; j--) {
        var cmd = this.undoStack[j];
        if (cmd.objId == token) {
            cmd.objId = new_id;
            if (cmd.property == this.cmdNodePlaceholder) {
                break; // placeholder should be earliest occurrence of this node
            }
        }
    }
}

// Updates the state of an uncommitted edge (not in db) to indicate that it has been
// successfully saved. Hence, also assigns a new id to this edge.
Graph.prototype.update_edge_id = function(token, new_id) {

    var edge = this.edges[token];
    edge.newEdge = false;
    edge.id = new_id;
    this.edges[new_id] = edge;
    delete this.edges[token];

    // Undo stack
    for (var j = this.undoStack.length - 1; j >= 0; j--) {
        var cmd = this.undoStack[j];
        if (cmd.objId == token) {
            cmd.objId = new_id;
            if (cmd.property == this.cmdNodePlaceholder) {
                break; // placeholder should be earliest occurrence of this node
            }
        }
    }
}
