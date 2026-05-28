from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone


@shared_task
def auto_advance_sprints():
    """
    Runs daily. For every cycle whose end_date has passed (effectively ended):
    1. Move all non-done/non-cancelled issues to the next upcoming cycle
       (auto-creates one with the same duration if none exists).
    """
    from .models import Cycle
    from issues.models import Issue

    today = timezone.now().date()

    # Cycles that were active (start <= yesterday, end < today) — just ended
    ended = list(
        Cycle.objects.filter(
            start_date__lt=today,
            end_date__lt=today,
        )
        .exclude(issues=None)  # skip empty cycles to reduce noise
        .select_related('project')
        .distinct()
    )

    # Only process each project once — pick the most-recently-ended cycle
    seen_projects: set = set()
    for cycle in sorted(ended, key=lambda c: c.end_date, reverse=True):
        if cycle.project_id in seen_projects:
            continue
        seen_projects.add(cycle.project_id)

        incomplete = Issue.objects.filter(cycle=cycle).exclude(status__in=['done', 'cancelled'])
        if not incomplete.exists():
            continue

        with transaction.atomic():
            duration_days = (cycle.end_date - cycle.start_date).days

            # Next upcoming cycle (start_date >= today)
            next_cycle = (
                Cycle.objects.filter(
                    project=cycle.project,
                    start_date__gte=today,
                )
                .order_by('start_date')
                .first()
            )

            if not next_cycle:
                next_cycle = Cycle.objects.create(
                    project=cycle.project,
                    name=_next_sprint_name(cycle),
                    start_date=today,
                    end_date=today + timedelta(days=duration_days),
                )

            incomplete.update(cycle=next_cycle)


def _next_sprint_name(ended_cycle) -> str:
    import re
    match = re.search(r'(\d+)\s*$', ended_cycle.name)
    if match:
        num = int(match.group(1)) + 1
        return re.sub(r'\d+\s*$', str(num), ended_cycle.name).strip()
    return f'{ended_cycle.name} 2'
