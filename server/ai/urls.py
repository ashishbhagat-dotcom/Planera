from django.urls import path
from .views import AISuggestView

urlpatterns = [
    path('suggest/', AISuggestView.as_view(), name='ai-suggest'),
]
