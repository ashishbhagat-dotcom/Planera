from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Membership, Organization
from .permissions import IsOrgAdminOrOwner, IsOrgMember, IsOrgOwner
from .serializers import (
    InviteMemberSerializer,
    MembershipSerializer,
    MembershipUpdateSerializer,
    WorkspaceSerializer,
)

User = get_user_model()


class WorkspaceViewSet(ModelViewSet):
    serializer_class = WorkspaceSerializer
    lookup_field = 'slug'
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAuthenticated(), IsOrgOwner()]
        if self.action in ('invite',):
            return [IsAuthenticated(), IsOrgAdminOrOwner()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user)

    def perform_create(self, serializer):
        org = serializer.save()
        Membership.objects.create(
            organization=org,
            user=self.request.user,
            role=Membership.OWNER,
        )

    def destroy(self, request, *args, **kwargs):
        org = self.get_object()
        org.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, slug=None):
        org = self.get_object()
        qs = org.memberships.select_related('user').all()
        return Response(MembershipSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'], url_path='members/invite')
    def invite(self, request, slug=None):
        org = self.get_object()
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        user = User.objects.filter(email=email).first()
        if not user:
            from .models import PendingInvite
            from django.core.mail import send_mail
            from django.conf import settings as django_settings
            PendingInvite.objects.update_or_create(
                email=email, organization=org,
                defaults={'role': role, 'invited_by': request.user},
            )
            frontend_url = getattr(django_settings, 'FRONTEND_URL', 'http://localhost:3000')
            signup_url = f'{frontend_url}/register?email={email}'
            send_mail(
                subject=f"You're invited to join {org.name} on Planera",
                message=(
                    f'Hi,\n\n'
                    f'{request.user.full_name or request.user.email} has invited you to join '
                    f'"{org.name}" on Planera.\n\n'
                    f'Create your free account to get started:\n{signup_url}\n\n'
                    f'— The Planera Team'
                ),
                from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@planera.dev'),
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'detail': 'Invitation email sent.'}, status=status.HTTP_200_OK)
        membership, created = Membership.objects.get_or_create(
            organization=org, user=user,
            defaults={'role': role},
        )
        if not created:
            return Response(
                {'error': {'code': 'already_member', 'message': 'User is already a member.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(MembershipSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='pending-invites',
            permission_classes=[IsAuthenticated, IsOrgAdminOrOwner])
    def pending_invites(self, request, slug=None):
        from .models import PendingInvite
        org = self.get_object()
        invites = PendingInvite.objects.filter(organization=org).select_related('invited_by').order_by('-created_at')
        data = [
            {
                'id': str(i.id),
                'email': i.email,
                'role': i.role,
                'invited_by': i.invited_by.full_name or i.invited_by.email,
                'created_at': i.created_at.isoformat(),
            }
            for i in invites
        ]
        return Response(data)

    @action(detail=True, methods=['delete'], url_path='pending-invites/(?P<invite_id>[^/.]+)',
            permission_classes=[IsAuthenticated, IsOrgAdminOrOwner])
    def cancel_invite(self, request, slug=None, invite_id=None):
        from .models import PendingInvite
        org = self.get_object()
        try:
            invite = PendingInvite.objects.get(id=invite_id, organization=org)
            invite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PendingInvite.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class MembershipViewSet(ModelViewSet):
    serializer_class = MembershipSerializer
    http_method_names = ('get', 'patch', 'delete', 'head', 'options')

    def get_permissions(self):
        if self.action in ('partial_update', 'destroy'):
            return [IsAuthenticated(), IsOrgMember(), IsOrgAdminOrOwner()]
        return [IsAuthenticated(), IsOrgMember()]

    def get_queryset(self):
        org = self.request.organization
        if not org:
            return Membership.objects.none()
        return org.memberships.select_related('user').all()

    def partial_update(self, request, *args, **kwargs):
        membership = self.get_object()
        serializer = MembershipUpdateSerializer(membership, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MembershipSerializer(membership).data)
