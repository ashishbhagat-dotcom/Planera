from rest_framework.permissions import BasePermission


class OrgScopedPermission(BasePermission):
    """
    Rejects any request that doesn't have request.organization set.
    Applied to all org-scoped viewsets as a first guard so downstream
    permission classes can safely assume the org exists.
    """

    message = 'X-Organization-Slug header is required.'

    def has_permission(self, request, view):
        # request.organization is a SimpleLazyObject; bool() forces evaluation
        return bool(getattr(request, 'organization', None))
