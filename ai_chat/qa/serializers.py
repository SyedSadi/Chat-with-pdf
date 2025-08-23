from rest_framework import serializers
from .models import Document, ChatHistory


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'file', 'uploaded_at', 'text_content']

class ChatHistorySerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    class Meta:
        model = ChatHistory
        fields = ['id', 'user', 'document', 'question', 'answer', 'created_at']

# For Q&A requests
class QARequestSerializer(serializers.Serializer):
    document_id = serializers.IntegerField(required=False, allow_null=True)
    question = serializers.CharField()
