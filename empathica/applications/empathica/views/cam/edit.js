/* Toolbar
*******************************************************************************/

$.fn.toolbarButton.defaults.iconSrc = "{{=URL('static','images/icons/edit_modified.png')}}";
$("#btnSelect").toolbarButton({ icon: 0, group: "inputMode" });
$("#btnAddConcepts").toolbarButton({ icon: 1, group: "inputMode" });
$("#btnAddConnections").toolbarButton({ icon: 2, group: "inputMode" });
$("#btnAddAmbivalent").toolbarButton({ icon: 6, group: "inputMode" });
$("#btnSave").toolbarButton({ icon: 3, group: "inputMode" });
$("#btnExport").toolbarButton({ icon: 4 });
$("#btnExportHOTCO").toolbarButton({ icon: 5 });
$("#btnZoomIn").toolbarButton({ icon: 7 });
$("#btnZoomOut").toolbarButton({ icon: 8 });
$("#btnZoomFit").toolbarButton({ icon: 9 });
$("#btnSettings").toolbarButton({ icon: 10 });

$.fn.toolbarButton.defaults.iconSrc = "{{=URL('static','images/icons/nav.png')}}";
$("#btnDone").toolbarButton({ icon: 6, label: "Done" });

/* Suggestions
*******************************************************************************/
var suggestions = {};
var addSuggestion = function(id, name) {
    if (id in suggestions) { return false; }
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
        ignoreSuggestion(id);
    });
    suggestions[id] = name;
}

var getSuggestions = function() {
    $.getJSON(
        "{{=URL('call/json/get_suggestions')}}",
        {'map_id': {{=cam.id}}},
        function(data) {
            if (!data.success) { return false; }
            $.each(data.suggestions, function(i,suggestion) {
                addSuggestion(suggestion[0], suggestion[1]);
            });
            $("#suggestions > ul").center();
        }
    );
}

var ignoreSuggestion = function(id) {
    $.getJSON(
        "{{=URL('call/json/ignore_suggestion')}}",
        {'map_id': {{=cam.id}}, 'id': id},
        function(data) {
            if (!data.success) { return false; }
            $("#suggestion-"+id).fadeOut(300, function() {
                $(this).remove();
                if (getSuggestionCount() == 0) {
                    $("#suggestions").stop(true,true).slideUp(300);
                }
            });
        }
    );
}

jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
    return this;
}

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
        for (var s in suggestions) {
            if (suggestions[s] == ui.draggable.text()) {
                id = s;
                debugOut('Adding: ' + id);
                break;
            }
        }
        
        if (id == -1) {
            debugOut('Could not find ID of suggested node');
            return;
        }
        
        var coords = g.getCursorPosition(e);
        var mx = coords[0];
        var my = coords[1];
        g.addSuggestedNode(id, ui.draggable.text(), mx, my);
        
        // Remove from list
        ui.draggable.remove();
        $("#btnSelect").toolbarButton('toggle'); // [TODO] ALEX MOVE THIS
    }
});

// Dragging fix
$("#canvasDiv,.unselectable").each(function() {
    this.onselectstart = function() { return false; };
});

var getSuggestionCount = function() {
    return $("#suggestions").children().children().length-1; // -1 for label node
}

/* Buttons
*******************************************************************************/
$("#btnSelect").click(function() {
    $("#canvasDiv").css('cursor', 'default');
    $("#suggestions").stop(true,true).slideUp(300);
    g.setState(g.stateDefault);
});

$("#btnAddConcepts").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    getSuggestions();
    if (getSuggestionCount() > 0) {
        $("#suggestions").stop(true,true).slideDown(300);
    }
    g.setState(g.stateAddingNodes);
});

$("#btnAddConnections").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    $("#suggestions").stop(true,true).slideUp(300);
    g.setState(g.stateAddingEdges);
});

$("#btnAddAmbivalent").click(function() {
    $("#canvasDiv").css('cursor', 'crosshair');
    $("#suggestions").stop(true,true).slideUp(300);
    g.setState(g.stateAddingSpecial, "ambivalent");
});

$("#btnSave").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph();
    $.blockUI({
        message: "Saving. Just a moment... ",
    });
});

$("#btnExport").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("{{=URL('cam','download',args=[cam['id']])}}");
    $.blockUI({
        message: "Saving your image. Just a moment... ",
    });
});

$("#btnExportHOTCO").click(function() {
    $('#btnSelect').toolbarButton('toggle');
    g.saveGraph("{{=URL('cam','HOTCO_export',args=[cam['id']])}}");
    $.blockUI({
        message: "Generating code. Just a moment... ",
    });
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
    g.saveGraph("{{=URL('conflict','overview', args=[conflictid])}}");
    $.blockUI({
        message: "Saving. Just a moment... ",
    });
});

/* Properties Modal
*******************************************************************************/

var showTitle = {{=cam.show_title or 'true'}};

if (showTitle) {
    $("#conflict-title,#cam-title").show();
    $("#showTitle").attr('checked',true);
    $("#showTitle").siblings(".cb-enable").addClass('selected');
} else {
    $("#conflict-title,#cam-title").hide();
    $("#showTitle").removeAttr('checked');
    $("#showTitle").siblings(".cb-disable").addClass('selected');
}

var theme = '{{=cam.theme}}';

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

$("#btnApply")
    .click(function() {
        $("#btnApply").blur();           // Hack to reset button state
        var showTitle = $("#showTitle").is(":checked");
        if (showTitle) {
            $("#conflict-title,#cam-title").show();
        } else {
            $("#conflict-title,#cam-title").hide();
        }
        var theme = $("#theme").val();
        g.setTheme(THEMES[theme]);
        $.modal.close();
    });

$("#btnExportToString")
    .click(function() {
        $.modal.close();         
        $("#save-text").val(g.createSaveString());
        $("#btnExportToString").blur();             // Hack to reset button state
        setTimeout(function() {             
            $("#exportForm").modal();             
        }, 500);            
    });
    
$("#btnSelectAll") 
    .click(function() {
        $("#save-text").select();
    });
    
$("#btnImportFromString")
    .click(function() {
        $.modal.close();    
        $("#btnImportFromString").blur();           // Hack to reset button state
        setTimeout(function() {             
            $("#importForm").modal();            
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
    
/* Initialization
*******************************************************************************/

$(window).bind('resize', function () { 
    g.canvas.width = window.innerWidth - 2;
    g.canvas.height = window.innerHeight - 3;
    g.repaint();
});

var gg = new Graph();
g.initGraphFromDB();
$("#btnSelect").toolbarButton('toggle');
getSuggestions();