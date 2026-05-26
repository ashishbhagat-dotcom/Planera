class JWTAuthMiddleware:
    """Stub — replaced in T33 with real JWT validation."""
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return self.inner(scope)
