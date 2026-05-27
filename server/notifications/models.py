from django.conf import settings
from django.db import models

from core.models import BaseModel


class Notification(BaseModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    data = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['recipient', 'is_read', '-created_at'],
                name='notif_recipient_unread_idx',
            ),
        ]

    def __str__(self):
        return f'{self.type} → {self.recipient.email}'
