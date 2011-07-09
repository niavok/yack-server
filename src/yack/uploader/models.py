from django.db import models

class YackPack(models.Model):
    name = models.CharField(max_length=200)
    creation_date = models.DateTimeField('date created')
    
    def __unicode__(self):
        return self.name
    
    
class YackFile(models.Model):
    name = models.CharField(max_length=200)
    descritpion = models.CharField(max_length=800)
    size = models.IntegerField()
    
    def __unicode__(self):
        return self.name