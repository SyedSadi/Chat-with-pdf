from django.contrib.auth.models import User
from django.db import models

# Extend user model for future profile info
class UserProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	# Add more fields as needed (e.g., avatar, bio)
	def __str__(self):
		return self.user.username
from django.db import models

class Document(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)  # Made optional temporarily
	file = models.FileField(upload_to='documents/')
	# name field removed
	uploaded_at = models.DateTimeField(auto_now_add=True)
	text_content = models.TextField(blank=True, null=True)  # Extracted text from file
	faiss_index_path = models.CharField(max_length=255, blank=True, null=True)  # Path to FAISS index file
	chunks = models.JSONField(blank=True, null=True)  # List of text chunks

	def __str__(self):
		return self.file.name

class ChatHistory(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
	document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chats', null=True, blank=True)  # Made optional
	question = models.TextField()
	answer = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Added index for performance

	class Meta:
		ordering = ['-created_at']  # Default ordering
		indexes = [
			models.Index(fields=['user', '-created_at']),  # Compound index for user queries
			models.Index(fields=['document', '-created_at']),  # Compound index for document queries
		]

	def __str__(self):
		return f"Q: {self.question[:50]}..."

# Create your models here.
