from urllib.parse import parse_qs

from channels.db import database_sync_to_async


@database_sync_to_async
def get_user_from_token(token_str):
    # All Django imports deferred — apps must be ready before this runs
    from django.conf import settings
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.backends import TokenBackend
    from rest_framework_simplejwt.tokens import UntypedToken
    from rest_framework_simplejwt.exceptions import TokenError

    try:
        UntypedToken(token_str)
    except TokenError:
        return None

    data = TokenBackend(
        algorithm=settings.SIMPLE_JWT.get('ALGORITHM', 'HS256'),
        signing_key=settings.SECRET_KEY,
    ).decode(token_str, verify=True)

    User = get_user_model()
    try:
        return User.objects.get(id=data['user_id'])
    except User.DoesNotExist:
        return None


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [])

        if not token_list:
            await send({'type': 'websocket.close', 'code': 4001})
            return

        user = await get_user_from_token(token_list[0])
        if user is None:
            await send({'type': 'websocket.close', 'code': 4001})
            return

        scope['user'] = user
        await self.inner(scope, receive, send)
