from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework import mixins
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import OrgScopedPermission
from organizations.permissions import IsOrgAdminOrOwner, IsOrgMember
from .filters import IssueFilterSet
from .models import Comment, Issue, Label
from .serializers import (
    ActivitySerializer,
    CommentSerializer,
    IssueCreateSerializer,
    IssueDetailSerializer,
    IssueListSerializer,
    IssueMoveSerializer,
    IssueUpdateSerializer,
    LabelSerializer,
)
from .services import IssueService


class IsAuthorOrReadOnly(BasePermission):
    """Allow read to any authenticated user; write only to the comment author."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author_id == request.user.id


class IssueViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, OrgScopedPermission, IsOrgMember)
    lookup_field = 'identifier'

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAuthenticated(), OrgScopedPermission(), IsOrgAdminOrOwner()]
        return super().get_permissions()
    filterset_class = IssueFilterSet
    ordering_fields = ('position', 'created_at', 'priority', 'status')
    ordering = ('position',)

    def get_queryset(self):
        org = self.request.organization
        project_key = self.kwargs.get('project_key', '').upper()
        if not org or not project_key:
            return Issue.objects.none()
        return (
            Issue.objects.filter(
                project__organization=org,
                project__key=project_key,
            )
            .select_related('creator', 'assignee', 'project')
            .prefetch_related('labels')
            .order_by('position')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return IssueCreateSerializer
        if self.action in ('partial_update', 'update'):
            return IssueUpdateSerializer
        if self.action == 'retrieve':
            return IssueDetailSerializer
        return IssueListSerializer

    def get_object(self):
        self.kwargs['identifier'] = self.kwargs['identifier'].upper()
        return super().get_object()

    def create(self, request, *args, **kwargs):
        org = request.organization
        project_key = self.kwargs.get('project_key', '').upper()
        if not org:
            return Response(
                {'error': {'code': 'no_workspace', 'message': 'X-Organization-Slug header required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from projects.models import Project
        try:
            project = Project.objects.get(organization=org, key=project_key)
        except Project.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Project not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        issue = IssueService.create_issue(
            project=project,
            creator=request.user,
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', Issue.Status.BACKLOG),
            priority=data.get('priority', Issue.Priority.NONE),
            assignee_id=data.get('assignee_id'),
            due_date=data.get('due_date'),
            estimate=data.get('estimate'),
        )
        label_ids = data.get('label_ids', [])
        if label_ids:
            issue.labels.set(label_ids)

        return Response(IssueDetailSerializer(issue).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        issue = self.get_object()
        serializer = IssueUpdateSerializer(issue, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Extract non-model fields before passing to service
        label_ids = data.pop('label_ids', None)
        updated = IssueService.update_issue(issue=issue, actor=request.user, **data)
        if label_ids is not None:
            updated.labels.set(label_ids)

        return Response(IssueDetailSerializer(updated).data)

    def destroy(self, request, *args, **kwargs):
        issue = self.get_object()
        IssueService.delete_issue(issue=issue, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='move')
    def move(self, request, **kwargs):
        issue = self.get_object()
        serializer = IssueMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = IssueService.move_issue(
            issue=issue,
            actor=request.user,
            new_status=serializer.validated_data['status'],
            new_position=serializer.validated_data['position'],
        )
        return Response(IssueDetailSerializer(updated).data)

    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, **kwargs):
        issue = self.get_object()
        activities = issue.activities.select_related('actor').order_by('created_at')
        return Response(ActivitySerializer(activities, many=True).data)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, **kwargs):
        issue = self.get_object()
        if request.method == 'GET':
            qs = issue.comments.select_related('author').order_by('created_at')
            return Response(CommentSerializer(qs, many=True).data)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = Comment.objects.create(
            issue=issue,
            author=request.user,
            body=serializer.validated_data['body'],
        )

        from .models import Activity
        Activity.objects.create(
            issue=issue,
            actor=request.user,
            verb=Activity.COMMENTED,
            data={'comment_id': str(comment.id)},
        )

        from .tasks import broadcast_board_update
        broadcast_board_update(
            issue.project.key,
            'comment.created',
            {'identifier': issue.identifier, 'comment_id': str(comment.id)},
        )

        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = (IsAuthenticated, IsAuthorOrReadOnly)
    serializer_class = CommentSerializer
    http_method_names = ['patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Comment.objects.select_related('author').all()


class LabelViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = (IsAuthenticated, OrgScopedPermission, IsOrgMember)
    serializer_class = LabelSerializer

    def get_queryset(self):
        org = self.request.organization
        if not org:
            return Label.objects.none()
        return Label.objects.filter(organization=org)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.organization)


class MyIssuesView(ListAPIView):
    """All issues assigned to the current user across the entire workspace."""
    permission_classes = (IsAuthenticated, OrgScopedPermission)
    serializer_class = IssueListSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = IssueFilterSet
    ordering_fields = ('status', 'priority', 'due_date', 'created_at')
    ordering = ('-created_at',)

    def get_queryset(self):
        org = self.request.organization
        if not org:
            return Issue.objects.none()
        return (
            Issue.objects
            .filter(assignee=self.request.user, project__organization=org)
            .select_related('project', 'creator', 'assignee')
            .prefetch_related('labels')
        )


class SearchView(APIView):
    permission_classes = (IsAuthenticated, OrgScopedPermission, IsOrgMember)

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'results': [], 'count': 0})

        org = request.organization
        query = SearchQuery(q, search_type='websearch')
        vector = SearchVector('title', 'description', config='english')

        issues = (
            Issue.objects
            .filter(project__organization=org)
            .select_related('assignee', 'creator', 'project')
            .prefetch_related('labels')
            .annotate(rank=SearchRank(vector, query))
            .filter(rank__gt=0)
            .order_by('-rank')[:20]
        )

        data = IssueListSerializer(issues, many=True).data
        return Response({'results': data, 'count': len(data)})
