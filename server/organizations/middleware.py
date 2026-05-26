from django.utils.functional import SimpleLazyObject

SKIP_PREFIXES = ('/admin/', '/api/v1/auth/', '/static/')


def _get_organization(request):
    from .models import Organization

    slug = request.headers.get('X-Organization-Slug')
    if not slug or not request.user.is_authenticated:
        return None
    return (
        Organization.objects
        .filter(slug=slug, memberships__user=request.user)
        .first()
    )


class OrgContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not any(request.path.startswith(p) for p in SKIP_PREFIXES):
            request.organization = SimpleLazyObject(lambda: _get_organization(request))
        else:
            request.organization = None
        return self.get_response(request)
