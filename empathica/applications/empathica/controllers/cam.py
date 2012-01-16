"""
CAM Documentation
"""
import logging
import urllib
import random
from datetime import datetime

import gluon.contrib.simplejson

if settings.web2py_runtime_gae:
    from google.appengine.api import channel
    from google.appengine.api import memcache
    from google.appengine.api import taskqueue

@auth.requires_login()
def edit():
    """
    TODO
    """
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
        return dict(channel_token = channel_token, cam = cam, conflictid = conflict.id, conflict=conflict)
    else:
        raise HTTP(400)

@service.json
def get_suggestions(map_id):
    """
    TODO
    """
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
    """
    TODO
    """
    # Check perimssion on suggestion listy wherever that is
    if(auth.has_permission('update', db.Map, map_id)):
        # DIRTY BITTTTTT
        return dict(success=True)
    else:
        return dict(success=False)
        
@auth.requires_login()
def review():
    """
    TODO
    """
    response.title = "Review" # include actual title
    return dict()

@auth.requires_login()
def call():
    """
    TODO
    """
    session.forget()
    return service()

@service.json
def get_graph_data(map_id):
    '''
    Parse through and return all the map information
    Param: map id
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
def add_node(map_id, token, x, y, width, height, name):
    '''
    By default set valences to 0 for new nodes
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        map = db.Map(map_id)
        node_id = db.Node.insert(id_map=map_id, valence = 0, x = x, y = y, width = width, height = height, name = name)
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
def add_suggested_node(map_id, other_node_id, name, x, y, width, height, valence):
    """
    TODO
    """
    if (auth.has_permission('update', db.Map, map_id)):
        node_id = db.Node.insert(id_map=map_id, valence = valence, x = x, y = y, width = width, height = height, name = name)
        db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email, is_empty = False)
        
        # Correlate!
        target_map = int(map_id)
        source_map = db.Node(other_node_id).id_map.id
        if (target_map < source_map):
            db.NodeMapping.insert(map_one = target_map, node_one = node_id, map_two = source_map, node_two = other_node_id, identical = True)
        else:
            db.NodeMapping.insert(map_one = source_map, node_one = other_node_id, map_two = target_map, node_two = node_id, identical = True)
        
        return dict(success=True, token=other_node_id, node_id=node_id)
    else:
        return dict(success=False, token=other_node_id)
        
@service.json
def remove_node(map_id, node_id):
    """
    TODO
    """
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
    TODO
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
    """
    TODO
    """
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
    TODO
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
    TODO
    '''
    map_one_id = db.Node[node_one_id].id_map
    map_two_id = db.Node[node_two_id].id_map

    if(map_one_id != map_two_id):
        return dict(success=False)
    
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
    TODO
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
    TODO
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
    """
    TODO
    """
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
    TODO
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
    TODO
    '''
    imgdata = request.vars.imgdata
    if(auth.has_permission('update', db.Map, map_id)):
        db.Map[map_id] = dict(imgdata = imgdata)
        return dict(success=True)
    else:
        return dict(success=False)

@service.json
def get_thumbnail(map_id):
    """
    TODO
    """
    if(auth.has_permission('read', db.Map, map_id)):
        import gluon.contenttype
        response.headers['Content-Type']=gluon.contenttype.contenttype('.png')
        return dict(img=db.Map[map_id].thumbnail)

@service.json
def set_theme(map_id, theme):
    '''
    Keep track of the user's selected theme
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
    Save whether the user wants the title of the CAM to be shown or not
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        theme = request.vars.theme
        db.Map[map_id] = dict(show_title = show_title)
        return dict(success=True)
    else:
        return dict(success=False)
 
@service.json
def save_graph(map_id, data):
    '''
    params: array of data
    '''
    if(auth.has_permission('update', db.Map, map_id)):
        #todo: parse the json and save the data to the grid I guess
        return dict(success=True)
    else:
        return dict(success=False)
        
@auth.requires_login()
def download():
    map_id = request.args(0)
    if(auth.has_permission('read', db.Map, map_id)):
        cam = db.Map[map_id]
        return HTML(BODY(IMG(_src=cam.imgdata)))
    else:
        raise HTTP(400);
    