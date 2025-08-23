from django.urls import path
from .views import DocumentUploadView, QAView, ChatHistoryListView, RegisterUserView, LoginUserView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('qa/', QAView.as_view(), name='qa'),
    path('history/', ChatHistoryListView.as_view(), name='chat-history'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view(), name='login'),
]
