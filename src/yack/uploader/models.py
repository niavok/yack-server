from django.db import models
import hashlib
from django.core.files.base import ContentFile
import tempfile
import os
from django.core.files import File

class YackPack(models.Model):
    name = models.CharField(max_length=200)
    creation_date = models.DateTimeField('date created')
    
    def __unicode__(self):
        return self.name
    
    
class YackFile(models.Model):
    name = models.CharField(max_length=200)
    descripyion = models.CharField(max_length=800)
    size = models.IntegerField()
    sha = models.CharField(max_length=32)
    upload_state = models.CharField(max_length=32)
    parts = models.ManyToManyField("YackFilePart")
    file = models.FileField(upload_to="yack_files")
    
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
            if part.offset < subpart.offset <= part.offset + part.size or part.offset < subpart.offset+subpart.size <= part.offset + part.size:
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
        for i in range(self.parts.count()-1):
            first = self.parts [i]
            second = self.parts [i+1]
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
                
                tmp_file  = open(tmp_name, "rb")
                
                
                self.file.save(self.sha, File(tmp_file))
                
                self.upload_state = "uploaded"
                self.save()
                
                os.remove(tmp_name)
                
                part.delete()
                
                
                print "File %s succefully uploaded" % self.sha
                  

class YackFilePart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    subparts = models.ManyToManyField("YackFileSubPart")

    def add_subpart(self, subpart):
        
        if self.offset > subpart.offset:
            self.size = self.size + self.offset - subpart.offset
            self.offset =  subpart.offset
            
        if self.offset+self.size < subpart.offset + subpart.size:
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
    
        