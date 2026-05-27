from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import OrgScopedPermission
from organizations.permissions import IsOrgMember
from projects.models import Project
from .services import DashboardService


class DashboardView(APIView):
    permission_classes = (IsAuthenticated, OrgScopedPermission, IsOrgMember)

    def get(self, request):
        org = request.organization
        project_key = request.query_params.get('project_key', '').upper()

        project = None
        if project_key:
            try:
                project = Project.objects.get(organization=org, key=project_key)
            except Project.DoesNotExist:
                pass

        stats = DashboardService.get_stats(org=org, project=project)
        return Response(stats)
