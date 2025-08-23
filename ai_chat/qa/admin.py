
from django.contrib import admin
from .models import Document, ChatHistory, UserProfile
from django.contrib import admin

admin.site.register(UserProfile)
admin.site.register(Document)
admin.site.register(ChatHistory)



# Register your models here.
