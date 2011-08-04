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

class YackFilePart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    subparts = models.ManyToManyField("YackFileSubPart")

class YackFileSubPart(models.Model):
    offset = models.IntegerField()
    size = models.IntegerField()
    file = models.FileField(upload_to="/home/fred/yack_sub_parts/")
    sha = models.CharField(max_length=32)    