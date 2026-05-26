from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MembershipViewSet, WorkspaceViewSet

router = DefaultRouter()
router.register('', WorkspaceViewSet, basename='workspace')
router.register('memberships', MembershipViewSet, basename='membership')

urlpatterns = [
    path('', include(router.urls)),
]
