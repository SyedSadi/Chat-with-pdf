
from django.contrib import admin
from .models import Document, ChatHistory, UserProfile

admin.site.register(UserProfile)
admin.site.register(Document)
admin.site.register(ChatHistory)
