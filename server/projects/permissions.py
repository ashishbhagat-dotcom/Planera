from rest_framework.permissions import IsAuthenticated

from organizations.permissions import IsOrgAdminOrOwner, IsOrgMember

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')


class ProjectPermission(IsAuthenticated):
    """Members can read; admin/owner can create, update, delete."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in SAFE_METHODS:
            return IsOrgMember().has_permission(request, view)
        return IsOrgAdminOrOwner().has_permission(request, view)
