from rest_framework import serializers
from .models import Document, ChatHistory


class DocumentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'file', 'filename', 'uploaded_at', 'text_content']
    
    def get_filename(self, obj):
        return obj.file.name if obj.file else 'Unknown'

class ChatHistorySerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    class Meta:
        model = ChatHistory
        fields = ['id', 'user', 'document', 'question', 'answer', 'created_at']

class QARequestSerializer(serializers.Serializer):
    document_id = serializers.IntegerField(required=False, allow_null=True)
    question = serializers.CharField()
