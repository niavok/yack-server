from django.template import RequestContext, loader
from django.http import HttpResponse

def index(request):
    t = loader.get_template('uploader/index.html')
    
    c = RequestContext(request, {
    })
    return HttpResponse(t.render(c))
    
    