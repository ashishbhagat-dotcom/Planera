from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CommentViewSet, IssueViewSet, LabelViewSet, MyIssuesView

router = DefaultRouter()
router.register('labels', LabelViewSet, basename='label')
router.register('comments', CommentViewSet, basename='comment')

urlpatterns = [
    # Issues nested under projects: /api/v1/projects/<key>/issues/
    path(
        'projects/<str:project_key>/issues/',
        include([
            path('', IssueViewSet.as_view({'get': 'list', 'post': 'create'}), name='issue-list'),
            path(
                '<str:identifier>/',
                IssueViewSet.as_view({
                    'get': 'retrieve',
                    'patch': 'partial_update',
                    'delete': 'destroy',
                }),
                name='issue-detail',
            ),
            path(
                '<str:identifier>/move/',
                IssueViewSet.as_view({'post': 'move'}),
                name='issue-move',
            ),
            path(
                '<str:identifier>/activity/',
                IssueViewSet.as_view({'get': 'activity'}),
                name='issue-activity',
            ),
            path(
                '<str:identifier>/comments/',
                IssueViewSet.as_view({'get': 'comments', 'post': 'comments'}),
                name='issue-comments',
            ),
        ]),
    ),
    # My issues (cross-project): /api/v1/me/issues/
    path('me/issues/', MyIssuesView.as_view(), name='my-issues'),
    # Labels: /api/v1/labels/
    path('', include(router.urls)),
]
