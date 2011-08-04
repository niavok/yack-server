from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import Http404
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist

from models import YackFile

def index(request):
    t = loader.get_template('uploader/index.html')
    
    c = RequestContext(request, {
    })
    return HttpResponse(t.render(c))
    
def command(request):
    cmd = request.GET.get('cmd','')
    format = request.GET.get('format','')
    
    if format == 'xml':
            mimetype = 'application/xml'
    if format == 'json':
            mimetype = 'application/javascript'
  
    
    if cmd == 'createFile':
        # The client ask to create a new file
        name = request.GET.get('name','')
        sha = request.GET.get('sha','')
        size = int(request.GET.get('size',''))
        
        print name
        print sha
        print size
        
        try:
            yackFile = YackFile.objects.get(sha=sha)
            print 'The file already exist'
        except ObjectDoesNotExist:
            print 'The file doesn\'t exist'
        
            yackFile = YackFile()
            yackFile.name = name
            yackFile.size = size
            yackFile.sha = sha
            yackFile.save()
            
        data = serializers.serialize(format, [yackFile,], fields=('pk'))
        return HttpResponse(data,mimetype)

    if cmd == 'getFileInfo':
        pk = request.GET.get('pk','')
        
        try:
            yackFile = YackFile.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise Http404
        
        data = serializers.serialize(format, [yackFile,], fields=('pk', 'sha', 'size', 'parts'))
        return HttpResponse(data,mimetype)
        
    raise Http404
