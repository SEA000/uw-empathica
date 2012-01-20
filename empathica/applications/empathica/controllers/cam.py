"""
CAM Documentation
"""
import logging
import urllib
import random
from datetime import datetime

import gluon.contrib.simplejson as json

if settings.web2py_runtime_gae:
    from google.appengine.api import channel
    from google.appengine.api import memcache
    from google.appengine.api import taskqueue

@auth.requires_login()
def edit():
    '''
    Returns all of the data relevant to the selected CAM.
    '''
    map_id = request.args(0)
    if(auth.has_permission('read', db.Map, map_id)):
        cam = db.Map[map_id]
        group = db.GroupPerspective[cam.id_group]
        conflict = db.Conflict[group.id_conflict]
        response.title = "Edit - " + conflict.title
        client_id = str(random.random())
        channel_token = 'invalid'
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % cam.id)
            if not maplisteners:
                maplisteners = []
                memcache.set('map_%s_listeners' % cam.id, maplisteners)
            channel_token = channel.create_channel(client_id)
            if client_id not in maplisteners:
                maplisteners.append(client_id)
                memcache.set('map_%s_listeners' % cam.id, maplisteners)
                
        return dict(channel_token = channel_token, cam = cam, conflictid = conflict.id, conflict = conflict)
    else:
        raise HTTP(400)

@service.json
def get_suggestions(map_id):
    '''
    Returns a list of suggested nodes.
    '''
    if(auth.has_permission('read', db.Map, map_id)):
        suggestions = [] 

        cam = db.Map(map_id)
        conflict = cam.id_group.id_conflict
        groups = db(db.GroupPerspective.id_conflict == conflict.id).select()

        maps = []
        for g in groups:
            map = db(db.Map.id_group == g.id).select()
            maps.extend(map)
        
        for m in maps:
            if m.id != cam.id:
                nodes = db(db.Node.id_map == m.id).select()
                for n in nodes:
                    suggestions.append((n.id, n.name))
                    
        return dict(success=True, suggestions=suggestions[0:3])
    else:
        return dict(success=False)

@service.json
def ignore_suggestion(map_id, id):
    '''
    Notifies the server that the user wants to ignore suggestions.
    '''
    # Check perimssion on suggestion listy wherever that is
    if(auth.has_permission('update', db.Map, map_id)):
        return dict(success=True)
    else:
        return dict(success=False)

@auth.requires_login()
def call():
    '''
    TODO: Not sure what this does?!
    '''
    session.forget()
    return service()

@service.json
def get_graph_data(map_id):
    '''
    Parse through and return all the map information.
    '''
    if(auth.has_permission('read', db.Map, map_id)):
        nodes = {}
        edges = {}
        theme = db.Map[map_id].theme
        for row in db(db.Connection.id_map == map_id).select():
            edges[row.id] = { 'id': row.id, 'valence': row.valence, 'inner_points': row.inner_points, 'from': row.id_first_node, 'to': row.id_second_node, 'selected': False }
        for node in db(db.Node.id_map == map_id).select():
            nodes[node.id] = { 'id': node.id, 'text': node.name, 'valence': node.valence, 'dim': { 'x': node.x, 'y': node.y, 'width' : node.width, 'height' : node.height }, 'selected': False, 'newNode': False }
        mapdata = {
                'mapid' : map_id,
                'nodes' : nodes,
                'edges' : edges,
                'theme' : theme
        }
        return dict(success=True, mapdata=mapdata)
    else:
        return dict(success=False)

@service.json
def set_graph_data(map_id, nodes, edges):
    '''
    Set the graph data based on the incoming node and edge strings.
    '''
    if(auth.has_permission('update', db.Map, map_id)):
    
        map = db.Map(map_id)
    
        nodes_to_add = json.loads(nodes)
        edges_to_add = json.loads(edges)
        
        node_ids = {}
        edge_ids = {}
        
        for token, node in nodes_to_add.items():
            dim = node['dim']
            node_id = db.Node.insert(id_map = map_id, valence = node['valence'], x = dim['x'], y = dim['y'], width = dim['width'], height = dim['height'], name = node['text'])
            node_ids[token] = node_id
        
        for token, edge in edges_to_add.items():
            start = node_ids[edge['from']]
            end = node_ids[edge['to']]
            points = edge['innerPoints'].__repr__()
            connection_id = db.Connection.insert(id_first_node = start, id_second_node = end, valence = edge['valence'], inner_points = points, id_map = map_id)
            edge_ids[token] = connection_id
        
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        return dict(success=True, node_ids=node_ids, edge_ids=edge_ids)
    else:
        return dict(success=False)
        
@service.json
def add_node(map_id, token, x, y, width, height, name):
    '''
    Adds a node to the database.
    Note: By default set valences to 0 for new nodes.
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        map = db.Map(map_id)
        node_id = db.Node.insert(id_map = map_id, valence = 0, x = x, y = y, width = width, height = height, name = name)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email, is_empty = False)

        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                node = {    'id': node_id, 
                            'text': name, 
                            'valence': 0, 
                            'dim': 
                                { 
                                    'x': float(x), 
                                    'y': float(y), 
                                    'width' : float(width), 
                                    'height' : float(height),
                                }, 
                            'selected': False, 
                            'newNode': False,
                        }
                message = { 'type': 'nodeadd',
                            'node': node }
                for to_id in maplisteners:
                    channel.send_message(to_id, gluon.contrib.simplejson.dumps(message))

        return dict(success=True, token=token, node_id=node_id)
    else:
        return dict(success=False, token=token)

@service.json
def remove_node(map_id, node_id):
    '''
    Removes a node from the database.
    '''
    map_id = db.Node[node_id].id_map
    if(auth.has_permission('update', db.Map, map_id)):
        db(db.Connection.id_first_node == node_id).delete()
        db(db.Connection.id_second_node == node_id).delete()
        del db.Node[node_id]
        
        updated_map_info = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        if db(db.Node.id_map == map_id).count() > 0:
            updated_map_info['is_empty'] = False
        else:
            updated_map_info['is_empty'] = True
        db.Map[map_id] = updated_map_info
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                message = { 'type': 'noderemove',
                            'nodeid': node_id }
                for to_id in maplisteners:
                    channel.send_message(to_id, gluon.contrib.simplejson.dumps(message))

        return dict(success=True)
    else:
        return dict(success=False)


@service.json
def rename_node(map_id, node_id, name):
    '''
    Renames a node.
    '''
    map_id = db.Node[node_id].id_map
    if(auth.has_permission('update', db.Map, map_id)):
        db.Node[node_id] = dict(name=name)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                message = { 'type' : 'noderename',
                            'nodeid' : int(node_id),
                            'name' : str(name) }
                for to_id in maplisteners:
                    channel.send_message(to_id, gluon.contrib.simplejson.dumps(message))

        return dict(success=True, node_id = node_id)
    else:
        db.rollback()
        return dict(success=False)

@service.json
def edit_node_valence(map_id, node_id, valence):
    '''
    Edits the node valence.
    '''
    map_id = db.Node[node_id].id_map
    if(auth.has_permission('update', db.Map, map_id)):
        db.Node[node_id] = dict(valence=valence)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                message = { 'type' : 'nodevalence',
                            'nodeid' : int(node_id),
                            'valence' : float(valence) }
                for to_id in maplisteners:
                    channel.send_message(to_id, gluon.contrib.simplejson.dumps(message))

        return dict(success=True)
    else:
        return dict(success=False)

@service.json
def edit_node_dim(map_id, node_id, x, y, width, height):
    '''
    Edits node dimensions.
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        db.Node[node_id] = dict(x = x, y = y, width = width, height = height)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                message = { 'type' : 'nodedim',
                            'dim' : { 
                                        'x' : float(x),
                                        'y' : float(y),
                                        'width' : float(width),
                                        'height' : float(height) 
                                    }
                          }
                for to_id in maplisteners:
                    channel.send_message(to_id, "edited node dimensions")

        return dict(success=True)
    else:
        return dict(success=False)

@service.json
def create_connection(map_id, token, node_one_id, node_two_id, valence, inner_points):
    '''
    Creates a new edge in the CAM.
    '''
    map_one_id = db.Node[node_one_id].id_map
    map_two_id = db.Node[node_two_id].id_map
    
    if(auth.has_permission('update', db.Map, map_one_id) and auth.has_permission('update', db.Map, map_id)):
        connection_id = db.Connection.insert(id_first_node=node_one_id, id_second_node=node_two_id, valence=valence, inner_points=inner_points, id_map=map_id)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                for to_id in maplisteners:
                    channel.send_message(to_id, "added an edge")
        return dict(success=True, node_one=node_one_id, node_two=node_two_id, valence=valence, id=connection_id, token=token)
    else:
        return dict(success=False)

@service.json
def edit_connection_valence(map_id, edge_id, valence):
    '''
    Changes the valence of a given edge.
    '''
    map_id = db.Connection[edge_id].id_map
    if(auth.has_permission('update', db.Map, map_id)):
        db.Connection[edge_id] = dict(valence=valence)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                for to_id in maplisteners:
                    channel.send_message(to_id, "edit connection valence")
        return dict(success=True)
    else:
        return dict(success=False)
        
@service.json
def edit_connection_inner_points(map_id, edge_id, inner_points):
    '''
    Modifies the collection of inner points for a given edge.
    '''
    map_id = db.Connection[edge_id].id_map
    if (auth.has_permission('update', db.Map, map_id)):
        db.Connection[edge_id] = dict(inner_points=inner_points)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                for to_id in maplisteners:
                    channel.send_message(to_id, "edit connection inner points")
                    
        return dict(success=True)
    else:
        return dict(success=False)
        
@service.json
def remove_connection(map_id, edge_id):
    '''
    Removes and edge from a given CAM.
    '''
    map_id = db.Connection[edge_id].id_map
    if(auth.has_permission('update', db.Map, map_id)):
        del db.Connection[edge_id]
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
        
        if settings.web2py_runtime_gae:
            maplisteners = memcache.get('map_%s_listeners' % map_id)
            if maplisteners is not None:
                for to_id in maplisteners:
                    channel.send_message(to_id, "removed connection")
                    
        return dict(success=True)
    else:
        return dict(success=False)
        
@service.json
def set_thumbnail(map_id):
    '''
    Saves a small image of the CAM for interface purposes.
    '''
    imgdata = request.vars.imgdata
    if(auth.has_permission('update', db.Map, map_id)):
        db.Map[map_id] = dict(thumbnail = imgdata)
        return dict(success=True)
    else:
        return dict(success=False)

@service.json
def set_png(map_id):
    '''
    Saves the full image of the CAM for future retrieval.
    '''
    imgdata = request.vars.imgdata
    if(auth.has_permission('update', db.Map, map_id)):
        db.Map[map_id] = dict(imgdata = imgdata)
        return dict(success=True)
    else:
        return dict(success=False)

@service.json
def set_theme(map_id, theme):
    '''
    Keep track of the user's selected theme.
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        theme = request.vars.theme
        db.Map[map_id] = dict(theme = theme)
        return dict(success=True)
    else:
        return dict(success=False)
        
@service.json
def set_show_title(map_id, show_title):
    '''
    Save whether the user wants the title of the CAM to be shown or not.
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        theme = request.vars.theme
        db.Map[map_id] = dict(show_title = show_title)
        return dict(success=True)
    else:
        return dict(success=False)
 
@auth.requires_login()
def download():
    '''
    Returns the cached image of the CAM.
    '''
    map_id = request.args(0)
    if(auth.has_permission('read', db.Map, map_id)):
        cam = db.Map[map_id]
        return HTML(BODY(IMG(_src=cam.imgdata)))
    else:
        raise HTTP(400);
        
@auth.requires_login()
def HOTCO_export():
    '''
    Returns generated HOTCO code based on the given CAM.
    '''
    map_id = request.args(0)
    if(auth.has_permission('read', db.Map, map_id)):
        data = []
        data.append('<h1>HOTCO code: </h1><br />')
        
        group_id = db.Map[map_id].id_group
        conflict_id = db.GroupPerspective[group_id].id_conflict
        
        title = db.Conflict[conflict_id].title.replace(' ', '_')
        
        data.append('(defun ' + title + ' () <br />')

        data.append('(setq *problem* \'oj-hot) <br />')
        data.append('(clear-net) <br />')
        data.append('(hot) <br />')
        
        data.append('<br />')
        data.append('(data \'( __FILL_THIS_IN )) <br />')
        
        data.append('<br />; Propositions: <br />')
        for node in db(db.Node.id_map == map_id).select():
            data.append('\t(proposition \'%s \"[%s] node is active.\") <br />' % (node.name.replace(' ', '_'), node.name ))
        
        data.append('<br />; Edges: <br />')
        for row in db(db.Connection.id_map == map_id).select():
            start = db.Node[row.id_first_node].name.replace(' ', '_')
            end = db.Node[row.id_second_node].name.replace(' ', '_')
            data.append('\t(associate %s %s %0.2f) <br />' % (start, end, row.valence * 3 ))
            
        data.append('<br />')
        data.append('(make-competition) <br />')
        data.append('<br />')
        
        data.append('; HOTCO <br />')
        data.append('(valence-unit \'valence-special \'((good 1))) <br />')
        data.append('<br />')
        
        data.append('; for HOTCO 2, note the evaluation units <br />')
        data.append('(setf *evaluation-units* *all-units*) <br />')
            
        data.append('<br />; Node value associations: <br />')  
        for node in db(db.Node.id_map == map_id).select():
            data.append('\t(associate %s good %0.2f) <br />' % (node.name, node.valence * 3 ))
        
        data.append('<br />')  
        data.append('(eval-cohere) <br />')
        data.append('(pls) <br />')
        data.append('(show-valence)) <br />')
        data.append(')')
            
        return data
    else:
        raise HTTP(400);        