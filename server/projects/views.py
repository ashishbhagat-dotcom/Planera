from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.permissions import OrgScopedPermission
from .models import Project
from .permissions import ProjectPermission
from .serializers import ProjectCreateSerializer, ProjectDetailSerializer, ProjectListSerializer


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
