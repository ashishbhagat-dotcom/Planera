from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/board/(?P<project_key>[A-Z0-9]+)/$', consumers.BoardConsumer.as_asgi()),
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
