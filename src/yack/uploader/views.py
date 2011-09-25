# -*- coding: utf-8 -*-
"""
 Copyright (c) 2011 Frédéric Bertolus.

 This file is part of Yack.
 Yack is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License as published by the
 Free Software Foundation, either version 3 of the License, or (at your
 option) any later version.

 Yack is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for
 more details.
 You should have received a copy of the GNU Affero General Public License along
 with Yack. If not, see http://www.gnu.org/licenses/.
"""

from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import Http404
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.core.context_processors import csrf
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import csrf_exempt
from django.core.servers.basehttp import FileWrapper
import os
import json

from models import YackFile
from models import YackFileSubPart
from models import YackFilePart
from models import YackUser

import urllib


def index(request):
    t = loader.get_template('uploader/index.html')
    
    c = RequestContext(request, {
    })
    return HttpResponse(t.render(c))


def send_file(request):
    pk = request.GET.get('pk','')
    
    try:
        yackFile = YackFile.objects.get(pk=pk)
    except ObjectDoesNotExist:
        raise Http404
    
                                    
    wrapper = FileWrapper(yackFile.file.file)
    response = HttpResponse(wrapper, content_type='application/binary')
    response['Content-Disposition'] = 'inline; filename='+yackFile.name
    response['Content-Length'] = yackFile.file.size
    return response


#TODO: make csrf works
@csrf_exempt
def command(request):
    cmd = request.GET.get('cmd','')
    format = request.GET.get('format','')
    
    if format == 'xml':
        mimetype = 'application/xml'
    if format == 'json':
        mimetype = 'application/javascript'
  
    if cmd == 'getCsrfToken':
        c = {}
        c.update(csrf(request))
        return HttpResponse('[{"csrf_token": "%s"}]' % c["csrf_token"] ,mimetype)
    
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
            yackFile.check_finished()
            print 'The file already exist'
        except ObjectDoesNotExist:
            print 'The file doesn\'t exist'
        
            yackFile = YackFile()
            yackFile.upload_state="uploading"
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
        
        
        
        data = json.dumps([{'upload_state': yackFile.upload_state, 'size': yackFile.size, 'sha': yackFile.sha, 'parts': [ {'size' : part.size, 'offset' : part.offset} for part in yackFile.parts.all()] }])
        
        return HttpResponse(data,mimetype)
        
    if cmd == 'sendFilePart':
        
        pk = request.GET.get('pk','')
        sha = request.GET.get('sha','')
        size = int(request.GET.get('size',''))
        offset = int(request.GET.get('offset',''))
        data =  request.raw_post_data
        
        try:
            yackFile = YackFile.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise Http404
        
        
        yackFile.add_sub_part(offset, size, sha, data)
        
        
        
        data = json.dumps([{'upload_state': yackFile.upload_state, 'size': yackFile.size, 'sha': yackFile.sha, 'parts': [ {'size' : part.size, 'offset' : part.offset} for part in yackFile.parts.all()] }])
        
        return HttpResponse(data,mimetype)
    
    if cmd == 'getFileList':
        
        files = YackFile.objects.all()
        
        data = json.dumps([{'id': yackFile.pk,'size': yackFile.size, 'progress': yackFile.get_progress(), 'name': yackFile.name , 'link': "/file?pk="+str(yackFile.pk) }  for yackFile in files ])
        return HttpResponse(data,mimetype)
    
    if cmd == 'getFileLink':
        
        pk = request.GET.get('pk','')
        try:
            yackFile = YackFile.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise Http404
        
        data = json.dumps([{'id': yackFile.pk,'size': yackFile.size, 'name': yackFile.name , 'link': "/file?pk="+str(yackFile.pk) }])
        return HttpResponse(data,mimetype)
        
    raise Http404


def login(request):
    
    method = request.GET.get('method','')
    
    if method == 'check':
        token = request.GET.get('token','');
        id = request.GET.get('id','');
        
        try:
            user = YackUser.objects.get(auth_token=token, pk=id)
            data = json.dumps([{'status':  True, 'id': user.pk, 'name': user.get_display_name(), 'token': user.get_auth_token()}])
        except ObjectDoesNotExist:
            data = json.dumps([{'status':  False}])
    
        return HttpResponse(data,'application/javascript')
        
    if method == 'browserid':
        token = request.GET.get('token','');
        
        data = urllib.urlencode({'assertion': token, 'audience': '127.0.0.1:8000'})
        u = urllib.urlopen('https://browserid.org/verify', data)
        print u
        result = json.loads(u.read())
        
        print result
        
        if result['status'] == "okay":
            email  = result['email'] 
            try:
                user = YackUser.objects.get(email=email)
            except ObjectDoesNotExist:
                user = YackUser()
                user.email = email
                user.quota = 0
                user.name = ""
                # This save the object
                user.generate_auth_token()
                
            data = json.dumps([{'status':  True, 'id': user.pk, 'name': user.get_display_name(), 'token': user.get_auth_token()}])
        else:
            data = json.dumps([{'status':  False}])
    
        
        return HttpResponse(data,'application/javascript')
    
    raise Http404
    
    #assertion: The encoded assertion
    #audience:
    
