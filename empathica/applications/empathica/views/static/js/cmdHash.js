/** 
    This file contains methods related to saving and Undo/Redo functionality.
    
    Author:         Eugene Solodkin
    Last Updated:   2012-01-27
 **/ 
 
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
  Data structure to aggregate commands into database updates.
**/
function CmdHash () {
    this.hash = {};
    return this;
}
 
/**
    Adds a command to hash.
**/
CmdHash.prototype.addCmd = function(cmd) {
    this.addToHash(cmd.objType, cmd.objId, cmd.property, cmd.newValue);
}

/**
    Store a new value for: 
    CmdHash[objType][objId][property] = newValue
    
    As values are pushed, they will erase previous entries
**/
CmdHash.prototype.addToHash = function(objType, objId, property, newValue) {
    // First, check if the entry exists and create if necessary
    if (this.hash[objType] === undefined) {
        this.hash[objType] = {};
    }
    if (this.hash[objType][objId] === undefined) {
        this.hash[objType][objId] = {};
    }
    
    // Add object to hash
    this.hash[objType][objId][property] = newValue;
}

/**
    Reset the command hash.
**/
CmdHash.prototype.reset = function() {
    this.hash = {};
}
