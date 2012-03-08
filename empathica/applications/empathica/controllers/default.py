def index():
    return dict()

@onerror
def about():
    response.title = "About"
    return dict()

@onerror
def user():
    return dict(form=auth())
    
