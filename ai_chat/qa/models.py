from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	def __str__(self):
		return self.user.username

class Document(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
	file = models.FileField(upload_to='documents/')
	uploaded_at = models.DateTimeField(auto_now_add=True)
	text_content = models.TextField(blank=True, null=True)
	faiss_index_path = models.CharField(max_length=255, blank=True, null=True)
	chunks = models.JSONField(blank=True, null=True)

	def __str__(self):
		return self.file.name

class ChatHistory(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
	document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chats', null=True, blank=True)
	question = models.TextField()
	answer = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True, db_index=True)

	class Meta:
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['user', '-created_at']),
			models.Index(fields=['document', '-created_at']),
		]

	def __str__(self):
		return f"Q: {self.question[:50]}..."

