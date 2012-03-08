import urllib

def index():
    if settings.web2py_runtime_gae:
        return dict(need_to_update=False)
        
    try:
        opener = urllib.FancyURLopener({})
        f = opener.open(current_version_url)
        data = f.read()
        
        if len(data) > 1:
            version = float(data)
            if empathica_version < version:
                return dict(need_to_update=True, version=version)
    except:
        pass
        
    return dict(need_to_update=False)

@onerror
def update():    
    if settings.web2py_runtime_gae:
        redirect(request.wsgi.environ['HTTP_REFERER'])
    
    try:
        uploadfolder = os.path.join(request.folder, 'uploads')
        urllib.urlretrieve(update_donwload_url, uploadfolder + os.sep + 'update.w2p')
        session.flash=T("Update was successfully donwloaded and will be installed on next restart.")
        redirect(request.wsgi.environ['HTTP_REFERER'])
    except Exception, e:
        session.flash=T("The update cannot be downloaded at this time! Please, try again later.")
        redirect(request.wsgi.environ['HTTP_REFERER'])
    
@onerror
def about():
    response.title = "About"
    return dict()

@onerror
def user():
    return dict(form=auth())
    
