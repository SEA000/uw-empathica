/* Graph object
*******************************************************************************/

var gg = new Graph();

/* Toolbar
*******************************************************************************/

$.fn.toolbarButton.defaults.iconSrc = "{{=URL('static','images/icons/edit_modified.png')}}";
$("#btnSelect").toolbarButton({ icon: 0, group: "inputMode" });
$("#btnAddConcepts").toolbarButton({ icon: 1, group: "inputMode" });
$("#btnAddConnections").toolbarButton({ icon: 2, group: "inputMode" });
$("#btnAddAmbivalent").toolbarButton({ icon: 6, group: "inputMode" });
$("#btnZoomIn").toolbarButton({ icon: 7 });
$("#btnZoomOut").toolbarButton({ icon: 8 });
$("#btnZoomFit").toolbarButton({ icon: 9 });
$("#btnSave").toolbarButton({ icon: 3, group: "inputMode" });
$("#btnExport").toolbarButton({ icon: 4 });
$("#btnExportHOTCO").toolbarButton({ icon: 5 });
$("#btnLoadFromFile").toolbarButton({ icon: 10 });
$("#btnSaveToFile").toolbarButton({ icon: 11 });
$("#btnSettings").toolbarButton({ icon: 12 });

$.fn.toolbarButton.defaults.iconSrc = "{{=URL('static','images/icons/nav.png')}}";
$("#btnDone").toolbarButton({ icon: 6, label: "Done" });

/* Suggestions
*******************************************************************************/
var suggestions = {};
var inList = {};
var ignoreList = [];

var numInList = 0;
var numSuggestions = 0;
var maxSuggestionsInList = 3;

var lastSuggestionsUpdate = 0;

/**
    Shows the suggestion slider.
**/
function showSuggestionSlider() {
    $("#suggestions > ul").center();
    $("#suggestions").stop(true,true).slideDown(300);
}

/**
    Hides the suggestion slider.
**/
function hideSuggestionSlider() {
    $("#suggestions").stop(true,true).slideUp(300);
}

/**
    Adds suggestion to the display list.
**/
function addSuggestionToList(id, name) {
    // Make sure we don't duplicate and don't go over
    if (id in inList || numInList == maxSuggestionsInList) { 
        return false; 
    }
    
   $("#suggestions ul").append(
        "<li id='suggestion-"+id+"' class='concept'>"+name+"<div id='ignore-"+id+"' class='concept-x tooltip' title='Ignore'><div class='concept-x-icon'></div></div></li>"
    );
    
    $("#suggestion-"+id).draggable({
        opacity: 0.7,
        helper: "clone",
        revert: "valid",
        scroll: false,
    }).each(function() {
        this.onselectstart = function() { return false; };
    }).children(":first").click(function() {
        // ignore-x
        var id = $(this).attr('id').split('-').pop();
        ignoreSuggestion(parseInt(id));
    }); 
    
    inList[id] = name;
    numInList += 1;
    return true;
}

/**
    Adds suggestion to the storage array and display list.
**/
function addSuggestion(id, name) {
    // Make sure we don't duplicate and don't repeat the ignore
    if (id in suggestions || jQuery.inArray(id, ignoreList) != -1) { 
        return; 
    }
    
    addSuggestionToList(id, name);
    
    suggestions[id] = name;
    numSuggestions += 1;
}

/**
    Attempts to fill the display list from either
    the storage or a json request to server.
**/
function getSuggestions() {
    // If we have enough suggestions, simply do nothing
    if (numInList == maxSuggestionsInList) {
        showSuggestionSlider();
        return;
    }
    
    // If we have enough suggestions stored, just add them to the list
    if (numSuggestions > maxSuggestionsInList - numInList) {
        for (var id in suggestions) {
            addSuggestionToList(id, suggestions[id]);
        }
        showSuggestionSlider();
        return;
    }

    // Else request more suggestions
    $.getJSON(
        "{{=URL('call/json/get_suggestions')}}",
        {
            'map_id': {{=cam.id}},
            'timestamp': lastSuggestionsUpdate
        },
        function(data) {
            // Ensure the server returned success
            if (data.success) {
                // Update UI
                $.each(data.suggestions, function(i,suggestion) {
                    addSuggestion(suggestion[0], suggestion[1]);
                });                
            
                // Pick out the maximum timestamp
                lastSuggestionsUpdate = Math.max.apply( Math, data.timestamps );  
            }
            
            if (numInList > 0) {
                showSuggestionSlider();
            } 
        }
    );
}

/**
    Deletes the suggestion from the storage array and the display list.
**/
function deleteSuggestionFromLists(id) {
    // Remove from suggestion list
    delete suggestions[id];
    numSuggestions -= 1;

    // Remove from display list
    delete inList[id];
    numInList -= 1;
}

/**
    Handles the ignore click.
**/
function ignoreSuggestion(id) {
    // Delete from lists
    deleteSuggestionFromLists(id);
    
    // Add to ignore list
    ignoreList.push(id);
    
    // Update the UI
    $("#suggestion-"+id).fadeOut(300, function() {
        $(this).remove();
                
        // Try to fill up suggestion bar
        for (var id in suggestions) {
            addSuggestionToList(id, suggestions[id]);
        }
        
        if (numInList == 0) {
            hideSuggestionSlider();
        } else {
            $("#suggestions > ul").center();
        }
    });
}

/**
    JQuery snippet to center suggestions.
**/
jQuery.fn.center = function () {    
    var parent = this;
    setTimeout(function() {
        parent.css("position","absolute");
        parent.css("left", ( $(window).width() - parent.width() ) / 2+$(window).scrollLeft() + "px");
    }, 10);
    return this;
}

/**
    Utilities for drag and drop.
**/
$("#suggestions .concept").draggable({
    opacity: 0.7,
    helper: "clone",
    revert: "valid",
});

$("#canvasDiv").droppable({
    drop: function(e,ui) {
        // check if in bounds
        if (e.pageY < 84) { return false; }
        
        var id = -1;
        var text = ui.draggable.text();
        for (var s in suggestions) {
            if (suggestions[s] == text) {
                id = s;
                break;
            }
        }
        
        if (id == -1) {
            debugOut('Could not find ID of suggested node');
            return;
        }
        
        // Remove the node from lists
        deleteSuggestionFromLists(id);
        
        var coords = g.getCursorPosition(e);
        var mx = coords[0];
        var my = coords[1];
        g.addSuggestedNode(id, text, mx, my);
        
        // Remove from list
        ui.draggable.remove();
        $("#btnSelect").toolbarButton('toggle'); // [TODO] ALEX MOVE THIS
    }
});

// Dragging fix
$("#canvasDiv,.unselectable").each(function() {
    this.onselectstart = function() { return false; };
});

/* Buttons
*******************************************************************************/
$("#btnSelect").click(function() {
    $("#canvasDiv").css('cursor', 'default');
    hideSuggestionSlider();
    g.setState(g.stateDefault);
});

$("#btnAddConcepts").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    getSuggestions();
    g.setState(g.stateAddingNodes);
});

$("#btnAddConnections").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    hideSuggestionSlider();
    g.setState(g.stateAddingEdges);
});

$("#btnAddAmbivalent").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    hideSuggestionSlider();
    g.setState(g.stateAddingSpecial, "ambivalent");
});

$("#btnSave").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("Saving. Just a moment... ");
});

$("#btnExport").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("Saving your image. Just a moment... ", "{{=URL('cam','download',args=[cam['id']])}}");
});

$("#btnExportHOTCO").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("Generating code. Just a moment... ", "{{=URL('cam','HOTCO_export',args=[cam['id']])}}");
});

$("#btnZoomIn").click(function() {
    g.zoomIn();
});

$("#btnZoomOut").click(function() {
    g.zoomOut();
});

$("#btnZoomFit").click(function() {
    g.centreGraph();
});

$("#btnSettings").click(function() {
    $("#winSettings").modal();
});

$("#btnDone").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("Saving. Just a moment... ", "{{=URL('conflict','overview', args=[conflictid])}}");
});

/* Properties Modal
*******************************************************************************/

// Update UI state based on the CAM settings
for (var id in THEMES) {
    if (THEMES[id].themeName == g.settings['theme']) {
        $("#theme").val(id);
        debugOut(id);
        break;
    }
}
setChecked("#showTitle", g.settings['showTitle']);
setChecked("#fixedFont", g.settings['fixedFont']);

$("#conflict-title,#cam-title")[g.settings['showTitle'] ? 'show' : 'hide']();

// Utility function to set checkbox state
function setChecked(component, state) {
    if (state) {
        $(component).attr('checked', true);
        $(component).siblings(".cb-enable").addClass('selected');
    } else {
        $(component).removeAttr('checked');
        $(component).siblings(".cb-disable").addClass('selected');
    }
}

// Check if a checkbox is checked
function isChecked(component) {
    return $(component).is(":checked");
}

$.extend($.modal.defaults, {
    containerId: 'modal-container',
    dataId: 'modal-data',
    overlayId: 'modal-overlay',
    persist: true,
    close: true,
    overlayClose: true,
    onOpen: function(dialog) {
        dialog.container.show();
        dialog.data.show();
        dialog.overlay.fadeIn(300);
    },
    onClose: function(dialog) {
        dialog.container.fadeOut(300);
        dialog.overlay.fadeOut(300, function() {
            $.modal.close();
        });
    },
});

$("#btnApply").click(function() {
    $("#btnApply").blur();           // Hack to reset button state
    $("#conflict-title,#cam-title")[isChecked("#showTitle") ? 'show' : 'hide']();
    g.applySettings({'theme' :     $("#theme").val(), 
                     'showTitle' : isChecked("#showTitle"), 
                     'fixedFont' : isChecked("#fixedFont")});
    $.modal.close();
});

$("#btnSaveToFile").click(function() {
    $.post(
        "{{=URL('call/json/export')}}", 
        {
            'map_id': {{=cam.id}},
            'code': g.createSaveString()
        }, 
        function(retData) {
            $("body").append("<iframe src='{{=URL('cam','export_string',args=[cam['id']])}}' style='display: none;' ></iframe>")
        }
    );
});

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    /**
        Attaches the reader to file selector.
    **/
    $("#files").bind('change', function() {
        var files = document.getElementById('files').files;
        if (!files.length) {
            alert('Please select a file to import!');
            return;
        }

        var file = files[0];
        var start = 0;
        var stop = file.size - 1;
        var reader = new FileReader();

        // If we use onloadend, we need to check the readyState.
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                var saveText = evt.target.result;
                if(saveText != "" && !g.generateGraphFromString(saveText)) {
                    alert("Empathica failed to import your CAM. Please, ensure that you are trying to import a valid Empathica file.");
                    return;
                }
                $.modal.close();
                g.repaint();
            } else {
                alert('Empathica failed to read your file.');
            }
        };

        if (file.webkitSlice) {
            var blob = file.webkitSlice(start, stop + 1);
        } else if (file.mozSlice) {
            var blob = file.mozSlice(start, stop + 1);
        }
        
        reader.readAsBinaryString(blob);
    });
    
    $("#btnLoadFromFile").click(function() {
        setTimeout(function() {             
            $("#importForm").modal();            
        }, 500);
    });    
} else {

    /**
        Fallback if File API is not supported.
    **/
    $("#btnLoadFromFile").click(function() {
        setTimeout(function() {             
            $("#importFormFallback").modal();            
        }, 500);
    });

    $("#btnRestore") 
        .click(function() {
            $("#btnRestore").blur();           // Hack to reset button state
            var saveText = $("#restore-text").val();
            if (saveText != "") {
                if(!g.generateGraphFromString(saveText)) {
                    alert("Your import string appears to be incorrect. Please, ensure that you are trying to import a valid Empathica CAM string.");
                    return;
                }
            }
            $.modal.close();
            g.repaint();
        });
}
    
/* Initialization
*******************************************************************************/

$(window).bind('resize', function () { 
    g.canvas.width = window.innerWidth - 2;
    g.canvas.height = window.innerHeight - 3;
    g.repaint();
});

$("body").css('overflow', 'hidden');

g.initGraphFromDB();
$("#btnSelect").toolbarButton('toggle');