from django.urls import path
from .views import LoginView, LogoutView, MeView, RefreshView, RegisterView, SendOTPView, VerifyOTPView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('send-otp/', SendOTPView.as_view(), name='auth-send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
]
