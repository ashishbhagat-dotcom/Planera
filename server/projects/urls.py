from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CycleViewSet, ProjectViewSet

router = DefaultRouter()
router.register('', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path(
        '<str:project_key>/cycles/',
        include([
            path('', CycleViewSet.as_view({'get': 'list', 'post': 'create'}), name='cycle-list'),
            path('active/', CycleViewSet.as_view({'get': 'active_cycle'}), name='cycle-active'),
            path('<uuid:pk>/', CycleViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='cycle-detail'),
        ]),
    ),
]
