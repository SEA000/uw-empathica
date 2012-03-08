"""
BEGINNING OF DBPY FILE
"""
import uuid
import os
import sys
import traceback
import gluon.restricted
import urllib
from gluon.settings import settings
from gluon.tools import *
from datetime import datetime

# TODO: fill this out
primary_support_email = "e_solodkin@hotmail.com"
secondary_support_email = "pthagard@artsservices.uwaterloo.ca"

mail = Mail()

# if running on Google App Engine
if settings.web2py_runtime_gae:
    from gluon.contrib.login_methods.gae_google_account import GaeGoogleAccount
    from gluon.contrib.gql import *
    # connect to Google BigTable
    db = DAL('gae')
    # and store sessions there
    session.connect(request, response, db=db)

    mail.settings.server = 'gae'
    mail.settings.sender = 'noreply@uw-empathica.appspotmail.com'
    mail.settings.login = None
else:
    # if not, use SQLite or other DB
    db = DAL('sqlite://storage.sqlite', folder = request.folder + '/../admin/databases')

auth = Auth(globals(), db)

if settings.web2py_runtime_gae:
    auth.settings.login_form=GaeGoogleAccount()

auth.settings.mailer = 'gae'
auth.define_tables()

# redirect after login
auth.settings.login_next = URL('conflict', 'manage')
auth.settings.logout_next = URL('default', 'index')

# TODO: May need to define other redirects
# messages
auth.messages.logged_in = 'Signed in'
auth.messages.logged_out = 'Signed out'

# Disable auth_event logging
auth.messages.register_log = None
auth.messages.login_log = None
auth.messages.logout_log = None
auth.messages.profile_log = None
auth.messages.verify_email_log = None
auth.messages.retrieve_username_log = None
auth.messages.retrieve_password_log = None
auth.messages.reset_password_log = None
auth.messages.change_password_log = None
auth.messages.add_group_log = None
auth.messages.del_group_log = None
auth.messages.add_membership_log = None
auth.messages.del_membership_log = None
auth.messages.has_membership_log = None
auth.messages.add_permission_log = None
auth.messages.del_permission_log = None
auth.messages.has_permission_log = None

service = Service(globals())

#### current_user_id = (auth.user and auth.user.id) or 0

# Field Requirements
# (strings should match /static/js/jquery.validationEngine-en.js)
__NOT_EMPTY = IS_NOT_EMPTY(error_message=T("* This field is required"))
__MAX40 = IS_LENGTH(maxsize=40, error_message=T("* Maximum 40 characters allowed"))
__MAX140 = IS_LENGTH(maxsize=140, error_message=T("* Maximum 140 characters allowed"))
__MAX2K = IS_LENGTH(maxsize=2000, error_message=T("* Maximum 2,000 characters allowed"))

# Table Definitions
db.define_table('Conflict',
        Field('title', 'string', requires=[__NOT_EMPTY, __MAX40]),
        Field('description', 'text', requires=[__MAX2K]),
        Field('open_conflict', 'boolean',
            default=True,
            writable=False, readable=False),
        Field('date_created', 'datetime',
            default=datetime.utcnow(),
            writable=False, readable=False),
        Field('date_modified', 'datetime',
            default=datetime.utcnow(),
            writable=False, readable=False),
        Field('id_creator', db.auth_user,
            writable=False, readable=False),
        Field('authorized_users', 'list:reference auth_user',
            writable=False, readable=False))

db.define_table('GroupPerspective',
        Field('name', 'string', requires=[__NOT_EMPTY, __MAX40]),
        Field('description', 'string', requires = [__MAX2K]),
        Field('id_conflict', db.Conflict,
            writable=False, readable=False))

# Temporary fields used to generate an SQLFORM
# (workaround due to limitation with duplicate field names)
db.define_table('GroupTempInput',
        Field('name1', 'string', requires=db.GroupPerspective.name.requires),
        Field('desc1', 'text', requires=db.GroupPerspective.description.requires),
        Field('users1', 'string'),
        Field('name2', 'string', requires=db.GroupPerspective.name.requires),
        Field('desc2', 'text', requires=db.GroupPerspective.description.requires),
        Field('users2', 'string'))

db.define_table('Map',
        Field('title', 'string'),
        Field('id_group', db.GroupPerspective),
        Field('id_secondary', db.GroupPerspective),
        Field('date_modified', 'datetime', default = datetime.utcnow() ),
        Field('modified_by', 'string'),
        Field('is_empty', 'boolean', default = True, notnull=True),
        Field('thumbnail', 'blob'),
        Field('imgdata', 'blob'),
        Field('show_title', 'string', default = "true"),
        Field('fixed_font', 'string', default = "false"),
        Field('theme', 'string', default = "Default Theme"),
        Field('originX', 'double', default = 0),
        Field('originY', 'double', default = 0),
        Field('save_string', 'text'))

db.define_table('Node',
        Field('name', 'string'),
        Field('valence', 'double'),
        Field('x', 'double'),
        Field('y', 'double'),
        Field('width', 'double'),
        Field('height', 'double'),
        Field('id_map', db.Map),
        Field('special', 'string'))

db.define_table('NodeMapping',
        Field('node_one', db.Node),
        Field('map_one' , db.Map),
        Field('node_two', db.Node),
        Field('map_two' , db.Map),
        Field('identical', 'boolean'))

db.define_table('Connection',
        Field('id_first_node', db.Node),
        Field('id_second_node', db.Node),
        Field('valence', 'double'),
        Field('inner_points', 'string'),
        Field('id_map', db.Map))

#TODO: Decorate for SQLFORM
db.define_table('Invite',
        Field('invitee_email', 'string', label="Email", notnull=True),
        Field('id_user', db.auth_user, writable=False),
        Field('claimed_email', 'string'),
        Field('proxy_token', 'string'),
        Field('id_group', db.GroupPerspective),
        Field('inviter_email', 'string'),
        Field('invite_token', 'string', default = str(uuid.uuid1())),
        Field('date_invited', 'date', default = request.now),
        Field('email_sent', 'boolean', default = False))

#todo: expand this
db.Invite.invitee_email.requires = [
    IS_NOT_EMPTY(error_message=T("MSG TBD"))
]

db.Invite.id_group.requires = [
        IS_IN_DB(db, db.GroupPerspective.id)
]

# Global error handler
def onerror(function):
  def __onerror__(*a,**b):
    try:
        return function(*a,**b)
    except HTTP, e:
        # Todo handle these gracefully too
        raise e
    except Exception, e:
        tb = traceback.extract_tb(sys.exc_info()[2])
        last = None
        msg = ''
        if len(tb) > 1:
            last = tb[-1]
            if len(last) > 2:
                msg = ' '.join([str(v) for v in last[1:]])
        ticket = gluon.restricted.RestrictedError(function.__name__).log(request)
        redirect(URL(r=request, c='default', f='index', vars={'error':ticket, 'exception' : e, 'trace': msg}))
  return __onerror__
 
# Composes the error report message into a mailto link
def get_report_link(exc, trace):
    s = 'mailto:' + primary_support_email 
    s += '?cc=' + secondary_support_email
    s += '&subject=Empathica Error Report'
    s += '&body='
    s += 'EMPATHICA Error Report: %0d'
    s += '  -----------------------------------------------%0d'
    s += '    Timestamp: ' + urllib.quote(datetime.now().strftime("%Y-%m-%d %H-%M")) + '%0d'
    s += "    Error: " + urllib.quote(exc) + '%0d'
    s += '    Trace: ' + urllib.quote(trace) + '%0d'
    s += '  -----------------------------------------------%0d'
    s += 'Thank you for submitting this report!'
    return s
    