import urllib

def index():
    if settings.web2py_runtime_gae:
        return dict()
        
    try:
        opener = urllib.FancyURLopener({})
        f = opener.open(current_version_url)
        data = f.read()
        
        if len(data) > 1:
            version = float(data)
            if empathica_version < version:
                uploadfolder = os.path.join(request.folder, 'uploads')
                urllib.urlretrieve(update_donwload_url, uploadfolder + os.sep + 'update.w2p')
                session.flash=T("Empathica update was successfully donwloaded and will be installed on next restart.")
    except:
        pass
    return dict()
    
@onerror
def about():
    response.title = "About"
    return dict()

@onerror
def user():
    return dict(form=auth())
    
