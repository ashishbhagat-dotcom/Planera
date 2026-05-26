from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from organizations.models import Membership, Organization
from projects.models import Project
from issues.services import IssueService
from issues.models import Issue, Label

User = get_user_model()

ISSUES = [
    ('Fix login redirect loop', Issue.Status.IN_PROGRESS, Issue.Priority.URGENT),
    ('Add OAuth2 support', Issue.Status.TODO, Issue.Priority.HIGH),
    ('Dashboard loading slowly', Issue.Status.BACKLOG, Issue.Priority.MEDIUM),
    ('Mobile nav breaks on iOS 17', Issue.Status.IN_PROGRESS, Issue.Priority.HIGH),
    ('Write API documentation', Issue.Status.TODO, Issue.Priority.LOW),
    ('Set up CI/CD pipeline', Issue.Status.DONE, Issue.Priority.HIGH),
    ('User avatar upload fails', Issue.Status.IN_REVIEW, Issue.Priority.MEDIUM),
    ('Add dark mode toggle', Issue.Status.BACKLOG, Issue.Priority.LOW),
    ('Fix CSV export encoding', Issue.Status.DONE, Issue.Priority.MEDIUM),
    ('Rate limiting on auth endpoints', Issue.Status.TODO, Issue.Priority.URGENT),
]


class Command(BaseCommand):
    help = 'Seed demo data: 1 workspace, 3 users, 2 projects, 10 issues'

    def handle(self, *args, **options):
        with transaction.atomic():
            self._seed()
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
        self.stdout.write('  alice@acme.com / password  (owner)')
        self.stdout.write('  bob@acme.com   / password  (admin)')
        self.stdout.write('  carol@acme.com / password  (member)')

    def _seed(self):
        # Users
        alice = self._get_or_create_user('alice@acme.com', 'Alice Chen', is_owner=True)
        bob   = self._get_or_create_user('bob@acme.com',   'Bob Kim')
        carol = self._get_or_create_user('carol@acme.com', 'Carol Davis')

        # Workspace
        org, created = Organization.objects.get_or_create(
            slug='acme',
            defaults={'name': 'Acme Engineering'},
        )
        if created:
            self.stdout.write(f'  Created workspace: {org.name}')
        else:
            self.stdout.write(f'  Using existing workspace: {org.name}')

        Membership.objects.get_or_create(organization=org, user=alice, defaults={'role': Membership.OWNER})
        Membership.objects.get_or_create(organization=org, user=bob,   defaults={'role': Membership.ADMIN})
        Membership.objects.get_or_create(organization=org, user=carol, defaults={'role': Membership.MEMBER})

        # Labels
        label_bug, _     = Label.objects.get_or_create(organization=org, name='Bug',     defaults={'color': '#ef4444'})
        label_feature, _ = Label.objects.get_or_create(organization=org, name='Feature', defaults={'color': '#6366f1'})

        # Projects
        plt, _ = Project.objects.get_or_create(
            organization=org, key='PLT',
            defaults={'name': 'Platform', 'icon': '⚙️', 'color': '#6366f1'},
        )
        mob, _ = Project.objects.get_or_create(
            organization=org, key='MOB',
            defaults={'name': 'Mobile', 'icon': '📱', 'color': '#f59e0b'},
        )

        # Issues — 7 in Platform, 3 in Mobile
        projects_cycle = [plt, plt, plt, mob, plt, plt, mob, plt, mob, plt]
        assignees_cycle = [alice, bob, carol, alice, bob, carol, alice, bob, carol, alice]

        existing_titles = set(
            Issue.objects.filter(project__organization=org).values_list('title', flat=True)
        )
        for i, (title, status, priority) in enumerate(ISSUES):
            project = projects_cycle[i]
            assignee = assignees_cycle[i]
            if title in existing_titles:
                continue
            issue = IssueService.create_issue(
                project=project,
                creator=alice,
                title=title,
                status=status,
                priority=priority,
            )
            issue.assignee = assignee
            issue._skip_activity = True
            issue.save(update_fields=['assignee', 'updated_at'])

        self.stdout.write(f'  Issues seeded in PLT and MOB')

    def _get_or_create_user(self, email, full_name, is_owner=False):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'is_active': True},
        )
        if created:
            user.set_password('password')
            user.save(update_fields=['password'])
            self.stdout.write(f'  Created user: {email}')
        return user
