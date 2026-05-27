from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


@database_sync_to_async
def get_project_and_check_membership(project_key, user):
    from projects.models import Project
    from organizations.models import Membership
    # key is unique per org; find a project with this key that the user can access
    project = (
        Project.objects
        .select_related('organization')
        .filter(
            key=project_key,
            organization__memberships__user=user,
        )
        .first()
    )
    return project


class BoardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.project_key = self.scope['url_route']['kwargs']['project_key']
        self.user = self.scope.get('user')
        self.group_name = f'board_{self.project_key}'

        project = await get_project_and_check_membership(self.project_key, self.user)
        if not project:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        # Clients don't send anything meaningful yet — ignore
        pass

    async def board_event(self, event):
        """Forwards group messages to the WebSocket client."""
        await self.send_json(event['data'])


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        self.group_name = f'notifications_{self.user.id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_new(self, event):
        await self.send_json(event['data'])
