from datetime import date

from django.db.models import Count, Q

from issues.models import Activity, Issue
from issues.serializers import ActivitySerializer


class DashboardService:

    @staticmethod
    def get_stats(org, project=None):
        base_qs = Issue.objects.filter(project__organization=org)
        if project:
            base_qs = base_qs.filter(project=project)

        counts_by_status = {
            row['status']: row['count']
            for row in base_qs.values('status').annotate(count=Count('id'))
        }

        counts_by_priority = {
            row['priority']: row['count']
            for row in base_qs.values('priority').annotate(count=Count('id'))
        }

        open_statuses = [
            Issue.Status.BACKLOG,
            Issue.Status.TODO,
            Issue.Status.IN_PROGRESS,
            Issue.Status.IN_REVIEW,
        ]
        open_issues = base_qs.filter(status__in=open_statuses).count()

        today = date.today()
        overdue_count = base_qs.filter(
            due_date__lt=today,
            status__in=open_statuses,
        ).count()

        activity_qs = (
            Activity.objects
            .filter(issue__project__organization=org)
            .select_related('actor', 'issue')
            .order_by('-created_at')
        )
        if project:
            activity_qs = activity_qs.filter(issue__project=project)

        recent_activity = ActivitySerializer(activity_qs[:5], many=True).data

        return {
            'issue_counts_by_status': counts_by_status,
            'issue_counts_by_priority': counts_by_priority,
            'open_issues': open_issues,
            'overdue_count': overdue_count,
            'recent_activity': recent_activity,
        }
