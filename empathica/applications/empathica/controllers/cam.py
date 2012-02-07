"""
CAM Documentation
"""
import logging
import urllib
import random
import re
import hashlib

from datetime import datetime
from time import mktime

import gluon.contrib.simplejson as json

def get_update_hash(map_id, user_id):
    s = str(map_id) + ' ' + str(user_id) + ' update' 
    return hashlib.sha256(s).hexdigest()

def can_update(map_id, user_id, hash):
    return hash == get_update_hash(map_id, user_id)
    
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
        return dict(cam = cam, conflictid = conflict.id, conflict = conflict, can_update = get_update_hash(map_id, auth.user.id))
    else:
        raise HTTP(400)

@service.json
def get_suggestions(map_id, timestamp):
    '''
    Returns a list of suggested nodes.
    '''
    if not auth.has_permission('read', db.Map, map_id):
        return dict(success = False)
        
    suggestions = [] 

    cam = db.Map(map_id)
    conflict = cam.id_group.id_conflict
    groups = db(db.GroupPerspective.id_conflict == conflict.id).select()
    
    timestamps = []
    for g in groups:
        map = db(db.Map.id_group == g.id).select()
        for m in map:
            # If this is the current map, ignore
            if m.id == cam.id:
                continue
                
            # Make sure cams were updated before quering for nodes
            modified_at = m.date_modified
            last_timestamp = mktime(modified_at.timetuple()) + 1e-6 * modified_at.microsecond
            if float(timestamp) - last_timestamp >= 0:
                continue
                
            timestamps.append(last_timestamp)
            nodes = db(db.Node.id_map == m.id).select()
            for n in nodes:
                suggestions.append((n.id, n.name))
    
    if len(suggestions) > 0:
        return dict(success=True, suggestions = suggestions, timestamps = timestamps)
        
    return dict(success = False)

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
    if not auth.has_permission('read', db.Map, map_id):
        return dict(success=False)
        
    cam = db.Map[map_id]
    nodes = {}
    edges = {}
    
    for row in db(db.Connection.id_map == map_id).select():
        edges[row.id] = { 'id': row.id, 'valence': row.valence, 'inner_points': row.inner_points, 'from': row.id_first_node, 'to': row.id_second_node }
        
    for node in db(db.Node.id_map == map_id).select():
        nodes[node.id] = { 'id': node.id, 'text': node.name, 'valence': node.valence, 'dim': { 'x': node.x, 'y': node.y, 'width' : node.width, 'height' : node.height }, 'special' : node.special}
        
    mapdata = {
            'mapid' : map_id,
            'nodes' : nodes,
            'edges' : edges,
            'theme' : cam.theme,
            'origin': {'x' : cam.originX, 'y' : cam.originY}
    }
    return dict(success=True, mapdata=mapdata)

@service.json
def set_graph_data(map_id, hash, nodes, edges, origin):
    '''
    Set the graph data based on the incoming node and edge strings.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)
        
    # Delete old nodes and edges
    db(db.Node.id_map == map_id).delete()
    db(db.Connection.id_map == map_id).delete()

    # Parse the input data
    nodes_to_add = json.loads(nodes)
    edges_to_add = json.loads(edges)
    origin = json.loads(origin)
    
    node_ids = {}
    edge_ids = {}
    
    for token, node in nodes_to_add.items():
        dim = node['dim']
        node_id = db.Node.insert(id_map = map_id, valence = node['valence'], x = dim['x'], y = dim['y'], width = dim['width'], height = dim['height'], name = node['text'], special = node['special'])
        node_ids[token] = node_id
    
    for token, edge in edges_to_add.items():
        start = node_ids[edge['from']]
        end = node_ids[edge['to']]
        points = json.dumps(edge['innerPoints'])
        connection_id = db.Connection.insert(id_first_node = start, id_second_node = end, valence = edge['valence'], inner_points = points, id_map = map_id)
        edge_ids[token] = connection_id
    
    db.Map[map_id] = dict(originX = origin['x'], originY = origin['y'])
    db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
    
    return dict(success=True, node_ids=node_ids, edge_ids=edge_ids)        

@service.json
def save_hash(map_id, hash, hashedCommands, thumb, img):

    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)

    commands = json.loads(hashedCommands)

    if 'cmdNode' in commands:
        # Get list of node ids 
        for node_id, properties in commands['cmdNode'].items():
            # List of properties to be updated for this node id
            if 'cmdDeleteDB' in properties:
                # don't care about other property updates - just do a delete
                db_remove_node(map_id, node_id)
            elif 'cmdGraphMove' in properties:
                # update map origin
                newValue = properties['cmdGraphMove']
                db.Map[map_id] = dict(originX = newValue['x'], originY = newValue['y'])
            else:
                # No node deletion in list
                updateDict = {}
                for property, newValue in properties.items():
                    if property == 'cmdValence':
                        updateDict['valence'] = newValue
                    elif property == 'cmdText':
                        updateDict['name'] = newValue
                    elif property == 'cmdDim':
                        updateDict['x'] = newValue['x']
                        updateDict['y'] = newValue['y']
                        updateDict['width'] = newValue['width']
                        updateDict['height'] = newValue['height']
                if len(updateDict) > 0:
                    db.Node[node_id] = updateDict
    
    # Then save any edge changes
    if 'cmdEdge' in commands:
        # Get list of edge ids 
        for edge_id, properties in commands['cmdEdge'].items():
            # List of properties to be updated for this edge id
            if 'cmdDeleteDB' not in properties:
                # No edge deletion in list
                for property, newValue in properties.items():
                    if property == 'cmdValence':
                        db.Connection[edge_id] = dict(valence = newValue)
                    elif property == 'cmdInnerPoints':
                        db.Connection[edge_id] = dict(inner_points = json.dumps(newValue))
            else:   # don't care about other property updates - just do a delete
                db_remove_connection(map_id, edge_id)
    
    db.Map[map_id] = dict(thumbnail = thumb, imgdata = img, date_modified = datetime.utcnow(), modified_by = auth.user.email)
    
    return dict(success=True)
        
@service.json
def add_node(map_id, hash, token, x, y, width, height, name, special):
    '''
    Adds a node to the database.
    Note: By default set valences to 0 for new nodes.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False, token=token)
        
    node_id = db_add_node(map_id, token, x, y, width, height, name, special)
    return dict(success=True, token=token, node_id=node_id)

@service.json
def remove_node(map_id, hash, node_id):
    '''
    Removes a node from the database.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)
    
    db_remove_node(map_id, node_id)
    return dict(success=True)

@service.json
def create_connection(map_id, hash, token, node_one_id, node_two_id, valence, inner_points):
    '''
    Creates a new edge in the CAM.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)
        
    connection_id = db_create_connection(map_id, token, node_one_id, node_two_id, valence, inner_points)                
    return dict(success=True, node_one=node_one_id, node_two=node_two_id, valence=valence, id=connection_id, token=token)

@service.json
def remove_connection(map_id, hash, edge_id):
    '''
    Removes and edge from a given CAM.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)
        
    db_remove_connection(map_id, edge_id)
    return dict(success=True)
        
@service.json
def save_origin(map_id, hash, origin):
    '''
    Saves the CAM origin.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)
        
    origin = json.loads(origin)        
    db.Map[map_id] = dict(originX = origin['x'], originY = origin['y'])
    db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
    
    return dict(success=True)        

@service.json
def save_settings(map_id, hash, theme, settings):
    '''
    Keep track of the user's selected theme.
    '''
    if not can_update(map_id, auth.user.id, hash):
        return dict(success=False)  
        
    settings = json.loads(settings)
    db.Map[map_id] = dict(theme = theme, show_title = settings['showTitle'], fixed_font = settings['fixedFont'])
    return dict(success=True)
 
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
        data.append('<h1>Generated HOTCO code</h1>')
        data.append('<pre>')
        
        group_id = db.Map[map_id].id_group
        conflict_id = db.GroupPerspective[group_id].id_conflict
        
        # Auxiliary function for removing potentially problematic characters
        def remove_restricted(str):
            res = re.sub("[^A-Za-z0-9_\s]", "", str)
            return re.sub("\s+", "_", res)
        
        title = remove_restricted(db.Conflict[conflict_id].title)
        relevant_nodes = db(db.Node.id_map == map_id).select(*['name','valence'])
        relevant_edges = db(db.Connection.id_map == map_id).select(*['id_first_node','id_second_node','valence'])
        
        data.append('(defun ' + title + ' ()\n')

        data.append('\t(setq *problem* \'oj-hot)\n')
        data.append('\t(clear-net)\n')
        data.append('\t(hot)\n')
        
        data.append('\n')
        data.append('\t(data \'( __FILL_THIS_IN ))\n')
        
        data.append('\n')
        data.append('; Propositions:\n')
        for node in relevant_nodes:
            label = node.name.replace('\'', '')
            label = label.replace('\"', '')
            data.append('\t(proposition \'%s \"[%s] node is active.\")\n' % (remove_restricted(node.name), label))
        
        data.append('\n')
        data.append('; Edges:\n')
        
        cached_node_names = {}
        def get_node_name(id):
            if id not in cached_node_names:
                cached_node_names[id] = remove_restricted(db.Node[id].name)
            return cached_node_names[id]
        
        for edge in relevant_edges:
            start = get_node_name(edge.id_first_node)
            end = get_node_name(edge.id_second_node)
            data.append('\t(associate \'%s \'%s %0.2f)\n' % (start, end, edge.valence * 3))
            
        data.append('\n')
        data.append('\t(make-competition)\n')
        data.append('\n')
        
        data.append('; HOTCO\n')
        data.append('\t(valence-unit \'valence-special \'((good 1)))\n')
        data.append('\n')
        
        data.append('; for HOTCO 2, note the evaluation units\n')
        data.append('\t(setf *evaluation-units* *all-units*)\n')
            
        data.append('\n')
        data.append('; Node value associations:\n')  
        for node in relevant_nodes:
            data.append('\t(associate \'%s \'good %0.2f)\n' % (remove_restricted(node.name), node.valence * 3))
        
        data.append('\n')  
        data.append('\t(eval-cohere)\n')
        data.append('\t(pls)\n')
        data.append('\t(show-valence)\n')
        data.append(')')
        
        data.append('</pre>')
            
        return data
    else:
        raise HTTP(400)
        
"""
DATABASE FUNCTIONS
"""
        
def db_add_node(map_id, token, x, y, width, height, name, special):
    '''
    Adds a node to the database.
    Note: By default set valences to 0 for new nodes.
    '''
    node_id = db.Node.insert(id_map = map_id, valence = 0, x = x, y = y, width = width, height = height, name = name, special = special)
    db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email, is_empty = False)
    return node_id

def db_remove_node(map_id, node_id):
    '''
    Removes a node from the database.
    '''
    db(db.Connection.id_first_node == node_id).delete()
    db(db.Connection.id_second_node == node_id).delete()
    del db.Node[node_id]
    
    updated_map_info = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
    if db(db.Node.id_map == map_id).count() > 0:
        updated_map_info['is_empty'] = False
    else:
        updated_map_info['is_empty'] = True
    db.Map[map_id] = updated_map_info

def db_create_connection(map_id, token, node_one_id, node_two_id, valence, inner_points):
    '''
    Creates a new edge in the CAM.
    '''
    connection_id = db.Connection.insert(id_first_node=node_one_id, id_second_node=node_two_id, valence=valence, inner_points=inner_points, id_map=map_id)
    db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)
    return connection_id

def db_remove_connection(map_id, edge_id):
    '''
    Removes and edge from a given CAM.
    '''
    del db.Connection[edge_id]
    db.Map[map_id] = dict(date_modified = datetime.utcnow(), modified_by = auth.user.email)