from rest_framework.permissions import BasePermission

from .models import Membership

ROLE_HIERARCHY = {
    Membership.OWNER: 3,
    Membership.ADMIN: 2,
    Membership.MEMBER: 1,
}


def _get_role(request):
    org = getattr(request, 'organization', None)
    if org is None or not request.user.is_authenticated:
        return None
    membership = org.memberships.filter(user=request.user).first()
    return membership.role if membership else None


class IsOrgMember(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request) is not None


class IsOrgAdminOrOwner(BasePermission):
    def has_permission(self, request, view):
        role = _get_role(request)
        return role is not None and ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY[Membership.ADMIN]


class IsOrgOwner(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request) == Membership.OWNER
