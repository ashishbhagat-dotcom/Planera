from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.permissions import OrgScopedPermission
from organizations.permissions import IsOrgAdminOrOwner, IsOrgMember
from .models import Cycle, Project
from .permissions import ProjectPermission
from .serializers import (
    CycleCreateSerializer,
    CycleDetailSerializer,
    CycleSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
)


class ProjectViewSet(ModelViewSet):
    permission_classes = (OrgScopedPermission, ProjectPermission)
    lookup_field = 'key'
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_queryset(self):
        org = self.request.organization
        if not org:
            return Project.objects.none()
        return (
            Project.objects.filter(organization=org)
            .select_related('lead')
            .order_by('name')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        if self.action in ('retrieve', 'partial_update'):
            return ProjectDetailSerializer
        return ProjectListSerializer

    def get_object(self):
        # Key is stored uppercase; normalise lookup
        self.kwargs['key'] = self.kwargs['key'].upper()
        return super().get_object()

    def create(self, request, *args, **kwargs):
        if not request.organization:
            return Response(
                {'error': {'code': 'no_workspace', 'message': 'X-Organization-Slug header required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectDetailSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(ProjectDetailSerializer(instance).data)


class CycleViewSet(ModelViewSet):
    permission_classes = (OrgScopedPermission, IsOrgMember)
    pagination_class = None
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_permissions(self):
        if self.request.method not in ('GET', 'HEAD', 'OPTIONS'):
            return [OrgScopedPermission(), IsOrgAdminOrOwner()]
        return super().get_permissions()

    def _get_project(self):
        org = self.request.organization
        key = self.kwargs.get('project_key', '').upper()
        return Project.objects.get(organization=org, key=key)

    def get_queryset(self):
        try:
            project = self._get_project()
        except Project.DoesNotExist:
            return Cycle.objects.none()
        return Cycle.objects.filter(project=project).prefetch_related('issues')

    def get_serializer_class(self):
        if self.action == 'create':
            return CycleCreateSerializer
        if self.action == 'retrieve':
            return CycleDetailSerializer
        return CycleSerializer

    def create(self, request, *args, **kwargs):
        project = self._get_project()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cycle = serializer.save(project=project)
        return Response(CycleSerializer(cycle).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='active')
    def active_cycle(self, request, **kwargs):
        from datetime import date
        today = date.today()
        try:
            project = self._get_project()
        except Project.DoesNotExist:
            return Response(None)
        cycle = (
            Cycle.objects
            .filter(project=project, start_date__lte=today, end_date__gte=today)
            .prefetch_related('issues')
            .order_by('-start_date')
            .first()
        )
        if not cycle:
            return Response(None)
        return Response(CycleDetailSerializer(cycle).data)
