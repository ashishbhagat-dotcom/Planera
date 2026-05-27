from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.permissions import OrgScopedPermission
from organizations.permissions import IsOrgMember
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, GenericViewSet):
    permission_classes = (IsAuthenticated, OrgScopedPermission, IsOrgMember)
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            organization=self.request.organization,
        ).order_by('-created_at')[:50]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        unread_count = Notification.objects.filter(
            recipient=request.user,
            organization=request.organization,
            is_read=False,
        ).count()
        return Response({
            'results': serializer.data,
            'unread_count': unread_count,
        })

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        """Mark all unread notifications as read for current user + org."""
        Notification.objects.filter(
            recipient=request.user,
            organization=request.organization,
            is_read=False,
        ).update(is_read=True)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_one_read(self, request, pk=None):
        """Mark a single notification as read."""
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif).data)
