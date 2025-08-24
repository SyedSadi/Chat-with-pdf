from django.urls import path
from .views import DocumentUploadView, QAView, ChatHistoryListView, RegisterUserView, LoginUserView, DocumentListView, DocumentDeleteView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<int:document_id>/', DocumentDeleteView.as_view(), name='document-delete'),
    path('qa/', QAView.as_view(), name='qa'),
    path('history/', ChatHistoryListView.as_view(), name='chat-history'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view(), name='login'),
]
