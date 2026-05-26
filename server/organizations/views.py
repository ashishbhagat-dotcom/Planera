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
            return Response(
                {'error': {'code': 'not_found', 'message': 'No user with that email.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
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
