from rest_framework import status, viewsets, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.core.mail import send_mail
from django.conf import settings

from .models import User, Favorite
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, SendOTPSerializer, VerifyOTPSerializer, FavoriteSerializer
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
    permission_classes = (AllowAny,)
    authentication_classes = ()

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


class SendOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()
        send_mail(
            subject='Your Planera verification code',
            message=(
                f'Hi {otp.full_name or otp.email},\n\n'
                f'Your verification code is: {otp.otp_code}\n\n'
                f'This code expires in 10 minutes. Do not share it with anyone.\n\n'
                f'— The Planera Team'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@planera.dev'),
            recipient_list=[otp.email],
            fail_silently=False,
        )
        return Response({'detail': 'OTP sent. Check your email.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        response = Response(
            {'user': UserSerializer(user).data, 'access': tokens['access']},
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, tokens['refresh'])
        return response


class FavoriteViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsAuthenticated,)
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        org = self.request.organization
        if not org:
            return Favorite.objects.none()
        return Favorite.objects.filter(user=self.request.user, organization=org)

    def perform_create(self, serializer):
        org = self.request.organization
        if not org:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Organization context required.')
        serializer.save(user=self.request.user, organization=org)

    def create(self, request, *args, **kwargs):
        org = request.organization
        if not org:
            return Response({'error': 'Organization context required.'}, status=status.HTTP_400_BAD_REQUEST)
        existing = Favorite.objects.filter(
            user=request.user,
            organization=org,
            target_type=request.data.get('target_type'),
            target_id=request.data.get('target_id'),
        ).first()
        if existing:
            return Response(FavoriteSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)
