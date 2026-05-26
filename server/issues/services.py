import re

from django.db import transaction
from django.db.models import F

from core.fractional_index import generate_end_position
from projects.models import Project
from .models import Activity, Issue


class IssueService:

    @staticmethod
    def _next_position(project: Project, status: str) -> str:
        """Return a fractional index position after the last issue in the given status column."""
        last = (
            Issue.objects.filter(project=project, status=status)
            .order_by('position')
            .values_list('position', flat=True)
            .last()
        )
        return generate_end_position(last)

    @staticmethod
    def _next_identifier(project: Project) -> str:
        """Generate next identifier like PLT-1, PLT-2 atomically."""
        last = (
            Issue.objects.filter(project=project)
            .order_by('-created_at')
            .values_list('identifier', flat=True)
            .first()
        )
        if last:
            match = re.search(r'(\d+)$', last)
            number = int(match.group(1)) + 1 if match else 1
        else:
            number = 1
        return f'{project.key}-{number}'

    @staticmethod
    @transaction.atomic
    def create_issue(*, project: Project, creator, **data) -> Issue:
        identifier = IssueService._next_identifier(project)
        status = data.get('status', Issue.Status.BACKLOG)
        if 'position' not in data:
            data['position'] = IssueService._next_position(project, status)
        issue = Issue(
            project=project,
            creator=creator,
            identifier=identifier,
            **data,
        )
        issue._skip_activity = True
        issue.save()
        Activity.objects.create(
            issue=issue,
            actor=creator,
            verb=Activity.CREATED,
            data={'identifier': identifier, 'title': issue.title},
        )
        Project.objects.filter(pk=project.pk).update(issue_count=F('issue_count') + 1)

        transaction.on_commit(lambda: IssueService._broadcast_stub('issue.created', issue))
        return issue

    @staticmethod
    @transaction.atomic
    def update_issue(*, issue: Issue, actor, **data) -> Issue:
        changed = {}
        for field, value in data.items():
            old = getattr(issue, field, None)
            if old != value:
                changed[field] = {'from': str(old), 'to': str(value)}
            setattr(issue, field, value)

        issue._skip_activity = True
        issue.save(update_fields=list(data.keys()) + ['updated_at'])

        if changed:
            Activity.objects.create(
                issue=issue,
                actor=actor,
                verb=Activity.UPDATED,
                data=changed,
            )
        return issue

    @staticmethod
    @transaction.atomic
    def move_issue(*, issue: Issue, actor, new_status: str, new_position: str) -> Issue:
        old_status = issue.status
        issue.status = new_status
        issue.position = new_position
        issue._skip_activity = True
        issue.save(update_fields=['status', 'position', 'updated_at'])

        Activity.objects.create(
            issue=issue,
            actor=actor,
            verb=Activity.MOVED,
            data={'from': old_status, 'to': new_status},
        )

        transaction.on_commit(
            lambda: IssueService._broadcast_stub('issue.moved', issue)
        )
        return issue

    @staticmethod
    @transaction.atomic
    def assign_issue(*, issue: Issue, assignee, actor) -> Issue:
        old_assignee = issue.assignee
        issue.assignee = assignee
        issue._skip_activity = True
        issue.save(update_fields=['assignee', 'updated_at'])

        Activity.objects.create(
            issue=issue,
            actor=actor,
            verb=Activity.ASSIGNED,
            data={
                'from': str(old_assignee.id) if old_assignee else None,
                'to': str(assignee.id) if assignee else None,
            },
        )

        # Notification task wired in T40
        if assignee and assignee != actor:
            transaction.on_commit(
                lambda: IssueService._notify_stub(assignee, issue, actor)
            )
        return issue

    @staticmethod
    @transaction.atomic
    def delete_issue(*, issue: Issue, actor) -> None:
        project = issue.project
        issue.delete()
        # issue_count decremented via post_delete signal in signals.py
        transaction.on_commit(
            lambda: IssueService._broadcast_stub('issue.deleted', None, extra={'project_id': str(project.id)})
        )

    @staticmethod
    def _broadcast_stub(event_type: str, issue, extra: dict = None):
        """Replaced by real Celery task in T35."""
        pass

    @staticmethod
    def _notify_stub(assignee, issue, actor):
        """Replaced by real Celery notification task in T40."""
        pass
