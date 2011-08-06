from uploader.models import YackPack
from uploader.models import YackFile
from uploader.models import YackFilePart
from uploader.models import YackFileSubPart
from django.contrib import admin

admin.site.register(YackPack)
admin.site.register(YackFile)
admin.site.register(YackFilePart)
admin.site.register(YackFileSubPart)