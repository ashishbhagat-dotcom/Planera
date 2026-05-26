from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from .tokens import (
    REFRESH_COOKIE_NAME,
    clear_refresh_cookie,
    get_tokens_for_user,
    set_refresh_cookie,
)


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        response = Response(
            {'user': UserSerializer(user).data, 'access': tokens['access']},
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        response = Response(
            {'user': UserSerializer(user).data, 'access': tokens['access']},
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class RefreshView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not raw:
            return Response(
                {'error': {'code': 'missing_token', 'message': 'Refresh token cookie not found.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(raw)
            access = str(refresh.access_token)
        except TokenError as exc:
            return Response(
                {'error': {'code': 'invalid_token', 'message': str(exc)}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({'access': access})
        set_refresh_cookie(response, str(refresh))
        return response


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except Exception:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
