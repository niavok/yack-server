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
from yack.uploader.tools import YackTools


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
    auth_token = request.GET.get('auth_token','')
    auth_id = request.GET.get('auth_id','')
    mimetype = 'application/javascript'
    auth_user = None
    
    if auth_token and auth_id:
        # Try to authenticate
        try:
            auth_user = YackFile.objects.get(pk=auth_id, auth_token=auth_token)
        except ObjectDoesNotExist:
            # Invalid token or user
            data = json.dumps([{'error': 'invalid auth token or id'}])
            return HttpResponse(data, mimetype)
    
    if cmd == 'getCsrfToken':
        c = {}
        c.update(csrf(request))
        return HttpResponse('[{"csrf_token": "%s"}]' % c["csrf_token"] ,mimetype)
    
    if cmd == 'createFile':
        if not auth_user:
            data = json.dumps([{'error': 'you must be logged to create a file'}])
            return HttpResponse(data, mimetype)
        
        # The client ask to create a new file
        name = request.GET.get('name','')
        sha = request.GET.get('sha','')
        size = int(request.GET.get('size',''))
        
        try:
            yackFile = YackFile.objects.get(sha=sha)
            yackFile.check_finished()
            
            if not yackFile.can_write(auth_user):
                data = json.dumps([{'error': 'you don\'t have the right to write the file'}])
                return HttpResponse(data, mimetype)
            
            print 'The file already exist'
        except ObjectDoesNotExist:
            print 'The file doesn\'t exist'
        
            yackFile = YackFile()
            yackFile.upload_state="uploading"
            yackFile.name = name
            yackFile.owner = auth_user
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
        
        if not yackFile.can_read(auth_user):
            data = json.dumps([{'error': 'you don\'t have the right to read the file'}])
            return HttpResponse(data, mimetype)
        
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
        
        if not yackFile.can_write(auth_user):
            data = json.dumps([{'error': 'you don\'t have the right to write the file'}])
            return HttpResponse(data, mimetype)
        
        yackFile.add_sub_part(offset, size, sha, data)
        
        
        
        data = json.dumps([{'upload_state': yackFile.upload_state, 'size': yackFile.size, 'sha': yackFile.sha, 'parts': [ {'size' : part.size, 'offset' : part.offset} for part in yackFile.parts.all()] }])
        
        return HttpResponse(data,mimetype)
    
    if cmd == 'getFileList':
        
        path = request.GET.get('path','')
        
        pack = YackTools.parse_pack_path(path)
        
        if not pack.can_read(auth_user):
            data = json.dumps([{'error': 'you don\'t have the right to read the pack'}])
            return HttpResponse(data, mimetype)
        
        files = YackFile.objects.all()
        
        data = json.dumps([{'id': yackFile.pk,'size': yackFile.size, 'progress': yackFile.get_progress(), 'name': yackFile.name , 'link': "/file?pk="+str(yackFile.pk), 'can_write': yackFile.can_write(auth_user) }  for yackFile in files  if yackFile.can_read(auth_user) ])
        return HttpResponse(data,mimetype)
    
    if cmd == 'getFileLink':
        
        pk = request.GET.get('pk','')
        try:
            yackFile = YackFile.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise Http404
        
        if not pack.can_read(auth_user):
            data = json.dumps([{'error': 'you don\'t have the right to read the pack'}])
            return HttpResponse(data, mimetype)
        
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
                user = YackUser.create_user(email)
                
            data = json.dumps([{'status':  True, 'id': user.pk, 'name': user.get_display_name(), 'token': user.get_auth_token()}])
        else:
            data = json.dumps([{'status':  False}])
    
        
        return HttpResponse(data,'application/javascript')
    
    raise Http404
    
    #assertion: The encoded assertion
    #audience:
    
