from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from organizations.models import Membership, Organization
from projects.models import Project
from issues.models import Comment, Issue, Label
from issues.services import IssueService

User = get_user_model()

S = Issue.Status
P = Issue.Priority

# 30 realistic issues: (title, status, priority, project_key, assignee_index, label_names, description)
ISSUES = [
    # Platform — authentication & auth
    ('Fix login redirect loop after OAuth callback',        S.IN_PROGRESS, P.URGENT,  'PLT', 0, ['Bug', 'Urgent'],      'Users are redirected to /login in a loop after completing OAuth. Only affects Google provider. Reproducible on Chrome and Safari.'),
    ('Rate limiting on /api/v1/auth/login/',                S.TODO,        P.URGENT,  'PLT', 1, ['Feature', 'Urgent'],  'Add per-IP and per-account rate limiting to prevent brute-force attacks. Target: 10 attempts per minute.'),
    ('Add OAuth2 support (Google, GitHub)',                 S.TODO,        P.HIGH,    'PLT', 2, ['Feature'],            'Integrate social login via OAuth2. Priority providers: Google and GitHub. Use django-allauth or custom implementation.'),
    ('JWT refresh token rotation — invalidate on reuse',   S.IN_REVIEW,   P.HIGH,    'PLT', 0, ['Feature', 'Bug'],     'Once a refresh token is rotated, the old one must be rejected. Currently old tokens remain valid until expiry.'),
    ('Password reset email not delivered to some domains', S.DONE,        P.HIGH,    'PLT', 1, ['Bug'],                'SES was rejecting emails to .io domains due to missing DKIM record. Fixed by updating Route53 records.'),

    # Platform — performance
    ('Dashboard API response time > 2 s under load',       S.IN_PROGRESS, P.HIGH,    'PLT', 2, ['Bug'],                'Under 50 concurrent users the /api/v1/analytics/dashboard/ endpoint degrades to ~2.3 s. Profile with django-silk.'),
    ('Add Redis caching for analytics aggregations',       S.TODO,        P.MEDIUM,  'PLT', 0, ['Improvement'],        'Cache DashboardService results in Redis with a 60 s TTL. Invalidate on issue create/update/delete.'),
    ('N+1 query on GET /api/v1/projects/:key/issues/',     S.DONE,        P.MEDIUM,  'PLT', 1, ['Bug', 'Improvement'], 'Fixed by adding select_related("assignee", "creator") and prefetch_related("labels") to the issue queryset.'),
    ('Paginate workspace members endpoint',                S.BACKLOG,     P.LOW,     'PLT', 2, ['Improvement'],        'GET /api/v1/workspaces/:slug/members/ returns all members. Switch to cursor pagination before workspaces exceed 1000 members.'),

    # Platform — infrastructure & DX
    ('Set up CI/CD pipeline with GitHub Actions',          S.DONE,        P.HIGH,    'PLT', 0, ['Improvement'],        'Docker-based CI: lint → test → build → push to ECR → deploy to ECS. Staging auto-deploys on main; prod requires manual approval.'),
    ('Write OpenAPI 3.0 spec for all endpoints',           S.TODO,        P.MEDIUM,  'PLT', 1, ['Docs'],               'Use drf-spectacular to autogenerate. Add custom examples for auth, issues, and move endpoints. Host at /api/schema/redoc/.'),
    ('Migrate to Postgres 16',                             S.BACKLOG,     P.LOW,     'PLT', 2, ['Improvement'],        'Postgres 16 brings logical replication improvements and better query planner. Test migration on staging first.'),
    ('Add database connection pooling (PgBouncer)',        S.BACKLOG,     P.MEDIUM,  'PLT', 0, ['Improvement'],        'Current max_connections is 100. Under high load Django exhausts the pool. Add PgBouncer in transaction mode.'),
    ('Set up Sentry error tracking',                       S.IN_PROGRESS, P.HIGH,    'PLT', 1, ['Improvement'],        'Integrate sentry-sdk for both Django backend and React frontend. Configure release tracking and performance monitoring.'),
    ('Write seed script with realistic demo data',         S.IN_REVIEW,   P.MEDIUM,  'PLT', 2, ['Improvement', 'Docs'], 'Finalize seed_demo management command with --fresh flag, 30 issues, 5 labels, and 10 comments.'),
    ('Document deployment runbook',                        S.DONE,        P.LOW,     'PLT', 0, ['Docs'],               'Step-by-step guide: how to deploy to Railway, roll back, restore from backup, and rotate secrets.'),
    ('Add health-check endpoint /api/health/',             S.DONE,        P.LOW,     'PLT', 1, ['Improvement'],        'Returns {status: ok, db: ok, redis: ok}. Used by ECS health checks and uptime monitoring.'),

    # Mobile
    ('Mobile nav breaks on iOS 17 (Safari)',               S.IN_PROGRESS, P.HIGH,    'MOB', 2, ['Bug'],                'Bottom navigation bar overlaps safe-area inset on iPhone 15 models. CSS env(safe-area-inset-bottom) not applied correctly.'),
    ('Board drag-and-drop not working on touch devices',   S.TODO,        P.HIGH,    'MOB', 0, ['Bug'],                'DnD Kit requires PointerSensor which does not fire on touch-only iPads without additional touch sensor configuration.'),
    ('Add pull-to-refresh on issue list',                  S.BACKLOG,     P.MEDIUM,  'MOB', 1, ['Feature'],            'Users expect PTR on mobile. Implement using touch event tracking and invalidate the issues query on release threshold.'),
    ('Offline mode: cache last-viewed board',              S.BACKLOG,     P.LOW,     'MOB', 2, ['Feature'],            'Use service worker + IndexedDB to cache board data. Show stale UI with a "you\'re offline" banner when network is unavailable.'),
    ('Swipe right on issue row to assign',                 S.BACKLOG,     P.LOW,     'MOB', 0, ['Feature'],            'Common mobile PM pattern: swipe right reveals a quick-assign menu; swipe left reveals delete.'),
    ('Push notifications for assignments',                 S.TODO,        P.MEDIUM,  'MOB', 1, ['Feature'],            'Integrate Firebase Cloud Messaging. Send push notification when an issue is assigned to the current user.'),
    ('Fix avatar upload on mobile — file picker crashes',  S.IN_REVIEW,   P.MEDIUM,  'MOB', 2, ['Bug'],                'The native file picker on Android Chrome 126 crashes when selecting HEIC images. Convert HEIC to JPEG client-side before upload.'),
    ('Reduce initial JS bundle size',                      S.IN_PROGRESS, P.MEDIUM,  'MOB', 0, ['Improvement'],        'Current bundle: 1.2 MB gzipped. Target: < 400 KB. Use Vite dynamic imports, lazy-load recharts and react-markdown.'),
    ('Add haptic feedback on card drop',                   S.BACKLOG,     P.LOW,     'MOB', 1, ['Feature'],            'Use navigator.vibrate(10) on DragEnd for tactile feedback on Android. iOS requires WebKit-specific API.'),
    ('Write E2E test suite with Playwright',               S.TODO,        P.MEDIUM,  'MOB', 2, ['Docs', 'Improvement'], 'Cover happy path: register → workspace → project → board CRUD → drag card. Run in CI on PRs targeting main.'),
    ('Fix date-fns locale on non-English OS settings',     S.DONE,        P.LOW,     'MOB', 0, ['Bug'],                'formatDistanceToNow was using the OS locale instead of the app locale (en). Fixed by explicitly passing { locale: enUS }.'),
    ('Add keyboard navigation for board columns',          S.CANCELLED,   P.LOW,     'MOB', 1, ['Feature'],            'Cancelled — superseded by the full keyboard shortcut system implemented in T46. DnD Kit has built-in keyboard support.'),
    ('Dark mode flicker on page load (FOUC)',              S.CANCELLED,   P.LOW,     'MOB', 2, ['Bug'],                'Cancelled — resolved by storing dark mode preference in localStorage and applying the class before React hydrates.'),
]

COMMENTS = [
    (0,  0, 'Confirmed the loop on my end. The issue is in the `state` parameter not being preserved across the OAuth redirect. Working on a fix.'),
    (0,  1, 'Root cause: session store cleared before the callback handler runs. Will use a short-lived signed cookie instead.'),
    (1,  2, 'I\'d suggest using django-ratelimit with Redis backend. Gives us per-IP and per-user controls without much boilerplate.'),
    (5,  0, 'Silk profiling shows the ORM is doing 12 queries per request. The aggregation on issues is the bottleneck — no index on (project_id, status).'),
    (5,  1, 'Added a composite index in migration 0002. Re-ran the load test — p95 is now 340 ms. Closing soon.'),
    (9,  2, 'GitHub Actions workflow is live. First full run took 6m 40s. I\'ll add caching for pip and npm installs to get it under 3 minutes.'),
    (17, 0, 'Reproduced on iPhone 15 Pro with iOS 17.5.1. The safe-area-inset-bottom is 34px but we\'re only reserving 20px in the layout.'),
    (18, 1, 'DnD Kit docs recommend adding the TouchSensor alongside PointerSensor. PR is up — would appreciate a review.'),
    (24, 2, 'Used vite-bundle-visualizer. recharts alone is 280 KB. Switching to a dynamic import cuts the initial bundle by ~30%.'),
    (3,  0, 'JWT rotation policy is now enforced. Tested with a replay attack — old tokens are rejected with 401 after first rotation.'),
]


class Command(BaseCommand):
    help = 'Seed demo data (use --fresh to wipe and recreate)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fresh',
            action='store_true',
            help='Delete all existing demo data before seeding',
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            if options['fresh']:
                self._wipe()
            self._seed()
        self.stdout.write(self.style.SUCCESS('\nDemo data ready.'))
        self.stdout.write('  alice@acme.com / password  (owner)')
        self.stdout.write('  bob@acme.com   / password  (admin)')
        self.stdout.write('  carol@acme.com / password  (member)')
        self.stdout.write('  Projects: PLT (Platform), MOB (Mobile)')

    def _wipe(self):
        org = Organization.objects.filter(slug='acme').first()
        if org:
            # Issues cascade-delete comments, activities
            Issue.objects.filter(project__organization=org).delete()
            Label.objects.filter(organization=org).delete()
            Project.objects.filter(organization=org).delete()
            Membership.objects.filter(organization=org).delete()
            org.delete()
            self.stdout.write('  Wiped existing demo data.')
        for email in ('alice@acme.com', 'bob@acme.com', 'carol@acme.com'):
            User.objects.filter(email=email).delete()
        self.stdout.write('  Wiped demo users.')

    def _seed(self):
        # Users
        alice = self._upsert_user('alice@acme.com', 'Alice Chen')
        bob   = self._upsert_user('bob@acme.com',   'Bob Kim')
        carol = self._upsert_user('carol@acme.com', 'Carol Davis')
        users = [alice, bob, carol]

        # Workspace
        org, created = Organization.objects.get_or_create(
            slug='acme',
            defaults={'name': 'Acme Engineering'},
        )
        verb = 'Created' if created else 'Using existing'
        self.stdout.write(f'  {verb} workspace: {org.name}')

        Membership.objects.get_or_create(organization=org, user=alice, defaults={'role': Membership.OWNER})
        Membership.objects.get_or_create(organization=org, user=bob,   defaults={'role': Membership.ADMIN})
        Membership.objects.get_or_create(organization=org, user=carol, defaults={'role': Membership.MEMBER})

        # Labels
        label_defs = [
            ('Bug',         '#ef4444'),
            ('Feature',     '#6366f1'),
            ('Improvement', '#f59e0b'),
            ('Docs',        '#3b82f6'),
            ('Urgent',      '#dc2626'),
        ]
        labels = {}
        for name, color in label_defs:
            obj, _ = Label.objects.get_or_create(organization=org, name=name, defaults={'color': color})
            labels[name] = obj
        self.stdout.write(f'  Labels: {", ".join(labels)}')

        # Projects
        plt, _ = Project.objects.get_or_create(
            organization=org, key='PLT',
            defaults={'name': 'Platform', 'icon': '⚙️', 'color': '#6366f1'},
        )
        mob, _ = Project.objects.get_or_create(
            organization=org, key='MOB',
            defaults={'name': 'Mobile', 'icon': '📱', 'color': '#f59e0b'},
        )
        project_map = {'PLT': plt, 'MOB': mob}

        # Issues
        created_issues = []
        existing_titles = set(
            Issue.objects.filter(project__organization=org).values_list('title', flat=True)
        )

        for title, status, priority, proj_key, assignee_idx, label_names, description in ISSUES:
            if title in existing_titles:
                created_issues.append(None)
                continue
            project = project_map[proj_key]
            issue = IssueService.create_issue(
                project=project,
                creator=alice,
                title=title,
                status=status,
                priority=priority,
                description=description,
            )
            issue.assignee = users[assignee_idx]
            issue._skip_activity = True
            issue.save(update_fields=['assignee', 'updated_at'])
            issue.labels.set([labels[n] for n in label_names if n in labels])
            created_issues.append(issue)

        issue_count = sum(1 for i in created_issues if i is not None)
        self.stdout.write(f'  Issues created: {issue_count}')

        # Comments
        comment_count = 0
        for issue_idx, author_idx, body in COMMENTS:
            issue = created_issues[issue_idx] if issue_idx < len(created_issues) else None
            if issue is None:
                continue
            Comment.objects.create(issue=issue, author=users[author_idx], body=body)
            comment_count += 1
        self.stdout.write(f'  Comments created: {comment_count}')

    def _upsert_user(self, email, full_name):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'is_active': True},
        )
        if created:
            user.set_password('password')
            user.save(update_fields=['password'])
            self.stdout.write(f'  Created user: {email}')
        return user
