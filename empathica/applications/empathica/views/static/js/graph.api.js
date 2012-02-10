/** 
    API provided to the Graph's parent container
    These are the only functions that should be called from outside the
    graph.*.js library
    
    Author:         Alex Bass 
    Last Updated:   2011-04-17
 **/ 

/**
    Set input state 
    Available states: 
        Graph.stateAddingNodes
        Graph.stateAddingEdges
        Graph.stateAddingSpecial
        Graph.stateDefault
 **/
Graph.prototype.setState = function(state, nodeType) {
    this.addingSpecialType = nodeType;
    this.setStateFromUI(state);
}

/**
    Retrieve Graph data from the database on page load
**/
Graph.prototype.initGraphFromDB = function() {
    this.db_getGraphData();
}

/**
    Save Graph data to the database. 
    If a redirect is provided, the page will redirect after saving is completed.
**/
Graph.prototype.saveGraph = function(msg, action) {
    $.blockUI({
        message: msg
    });
    
    if (action) {
        this.actionOnSave = action;        
    }
    
    return this.saveChanges();
}

/**
    Update the colour scheme of the graph. For a list of available themes, 
    consult graph.themes.js.
**/
Graph.prototype.setTheme = function(newTheme) {
    this.theme = newTheme;
    
    // Update cached themes
    for (var nid in this.nodes) {
        this.nodes[nid].updateTheme();
    }
    
    // Update cached themes
    for (var eid in this.edges) {
        this.edges[eid].updateTheme();
    }
    
    this.repaint();
}

/**
    Applies the graph settings.
**/
Graph.prototype.applySettings = function(settings) {
    this.setTheme(THEMES[settings['theme']]);
    this.settings = settings;
    this.db_saveSettings();
    this.repaint();
}

/**
    Add a node from the Node suggestions drag & drop interface to the Graph
**/
Graph.prototype.addSuggestedNode = function(id, text, x, y) {
    return this.suggestedNode(id, text, this.neutralValence, x, y);
}

