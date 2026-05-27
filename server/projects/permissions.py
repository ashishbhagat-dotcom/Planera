from rest_framework.permissions import IsAuthenticated

from organizations.permissions import IsOrgMember, IsOrgOwner

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')


class ProjectPermission(IsAuthenticated):
    """Members can read; only the workspace owner can create, update, or delete projects."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in SAFE_METHODS:
            return IsOrgMember().has_permission(request, view)
        return IsOrgOwner().has_permission(request, view)
