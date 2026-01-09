import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import UserColor


class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['doc_id']
        self.room_group_name = f'document_{self.document_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.user = self.scope.get("user")
        await self.accept()

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'username': self.user.username
                }
            )
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    @database_sync_to_async
    def get_user_color(self, user):
        try:
            return UserColor.objects.get(user=user).color
        except UserColor.DoesNotExist:
            return "#000000"

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type") 
        
        color = "#000000"
        username = "anonymous"

        if self.user and self.user.is_authenticated:
            username = self.user.username
            # Aici folosim functia helper cu 'await'
            color = await self.get_user_color(self.user)

        response = {
            'type': 'document_update',
            'msg_type': msg_type,
            'username': username,
            'color': color,
            'sender_channel_name': self.channel_name
        }

        if msg_type == 'content_change':
            response['content'] = data.get("content")
        
        elif msg_type == 'cursor_change':
            response['cursor'] = data.get("cursor") 

        await self.channel_layer.group_send(
            self.room_group_name,
            response
        )


    async def document_update(self, event):
        if self.channel_name == event.get('sender_channel_name'):
            return

        await self.send(text_data=json.dumps({
            'type': event.get('msg_type'),
            'content': event.get('content'),
            'username': event['username'],
            'color': event['color'],
            'cursor': event.get('cursor')
        }))

    async def user_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'username': event['username']
        }))