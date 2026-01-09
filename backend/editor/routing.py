from django.urls import re_path
from .consumers import DocumentConsumer

websocket_urlpatterns = [
    re_path(r'ws/documents/(?P<doc_id>\d+)/$', DocumentConsumer.as_asgi()),
]
