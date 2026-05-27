import re

from django.db import transaction
from django.db.models import F

from core.fractional_index import generate_end_position
from projects.models import Project
from .models import Activity, Issue
from .tasks import broadcast_board_update
from notifications.tasks import create_and_push_notification


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

        _project_key = project.key
        _issue_id = str(issue.id)
        _identifier = issue.identifier
        _actor_id = str(creator.id)
        transaction.on_commit(lambda: broadcast_board_update(
            _project_key, 'issue.created',
            {'issue_id': _issue_id, 'identifier': _identifier, 'actor_id': _actor_id},
        ))
        return issue

    @staticmethod
    @transaction.atomic
    def update_issue(*, issue: Issue, actor, **data) -> Issue:
        changed = {}
        old_assignee_id = issue.assignee_id
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

        new_assignee_id = issue.assignee_id
        if 'assignee_id' in changed:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            _org_id = str(issue.project.organization_id)
            _issue_id = str(issue.id)
            _identifier = issue.identifier
            _actor_email = actor.email

            if new_assignee_id and new_assignee_id != old_assignee_id:
                try:
                    new_assignee = User.objects.get(pk=new_assignee_id)
                    if new_assignee != actor:
                        _recipient_id = str(new_assignee_id)
                        transaction.on_commit(lambda: create_and_push_notification.delay(
                            _recipient_id,
                            _org_id,
                            'issue.assigned',
                            f'You were assigned {_identifier}',
                            {'issue_id': _issue_id, 'identifier': _identifier, 'actor': _actor_email},
                        ))
                except User.DoesNotExist:
                    pass

            if old_assignee_id and old_assignee_id != new_assignee_id:
                try:
                    old_assignee = User.objects.get(pk=old_assignee_id)
                    if old_assignee != actor:
                        _recipient_id = str(old_assignee_id)
                        transaction.on_commit(lambda: create_and_push_notification.delay(
                            _recipient_id,
                            _org_id,
                            'issue.unassigned',
                            f'You were unassigned from {_identifier}',
                            {'issue_id': _issue_id, 'identifier': _identifier, 'actor': _actor_email},
                        ))
                except User.DoesNotExist:
                    pass

        if changed:
            _project_key = issue.project.key
            _identifier = issue.identifier
            _actor_id = str(actor.id)
            transaction.on_commit(lambda: broadcast_board_update(
                _project_key, 'issue.updated',
                {'identifier': _identifier, 'actor_id': _actor_id, 'changed': list(changed.keys())},
            ))

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

        _project_key = issue.project.key
        _issue_id = str(issue.id)
        _identifier = issue.identifier
        _actor_id = str(actor.id)
        transaction.on_commit(lambda: broadcast_board_update(
            _project_key, 'issue.moved',
            {
                'issue_id': _issue_id,
                'identifier': _identifier,
                'status': new_status,
                'position': new_position,
                'actor_id': _actor_id,
            },
        ))
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

        if assignee and assignee != actor:
            _recipient_id = str(assignee.id)
            _org_id = str(issue.project.organization_id)
            _issue_id = str(issue.id)
            _identifier = issue.identifier
            _actor_email = actor.email
            transaction.on_commit(lambda: create_and_push_notification.delay(
                _recipient_id,
                _org_id,
                'issue.assigned',
                f'You were assigned {_identifier}',
                {'issue_id': _issue_id, 'identifier': _identifier, 'actor': _actor_email},
            ))
        return issue

    @staticmethod
    @transaction.atomic
    def delete_issue(*, issue: Issue, actor) -> None:
        _project_key = issue.project.key
        _issue_id = str(issue.id)
        _identifier = issue.identifier
        _actor_id = str(actor.id)
        issue.delete()
        # issue_count decremented via post_delete signal in signals.py
        transaction.on_commit(lambda: broadcast_board_update(
            _project_key, 'issue.deleted',
            {'issue_id': _issue_id, 'identifier': _identifier, 'actor_id': _actor_id},
        ))
