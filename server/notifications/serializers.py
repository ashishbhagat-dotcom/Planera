from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'data', 'is_read', 'created_at')
        read_only_fields = ('id', 'type', 'title', 'data', 'created_at')
