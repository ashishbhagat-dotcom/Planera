from django.db.models import F
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from projects.models import Project
from .models import Activity, Issue


@receiver(post_delete, sender=Issue)
def decrement_issue_count(sender, instance, **kwargs):
    Project.objects.filter(pk=instance.project_id).update(
        issue_count=F('issue_count') - 1
    )


@receiver(pre_save, sender=Issue)
def log_issue_changes(sender, instance, **kwargs):
    """Auto-log status and assignee changes. Skipped when IssueService already logs."""
    if getattr(instance, '_skip_activity', False):
        return
    if not instance.pk:
        return  # new issue — create_issue handles the 'created' activity

    try:
        old = Issue.objects.get(pk=instance.pk)
    except Issue.DoesNotExist:
        return

    actor = getattr(instance, '_actor', None)

    if old.status != instance.status:
        Activity.objects.create(
            issue=instance,
            actor=actor,
            verb=Activity.MOVED,
            data={'from': old.status, 'to': instance.status},
        )

    if old.assignee_id != instance.assignee_id:
        Activity.objects.create(
            issue=instance,
            actor=actor,
            verb=Activity.ASSIGNED,
            data={
                'from': str(old.assignee_id) if old.assignee_id else None,
                'to': str(instance.assignee_id) if instance.assignee_id else None,
            },
        )
