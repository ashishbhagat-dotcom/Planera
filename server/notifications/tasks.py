from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer


@shared_task(name='notifications.create_and_push_notification')
def create_and_push_notification(recipient_id: str, org_id: str, notif_type: str, title: str, data: dict):
    from django.contrib.auth import get_user_model
    from organizations.models import Organization
    from .models import Notification

    User = get_user_model()
    try:
        recipient = User.objects.get(pk=recipient_id)
        org = Organization.objects.get(pk=org_id)
    except (User.DoesNotExist, Organization.DoesNotExist):
        return

    notification = Notification.objects.create(
        recipient=recipient,
        organization=org,
        type=notif_type,
        title=title,
        data=data,
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{recipient_id}',
        {
            'type': 'notification.new',
            'data': {
                'type': 'notification.new',
                'id': str(notification.id),
                'notif_type': notif_type,
                'title': title,
                'data': data,
                'created_at': notification.created_at.isoformat(),
            },
        },
    )
