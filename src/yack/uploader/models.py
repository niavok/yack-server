from django.db import models

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
    parts = models.ManyToManyField("YackFilePart")
    
    
    def __unicode__(self):
        return self.name
    
    def add_sub_part(self, subpart):
        
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

class YackFileSubPart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    file = models.FileField(upload_to="yack_sub_parts")
    sha = models.CharField(max_length=32)    