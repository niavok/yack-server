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

from django.db import models
import hashlib
from django.core.files.base import ContentFile
import tempfile
import os
from django.core.files import File
from django.utils.datetime_safe import datetime
from datetime import timedelta
import string
import random

class YackPack(models.Model):
    name = models.CharField(max_length=200)
    creation_date = models.DateTimeField('date created')
    
    children_packs = models.ManyToManyField("YackPack")
    
    # Permissions
    owner = models.ForeignKey("YackUser", related_name="pack_owner")
    allowedUsers = models.ManyToManyField("YackUser")
    allowedGroups = models.ManyToManyField("YackUserGroup")
    isPublic = models.BooleanField()
    
    def __unicode__(self):
        return self.name
    
    
class YackFile(models.Model):
    name = models.CharField(max_length=200)
    creation_date = models.DateTimeField('date created')
        
    size = models.IntegerField()
    sha = models.CharField(max_length=32)
    upload_state = models.CharField(max_length=32)
    parts = models.ManyToManyField("YackFilePart")
    file = models.FileField(upload_to="yack_files")

    # Permissions
    owner = models.ForeignKey("YackUser", related_name="file_owner")
    allowedUsers = models.ManyToManyField("YackUser")
    allowedGroups = models.ManyToManyField("YackUserGroup")
    isPublic = models.BooleanField()
    
    # Metadatas
    description = models.CharField(max_length=800)
    mime = models.CharField(max_length=100)    
    auto_mime = models.BooleanField(default=True)    
    
    def __unicode__(self):
        return self.name
    
    def add_sub_part(self, offset, size, sha, data):
        
        if self.upload_state == "uploaded":
            return
        
        #check integrity
        s = hashlib.sha1()
        s.update(data)
        if s.hexdigest() != sha:
            print "Integrity check of new part fail: %s excepted but %s received." % (s.hexdigest(), sha)
            return 
        
        subpart = YackFileSubPart()
        subpart.offset = offset
        subpart.size = size
        subpart.sha = sha
        fileData = ContentFile(data)
        subpart.file.save(sha, fileData)
        subpart.save()
        self.add_sub_part_in_part(subpart)
        self.compact_parts()
        self.check_finished()
        
    def add_sub_part_in_part(self, subpart):
        
        for part in self.parts.all():
            if part.offset < subpart.offset <= part.offset + part.size or part.offset < subpart.offset + subpart.size <= part.offset + part.size:
                part.add_subpart(subpart)
                self.save()
                return
        
        #Create new part
        part = YackFilePart()
        part.offset = subpart.offset
        part.size = subpart.size
        part.save()
        part.subparts.add(subpart)
        part.save()
        self.parts.add(part)
        self.save()
        
    def compact_parts(self):
        for i in range(self.parts.count() - 1):
            first = self.parts [i]
            second = self.parts [i + 1]
            if first.offset + first.size >= second.offset:
                self.merge_parts(first, second)
                self.compact_parts()
                return
    
    def merge_parts(self, first, second):
        
        for subpart in second.subparts:
            first.supbarts.add(subpart)
        
        first.size = second.offset - first.offset + second.size
        
        first.save()
        second.delete()
        
    def check_finished(self):
        if self.upload_state == "uploaded":
            return
        
        if self.parts.count() == 1:
            part = self.parts.all()[0]
            if part.offset == 0 and part.size == self.size:
                #generate file
                tmp, tmp_name = tempfile.mkstemp(suffix=".tmp", prefix="yack_")
                tmp_file = os.fdopen(tmp, "wb")
                offset = 0
                s = hashlib.sha1()
                print tmp_name
                while offset < self.size:
                    subpart = part.get_subpart_by_offset(offset)
                    data = subpart.file.read()
                    s.update(data)
                    tmp_file.write(data)
                    offset += subpart.size
                
                tmp_file.close()
                
                if s.hexdigest() != self.sha:
                    print "Integrity check of whole file fail: %s excepted but %s received." % (s.hexdigest(), self.sha)
                    return 
                
                tmp_file = open(tmp_name, "rb")
                
                
                self.file.save(self.sha, File(tmp_file))
                
                self.upload_state = "uploaded"
                self.save()
                
                os.remove(tmp_name)
                
                part.delete()
                
                
                print "File %s succefully uploaded" % self.sha
    
    def get_progress(self):
        if self.upload_state == "uploaded":
            return 1;
        
        uploaded = 0;
        
        for part in self.parts.all():
            uploaded += part.size
        
        return float(uploaded)/self.size 

class YackFilePart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    subparts = models.ManyToManyField("YackFileSubPart")

    def add_subpart(self, subpart):
        
        if self.offset > subpart.offset:
            self.size = self.size + self.offset - subpart.offset
            self.offset = subpart.offset
            
        if self.offset + self.size < subpart.offset + subpart.size:
            self.size = subpart.offset - self.offset + subpart.size
            
        self.subparts.add(subpart)
        self.save()
        
    def get_subpart_by_offset(self, offset):
        for subpart in self.subparts.all():
            if subpart.offset == offset:
                return subpart
            
    def delete(self):
        print "YackFilePart"
        for subpart in self.subparts.all():
            subpart.delete();
        super(YackFilePart, self).delete()

class YackFileSubPart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    file = models.FileField(upload_to="yack_sub_parts")
    sha = models.CharField(max_length=32)
    
    def delete(self):
        print "YackFileSubPart"
        os.remove(self.file.path)
        super(YackFileSubPart, self).delete()
    
class YackUser(models.Model):
    email = models.CharField(max_length=256)
    creation_date = models.DateTimeField('date created')
    
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=32)
    quota = models.IntegerField()
    auth_token = models.CharField(max_length=32)
    auth_token_validity = models.DateTimeField()
    is_admin = models.BooleanField()
    
    pack = models.ForeignKey("YackPack")
    
    def get_auth_token(self):
        if not self.auth_token:
            self.generate_auth_token()
        elif self.auth_token_validity < datetime.now():
            self.generate_auth_token()

        return self.auth_token

    def generate_auth_token(self):
        char_set = string.ascii_letters + string.digits
        self.auth_token = ''.join(random.sample(char_set,32))
        print self.auth_token
        self.auth_token_validity = datetime.now() + timedelta(days=15)
        self.save()
        
    def get_display_name(self):
        if not self.name:
            return self.email
        return self.name
    
    def create_user(cls, email): #@NoSelf
        user = YackUser()
        user.email = email
        user.quota = 0
        user.name = ""
        user.code = ""
        user.is_admin = False; 
        
        #Create root YackPack
        pack = YackPack()
        pack.owner = user;
        pack.is_public = True;
        pack.save()
        
        user.pack = pack;
        
        #Create fisrt admin
        if user.id == 1:
            user.is_admin = True;
            user.quota = -1;
        
        # This save the object
        user.generate_auth_token()
        
        
            

class YackUserGroup(models.Model):
    name = models.CharField(max_length=32)
    public = models.BooleanField()
    owner = models.ForeignKey("YackUser", related_name="user_group_owner")
    childUsers = models.ManyToManyField("YackUser")
    childGroups = models.ManyToManyField("YackUserGroup")









