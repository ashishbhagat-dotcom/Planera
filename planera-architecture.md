# Planera — Production-Grade Project Management Platform

## Architecture Document v1.0

> A Staff-Engineer-level system design for a Linear-inspired project management SaaS,
> scoped for 1-week delivery with maximum engineering depth and demo impact.

---

## 1. Product Vision

**Planera** is a high-performance project management platform built for engineering teams.
It prioritizes speed, keyboard-first workflows, and real-time collaboration — directly
inspired by Linear's philosophy that tools should feel like extensions of thought.

**Core thesis**: The difference between a toy project and a production system isn't feature
count — it's architectural integrity. We build fewer features, but each one demonstrates
senior-level thinking: optimistic updates, real-time sync, RBAC, and clean domain modeling.

**Why "Planera"**: A name that suggests planning + era — modern project orchestration.
Branding matters in demos; it signals product thinking beyond code.

---

## 2. Core MVP Scope (1 Week)

### In Scope (Demo-Critical)
| Feature | Why It's Included |
|---|---|
| Auth (JWT + refresh tokens) | Table stakes for any SaaS |
| Organizations + Members | Multi-tenancy is a senior-level concern |
| Projects with settings | Core domain entity |
| Kanban board with DnD | Visual wow factor, tests complex state |
| Issue CRUD + detail panel | Core workflow loop |
| Labels + Priority + Assignees | Shows relational modeling depth |
| Comments + Activity log | Demonstrates event sourcing thinking |
| Real-time board updates | WebSocket architecture showcase |
| Search + Filtering | Shows query optimization thinking |
| RBAC (Owner/Admin/Member) | Authorization architecture |
| Dashboard with metrics | Analytics/aggregation showcase |

### Explicitly Deferred
| Feature | Why It's Cut |
|---|---|
| Email notifications | High effort, low demo impact |
| File attachments | S3 integration adds infra complexity |
| Sprints/Cycles | Adds domain complexity without architectural value |
| Git integration | External API dependency risk |
| Custom fields | Schema complexity for little demo payoff |
| Billing/Subscriptions | You already have billing experience — mention it verbally |

**Decision rationale**: Every included feature demonstrates a distinct architectural
pattern. Every excluded feature would add implementation time without teaching a new
pattern. This is the Staff Engineer tradeoff: scope ruthlessly, execute deeply.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  React + TypeScript + Tailwind + Zustand + React Query + DnD Kit   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Auth     │  │ Kanban   │  │ Issue    │  │ Dashboard/       │   │
│  │ Module   │  │ Board    │  │ Detail   │  │ Analytics        │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│       └──────────────┴──────┬───────┴──────────────────┘             │
│                             │                                       │
│              ┌──────────────┴──────────────┐                        │
│              │   API Client (Axios)        │                        │
│              │   + React Query Cache       │                        │
│              │   + Optimistic Mutations    │                        │
│              └──────────────┬──────────────┘                        │
│                             │                                       │
│              ┌──────────────┴──────────────┐                        │
│              │   WebSocket Client          │                        │
│              │   (reconnect + backoff)     │                        │
│              └──────────────┬──────────────┘                        │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Nginx / Caddy   │
                    │   Reverse Proxy   │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
┌───────────┴───┐   ┌────────┴────────┐  ┌─────┴──────────┐
│  Django REST  │   │  Django         │  │  Celery Worker  │
│  API Server   │   │  Channels       │  │  (async tasks)  │
│               │   │  (WebSocket)    │  │                 │
│  - ViewSets   │   │  - Board sync   │  │  - Notifications│
│  - Serializers│   │  - Presence     │  │  - Activity log │
│  - Permissions│   │  - Typing       │  │  - Aggregations │
│  - Filters    │   │                 │  │                 │
└───────┬───────┘   └────────┬────────┘  └─────┬───────────┘
        │                    │                  │
        └────────────────────┼──────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │       PostgreSQL 15          │
              │                             │
              │  - Organizations            │
              │  - Projects / Boards        │
              │  - Issues / Comments        │
              │  - Activity Events          │
              │  - Users / Memberships      │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │         Redis               │
              │                             │
              │  - Session cache            │
              │  - Channel layer (WS)       │
              │  - Celery broker            │
              │  - Rate limiting            │
              └─────────────────────────────┘
```

### Why This Architecture

| Decision | Rationale |
|---|---|
| Django + DRF | Fastest path to production API with ORM, migrations, admin. You know it. |
| Django Channels | Native WebSocket support without a separate service. |
| PostgreSQL | JSONB for flexible metadata, full-text search, row-level security potential. |
| Redis | Single dependency for cache + WS channel layer + task broker. |
| React Query | Server state management with built-in cache invalidation, optimistic updates. |
| Zustand | UI state only (sidebar open, active filters). Minimal boilerplate. |
| Nginx | SSL termination, static files, WebSocket upgrade handling. |

**Key tradeoff**: We're running a monolith, not microservices. For a 1-week build, a
well-structured monolith with clear domain boundaries is the correct architectural
choice. Microservices would be premature optimization and signal junior thinking.
Mention this explicitly in any interview discussion.

---

## 4. Frontend Architecture

### Design Philosophy
- **Keyboard-first**: Cmd+K palette, shortcuts for common actions
- **Panel-based**: Side panels for detail views (no page navigation for issue viewing)
- **Instant feedback**: Optimistic updates everywhere, skeleton loaders
- **Information density**: Linear-style compact rows, not Jira-style cards

### Component Architecture

```
src/
├── app/                          # App shell and routing
│   ├── App.tsx                   # Root with providers
│   ├── Router.tsx                # Route definitions
│   └── providers/                # Context providers (Auth, Theme, WS)
│
├── modules/                      # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm, OAuthButton
│   │   ├── hooks/                # useAuth, useSession
│   │   ├── services/             # authApi.ts
│   │   └── stores/               # authStore.ts (Zustand slice)
│   │
│   ├── organization/
│   │   ├── components/           # OrgSwitcher, MemberList, InviteModal
│   │   ├── hooks/                # useOrganization, useMembers
│   │   ├── services/             # orgApi.ts
│   │   └── types.ts              # Org domain types
│   │
│   ├── project/
│   │   ├── components/           # ProjectList, ProjectSettings
│   │   ├── hooks/                # useProjects, useProjectStats
│   │   └── services/             # projectApi.ts
│   │
│   ├── board/
│   │   ├── components/
│   │   │   ├── BoardView.tsx       # Main Kanban container
│   │   │   ├── BoardColumn.tsx     # Single status column
│   │   │   ├── BoardCard.tsx       # Draggable issue card
│   │   │   ├── BoardHeader.tsx     # Filters, view toggles
│   │   │   └── QuickCreateCard.tsx # Inline issue creation
│   │   ├── hooks/
│   │   │   ├── useBoardDnD.ts      # DnD Kit orchestration
│   │   │   ├── useBoardSocket.ts   # Real-time board sync
│   │   │   └── useBoardFilters.ts  # Filter/search state
│   │   └── services/
│   │       └── boardApi.ts
│   │
│   ├── issue/
│   │   ├── components/
│   │   │   ├── IssueDetailPanel.tsx  # Slide-over detail view
│   │   │   ├── IssueRow.tsx          # List view row
│   │   │   ├── IssueProperties.tsx   # Priority, assignee, labels
│   │   │   ├── IssueComments.tsx     # Comment thread
│   │   │   └── IssueActivity.tsx     # Activity timeline
│   │   ├── hooks/
│   │   │   ├── useIssue.ts
│   │   │   ├── useIssueComments.ts
│   │   │   └── useIssueMutations.ts  # All mutations with optimistic updates
│   │   └── services/
│   │       └── issueApi.ts
│   │
│   ├── dashboard/
│   │   ├── components/           # StatCard, BurndownChart, ActivityFeed
│   │   └── hooks/                # useDashboardStats
│   │
│   └── notifications/
│       ├── components/           # NotificationPanel, NotificationItem
│       └── hooks/                # useNotifications, useNotificationSocket
│
├── shared/                       # Cross-cutting concerns
│   ├── components/
│   │   ├── ui/                   # Primitive UI kit
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DropdownMenu.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Sidebar + main content
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CommandPalette.tsx   # Cmd+K
│   │   │   └── BreadcrumbNav.tsx
│   │   └── data/
│   │       ├── DataTable.tsx       # Reusable sortable table
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── InfiniteList.tsx
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useKeyboardShortcut.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── ws.ts                 # WebSocket client with reconnect
│   │   ├── queryClient.ts        # React Query config
│   │   └── constants.ts
│   │
│   ├── stores/
│   │   ├── uiStore.ts            # Sidebar state, theme, active panel
│   │   └── filtersStore.ts       # Global filter state
│   │
│   └── types/
│       ├── api.ts                # API response envelopes
│       ├── models.ts             # Domain model types
│       └── enums.ts              # Priority, Status, Role enums
│
└── styles/
    ├── globals.css               # Tailwind directives + CSS vars
    └── tokens.css                # Design tokens
```

### Why This Structure

**Module-based, not type-based**: Each feature is self-contained with its own components,
hooks, services, and types. This mirrors how you'd structure code in a real team — a
developer working on the board feature doesn't need to touch files scattered across
10 top-level folders.

**Shared is a platform layer**: The `shared/` directory acts as your internal component
library. Everything in it should be domain-agnostic — it knows nothing about issues,
projects, or boards.

**Services as API boundaries**: Each module has a `services/` folder that encapsulates
all API calls. This makes it trivial to mock for testing and swap implementations.

---

## 5. Backend Architecture

### Django App Structure

```
server/
├── manage.py
├── config/                        # Project configuration
│   ├── settings/
│   │   ├── base.py                # Shared settings
│   │   ├── development.py         # Dev overrides
│   │   └── production.py          # Prod overrides
│   ├── urls.py                    # Root URL conf
│   ├── asgi.py                    # ASGI for Channels
│   ├── wsgi.py
│   └── celery.py                  # Celery app config
│
├── apps/
│   ├── users/                     # Custom user model + auth
│   │   ├── models.py              # User model
│   │   ├── serializers.py         # UserSerializer, RegisterSerializer
│   │   ├── views.py               # AuthViewSet
│   │   ├── permissions.py         # IsAuthenticated variants
│   │   ├── tokens.py              # JWT utility functions
│   │   └── urls.py
│   │
│   ├── organizations/             # Multi-tenancy
│   │   ├── models.py              # Organization, Membership
│   │   ├── serializers.py
│   │   ├── views.py               # OrgViewSet, MembershipViewSet
│   │   ├── permissions.py         # OrgPermission (role-based)
│   │   ├── middleware.py          # OrgContextMiddleware
│   │   └── urls.py
│   │
│   ├── projects/
│   │   ├── models.py              # Project
│   │   ├── serializers.py
│   │   ├── views.py               # ProjectViewSet
│   │   ├── permissions.py
│   │   └── urls.py
│   │
│   ├── issues/                    # Core domain
│   │   ├── models.py              # Issue, Comment, Label, Activity
│   │   ├── serializers.py         # Nested serializers for detail/list
│   │   ├── views.py               # IssueViewSet, CommentViewSet
│   │   ├── filters.py             # django-filter FilterSets
│   │   ├── permissions.py
│   │   ├── signals.py             # Post-save for activity log
│   │   ├── services.py            # Business logic (not in views)
│   │   └── urls.py
│   │
│   ├── notifications/
│   │   ├── models.py              # Notification
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py               # Celery tasks
│   │   └── urls.py
│   │
│   └── analytics/
│       ├── views.py               # Dashboard aggregation endpoints
│       ├── services.py            # Query builders for stats
│       └── urls.py
│
├── core/                          # Shared utilities
│   ├── models.py                  # BaseModel (uuid pk, timestamps)
│   ├── pagination.py              # CursorPagination
│   ├── exceptions.py              # Custom exception handler
│   ├── middleware.py               # Request timing, correlation IDs
│   └── permissions.py             # Base permission classes
│
├── realtime/                      # Django Channels
│   ├── consumers.py               # BoardConsumer, NotificationConsumer
│   ├── routing.py                 # WebSocket URL routing
│   ├── middleware.py              # WS auth middleware (JWT)
│   └── serializers.py            # Event serializers
│
└── tests/
    ├── factories.py               # Model factories (factory_boy)
    ├── conftest.py                # Shared fixtures
    └── (mirrors apps/ structure)
```

### Key Backend Patterns

**1. Service Layer Pattern**
Views handle HTTP concerns. Business logic lives in `services.py`:

```python
# apps/issues/services.py
class IssueService:
    @staticmethod
    def create_issue(*, project, creator, **data) -> Issue:
        """
        Creates an issue with auto-incrementing identifier,
        logs activity, and broadcasts to WebSocket.
        """
        with transaction.atomic():
            identifier = IssueService._next_identifier(project)
            issue = Issue.objects.create(
                project=project,
                creator=creator,
                identifier=f"{project.key}-{identifier}",
                **data
            )
            Activity.objects.create(
                issue=issue,
                actor=creator,
                verb="created",
                target_type="issue",
            )
        # Async: broadcast + notify
        transaction.on_commit(
            lambda: broadcast_board_update.delay(
                project.id, "issue.created", IssueSerializer(issue).data
            )
        )
        return issue

    @staticmethod
    def move_issue(*, issue, new_status, new_position, actor) -> Issue:
        """
        Moves issue to new status/position with fractional indexing.
        """
        with transaction.atomic():
            old_status = issue.status
            issue.status = new_status
            issue.position = new_position  # Fractional index
            issue.save(update_fields=["status", "position", "updated_at"])

            Activity.objects.create(
                issue=issue,
                actor=actor,
                verb="moved",
                data={"from": old_status, "to": new_status},
            )
        return issue
```

**Why**: Views bloated with business logic is the #1 codebase smell in Django projects.
The service layer makes logic testable without HTTP, reusable across views and Celery
tasks, and keeps views thin (receive request → validate → call service → return response).

**2. Fractional Indexing for Position**
Instead of integer positions (which require reindexing on every reorder), use
lexicographic fractional indexing:

```python
# Position values like: "a0", "a1", "a0V", "a0l"
# When inserting between "a0" and "a1", generate "a0V"
# No need to update any other rows
```

This is what Linear actually uses. It's a significant talking point in interviews
because it shows you understand the performance implications of naive position integers.

**3. Organization-Scoped Queries**
Every queryset is scoped to the current organization via middleware:

```python
# apps/organizations/middleware.py
class OrgContextMiddleware:
    def __call__(self, request):
        org_slug = request.headers.get("X-Organization-Slug")
        if org_slug and request.user.is_authenticated:
            request.organization = get_object_or_404(
                Organization.objects.filter(
                    memberships__user=request.user
                ),
                slug=org_slug,
            )
        return self.get_response(request)
```

This prevents data leakage between organizations — a critical security concern
in multi-tenant systems.

---

## 6. Database Schema

```
┌─────────────────────────────┐       ┌─────────────────────────────┐
│         users_user          │       │    organizations_org        │
├─────────────────────────────┤       ├─────────────────────────────┤
│ id           UUID PK        │       │ id           UUID PK        │
│ email        UNIQUE         │       │ name         VARCHAR(100)   │
│ full_name    VARCHAR(150)   │       │ slug         UNIQUE         │
│ avatar_url   VARCHAR(500)   │       │ logo_url     VARCHAR(500)   │
│ is_active    BOOLEAN        │       │ created_at   TIMESTAMPTZ    │
│ created_at   TIMESTAMPTZ    │       │ updated_at   TIMESTAMPTZ    │
│ updated_at   TIMESTAMPTZ    │       └──────────────┬──────────────┘
└──────────────┬──────────────┘                      │
               │                                     │
               │    ┌────────────────────────────────┘
               │    │
         ┌─────┴────┴────────────────┐
         │  organizations_membership │
         ├───────────────────────────┤
         │ id           UUID PK      │
         │ user_id      FK → User    │
         │ org_id       FK → Org     │
         │ role         ENUM         │◄── owner | admin | member
         │ created_at   TIMESTAMPTZ  │
         │ UNIQUE(user_id, org_id)   │
         └───────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │    projects_project        │
         ├────────────────────────────┤
         │ id           UUID PK       │
         │ org_id       FK → Org      │
         │ name         VARCHAR(100)  │
         │ key          VARCHAR(10)   │◄── "PLN", "ENG" (for PLN-123)
         │ description  TEXT          │
         │ lead_id      FK → User     │
         │ icon         VARCHAR(50)   │
         │ color        VARCHAR(7)    │
         │ issue_count  INTEGER       │◄── Denormalized counter
         │ created_at   TIMESTAMPTZ   │
         │ updated_at   TIMESTAMPTZ   │
         │ UNIQUE(org_id, key)        │
         └──────────┬─────────────────┘
                    │
         ┌──────────┴─────────────────┐
         │      issues_issue          │
         ├────────────────────────────┤
         │ id           UUID PK       │
         │ project_id   FK → Project  │
         │ identifier   VARCHAR(20)   │◄── "PLN-42" (unique per project)
         │ title        VARCHAR(300)  │
         │ description  TEXT          │◄── Markdown content
         │ status       ENUM          │◄── backlog|todo|in_progress|review|done|cancelled
         │ priority     ENUM          │◄── urgent|high|medium|low|none
         │ position     VARCHAR(50)   │◄── Fractional index
         │ creator_id   FK → User     │
         │ assignee_id  FK → User?    │
         │ due_date     DATE?         │
         │ estimate     INTEGER?      │◄── Story points
         │ created_at   TIMESTAMPTZ   │
         │ updated_at   TIMESTAMPTZ   │
         │                            │
         │ INDEX(project_id, status, position) │◄── Board query
         │ INDEX(assignee_id)                  │
         │ GIN INDEX(search_vector)            │◄── Full-text search
         └───────┬──────────┬─────────┘
                 │          │
    ┌────────────┘          └────────────┐
    │                                    │
    ▼                                    ▼
┌──────────────────────┐   ┌───────────────────────────┐
│  issues_comment      │   │  issues_activity          │
├──────────────────────┤   ├───────────────────────────┤
│ id         UUID PK   │   │ id           UUID PK      │
│ issue_id   FK→Issue  │   │ issue_id     FK → Issue   │
│ author_id  FK→User   │   │ actor_id     FK → User    │
│ body       TEXT      │   │ verb         VARCHAR(50)  │◄── created|moved|assigned|...
│ created_at TSTZ      │   │ data         JSONB        │◄── {"from":"todo","to":"done"}
│ updated_at TSTZ      │   │ created_at   TIMESTAMPTZ  │
└──────────────────────┘   └───────────────────────────┘

┌──────────────────────┐   ┌───────────────────────────┐
│  issues_label        │   │  issues_issue_labels      │
├──────────────────────┤   ├───────────────────────────┤
│ id       UUID PK     │   │ issue_id   FK → Issue     │
│ org_id   FK → Org    │   │ label_id   FK → Label     │
│ name     VARCHAR(50) │   │ UNIQUE(issue_id, label_id)│
│ color    VARCHAR(7)  │   └───────────────────────────┘
│ UNIQUE(org_id, name) │
└──────────────────────┘

┌──────────────────────────────┐
│  notifications_notification  │
├──────────────────────────────┤
│ id           UUID PK         │
│ recipient_id FK → User       │
│ org_id       FK → Org        │
│ type         VARCHAR(50)     │◄── issue_assigned|mentioned|comment
│ title        VARCHAR(300)    │
│ data         JSONB           │◄── {issue_id, project_key, ...}
│ is_read      BOOLEAN         │
│ created_at   TIMESTAMPTZ     │
│ INDEX(recipient_id, is_read, created_at DESC) │
└──────────────────────────────┘
```

### Schema Design Decisions

**UUIDs as primary keys**: Prevents enumeration attacks, enables client-side ID
generation for optimistic creates, and is the standard for modern SaaS. Use
`uuid7` (time-ordered) for better index performance than random UUIDv4.

**Fractional indexing**: The `position` column on issues uses string-based
fractional indexing rather than integers. This means reordering a card between
two others requires updating only ONE row instead of shifting every row below.

**JSONB for activity data**: The `data` field on Activity uses JSONB because
activity events have variable shapes. "moved" has `{from, to}`, "assigned" has
`{assignee_id}`, etc. This avoids a sprawling polymorphic table.

**Denormalized `issue_count`**: Updated via signals. Avoids a COUNT(*) on every
project list render. This is a deliberate denormalization — call it out in interviews.

**GIN index for full-text search**: PostgreSQL's built-in full-text search with
`SearchVector` on `title` + `description`. For 1-week scope, this is vastly
superior to introducing Elasticsearch. Mention you'd add Elasticsearch at scale.

---

## 7. API Contract Design

### URL Structure (RESTful, organization-scoped)

```
Base: /api/v1/

Auth:
  POST   /auth/register/
  POST   /auth/login/                    → { access, refresh }
  POST   /auth/refresh/                  → { access }
  POST   /auth/logout/
  GET    /auth/me/                       → User profile

Organizations:
  GET    /orgs/                          → List user's orgs
  POST   /orgs/                          → Create org
  GET    /orgs/:slug/                    → Org detail
  PATCH  /orgs/:slug/                    → Update org
  GET    /orgs/:slug/members/            → List members
  POST   /orgs/:slug/members/invite/     → Invite member
  PATCH  /orgs/:slug/members/:id/        → Update role
  DELETE /orgs/:slug/members/:id/        → Remove member

Projects (org-scoped via header):
  GET    /projects/                      → List projects
  POST   /projects/                      → Create project
  GET    /projects/:key/                 → Project detail
  PATCH  /projects/:key/                 → Update project
  DELETE /projects/:key/                 → Archive project

Issues:
  GET    /projects/:key/issues/          → List/filter issues
  POST   /projects/:key/issues/          → Create issue
  GET    /issues/:identifier/            → Issue detail (PLN-42)
  PATCH  /issues/:identifier/            → Update issue
  DELETE /issues/:identifier/            → Archive issue
  POST   /issues/:identifier/move/       → Move (status + position)

Comments:
  GET    /issues/:identifier/comments/   → List comments
  POST   /issues/:identifier/comments/   → Add comment
  PATCH  /comments/:id/                  → Edit comment
  DELETE /comments/:id/                  → Delete comment

Labels:
  GET    /labels/                        → Org labels
  POST   /labels/                        → Create label

Analytics:
  GET    /analytics/dashboard/           → Dashboard stats
  GET    /analytics/burndown/:key/       → Project burndown

Notifications:
  GET    /notifications/                 → User notifications
  POST   /notifications/mark-read/       → Mark as read

Search:
  GET    /search/?q=...&type=issue       → Global search
```

### Response Envelope

```typescript
// Success
{
  "data": T | T[],
  "meta": {
    "cursor": "next_cursor_value",   // For paginated lists
    "total_count": 142               // When available
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {                      // Field-level errors
      "title": ["This field is required."]
    }
  }
}
```

### Why Cursor Pagination
Offset pagination breaks with real-time data (items shift between pages).
Cursor pagination is stable, performs better at scale (no OFFSET scan),
and is what Linear/Stripe/GitHub use. Use `created_at` + `id` as cursor.

---

## 8. Authentication Flow

```
┌──────────┐                    ┌──────────┐                  ┌──────────┐
│  Client  │                    │  Server  │                  │   DB     │
└────┬─────┘                    └────┬─────┘                  └────┬─────┘
     │                               │                             │
     │  POST /auth/login/            │                             │
     │  {email, password}            │                             │
     │──────────────────────────────►│                             │
     │                               │  Verify credentials        │
     │                               │────────────────────────────►│
     │                               │◄────────────────────────────│
     │                               │                             │
     │  { access_token (15m),        │                             │
     │    refresh_token (7d) }       │                             │
     │◄──────────────────────────────│                             │
     │                               │                             │
     │  Store refresh in httpOnly    │                             │
     │  cookie, access in memory     │                             │
     │                               │                             │
     │  GET /projects/               │                             │
     │  Authorization: Bearer {at}   │                             │
     │──────────────────────────────►│                             │
     │                               │  Decode JWT, verify exp    │
     │  200 OK                       │                             │
     │◄──────────────────────────────│                             │
     │                               │                             │
     │  ── Token expires (15m) ──    │                             │
     │                               │                             │
     │  GET /projects/ → 401         │                             │
     │◄──────────────────────────────│                             │
     │                               │                             │
     │  POST /auth/refresh/          │                             │
     │  (httpOnly cookie sent)       │                             │
     │──────────────────────────────►│                             │
     │                               │  Verify refresh token      │
     │  { new access_token }         │                             │
     │◄──────────────────────────────│                             │
     │                               │                             │
     │  Retry original request       │                             │
     │──────────────────────────────►│                             │
```

### Implementation Details

**Access token**: Short-lived JWT (15 min), stored in memory (not localStorage).
Contains `user_id`, `email`, `org_memberships` claim.

**Refresh token**: Long-lived (7 days), stored in httpOnly, Secure, SameSite=Strict
cookie. Rotated on use (old token invalidated).

**Why not localStorage for access tokens**: XSS vulnerability. An attacker who injects
JS can steal tokens from localStorage. Memory is cleared on tab close and inaccessible
to injected scripts.

**Axios interceptor for silent refresh**:

```typescript
// shared/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await refreshAccessToken(); // POST /auth/refresh/
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### RBAC Implementation

```python
# Roles hierarchy
ROLES = {
    "owner": {"can_delete_org", "can_manage_members", "can_manage_projects",
              "can_manage_issues", "can_comment"},
    "admin": {"can_manage_members", "can_manage_projects",
              "can_manage_issues", "can_comment"},
    "member": {"can_manage_issues", "can_comment"},
}

# Permission class
class OrgRolePermission(BasePermission):
    required_permission = None

    def has_permission(self, request, view):
        membership = request.organization.memberships.filter(
            user=request.user
        ).first()
        if not membership:
            return False
        role_perms = ROLES.get(membership.role, set())
        return self.required_permission in role_perms
```

---

## 9. State Management Strategy

### The Rule: Server State ≠ UI State

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                            │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │     React Query              │  │      Zustand             │ │
│  │     (Server State)           │  │      (UI State)          │ │
│  │                              │  │                          │ │
│  │  • Issues list + detail      │  │  • Sidebar open/closed   │ │
│  │  • Projects                  │  │  • Active filters        │ │
│  │  • Comments                  │  │  • Selected issue ID     │ │
│  │  • Organization data         │  │  • Command palette open  │ │
│  │  • Notifications             │  │  • Theme preference      │ │
│  │  • Dashboard analytics       │  │  • Board view mode       │ │
│  │                              │  │                          │ │
│  │  Cache invalidation          │  │  No persistence needed   │ │
│  │  Background refetch          │  │  Instant, synchronous    │ │
│  │  Optimistic updates          │  │  Subscribable slices     │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### React Query Configuration

```typescript
// shared/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,          // 1 minute before background refetch
      gcTime: 1000 * 60 * 10,        // 10 min garbage collection
      retry: 1,                       // Single retry
      refetchOnWindowFocus: true,     // Sync on tab switch
      refetchOnReconnect: true,       // Sync on network restore
    },
  },
});

// Query key factory (prevents key collisions, enables targeted invalidation)
export const queryKeys = {
  issues: {
    all: (projectKey: string) => ["issues", projectKey] as const,
    detail: (identifier: string) => ["issues", "detail", identifier] as const,
    board: (projectKey: string, filters: Filters) =>
      ["issues", projectKey, "board", filters] as const,
  },
  projects: {
    all: () => ["projects"] as const,
    detail: (key: string) => ["projects", key] as const,
  },
  // ...
};
```

### Zustand Store (UI Only)

```typescript
// shared/stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  activeIssueId: string | null;
  commandPaletteOpen: boolean;
  boardViewMode: "kanban" | "list";
  toggleSidebar: () => void;
  setActiveIssue: (id: string | null) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeIssueId: null,
  commandPaletteOpen: false,
  boardViewMode: "kanban",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveIssue: (id) => set({ activeIssueId: id }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
```

**Why this split matters**: React Query handles server synchronization (cache,
background refetch, optimistic mutations, error retry). Zustand handles ephemeral
UI state. Mixing these (e.g., putting API data in Redux) is the most common
architectural mistake in React apps. Call this out in interviews.

---

## 10. Optimistic Update Strategy

This is the feature that separates production apps from tutorials.

```typescript
// modules/issue/hooks/useIssueMutations.ts
export function useMoveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      identifier: string;
      status: IssueStatus;
      position: string;
    }) => issueApi.moveIssue(params),

    // 1. Snapshot current state BEFORE mutation
    onMutate: async (params) => {
      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.all(projectKey) });

      // Snapshot the previous board state
      const previousBoard = queryClient.getQueryData(
        queryKeys.issues.board(projectKey, filters)
      );

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.issues.board(projectKey, filters),
        (old: BoardData) => {
          if (!old) return old;
          return moveBoardItem(old, params);  // Pure function
        }
      );

      // Return snapshot for rollback
      return { previousBoard };
    },

    // 2. Rollback on error
    onError: (_err, _params, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          queryKeys.issues.board(projectKey, filters),
          context.previousBoard
        );
      }
      toast.error("Failed to move issue. Reverted.");
    },

    // 3. Sync with server truth on settlement
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.all(projectKey),
      });
    },
  });
}
```

### Where to Apply Optimistic Updates

| Action | Optimistic? | Why |
|---|---|---|
| Move issue on board | Yes | Drag-drop must feel instant |
| Change priority/assignee | Yes | Single-field updates, easy rollback |
| Create issue | Yes | Show immediately, replace temp ID on success |
| Delete issue | Yes | Remove from list, restore on failure |
| Add comment | Yes | Append to list with "sending" indicator |
| Create project | No | Navigates to new page, server response needed |
| Edit issue description | No | Use debounced autosave instead |

---

## 11. WebSocket / Event Architecture

### Channel Architecture

```
WebSocket URL: ws://api.planera.dev/ws/board/{project_key}/
WebSocket URL: ws://api.planera.dev/ws/notifications/

Message Protocol:
{
  "type": "issue.moved",
  "payload": {
    "issue_id": "uuid",
    "identifier": "PLN-42",
    "old_status": "todo",
    "new_status": "in_progress",
    "position": "a0V",
    "actor_id": "uuid"           // To skip echo for the actor
  },
  "timestamp": "2025-05-25T10:30:00Z"
}

Event Types:
  Board channel:
    - issue.created
    - issue.updated
    - issue.moved
    - issue.deleted
    - issue.assigned

  Notification channel:
    - notification.new
    - notification.read
```

### Django Channels Consumer

```python
# realtime/consumers.py
class BoardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.project_key = self.scope["url_route"]["kwargs"]["project_key"]
        self.group_name = f"board_{self.project_key}"
        self.user = self.scope["user"]

        # Verify project access
        has_access = await self.verify_access()
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def board_event(self, event):
        """Broadcast board events to all connected clients."""
        await self.send_json(event["data"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )
```

### Client-Side WebSocket with Reconnection

```typescript
// shared/lib/ws.ts
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private handlers = new Map<string, Set<(payload: any) => void>>();

  connect(url: string, token: string) {
    this.ws = new WebSocket(`${url}?token=${token}`);

    this.ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      this.handlers.get(type)?.forEach((handler) => handler(payload));
    };

    this.ws.onclose = () => {
      this.scheduleReconnect(url, token);
    };
  }

  private scheduleReconnect(url: string, token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(url, token);
    }, delay);
  }

  subscribe(type: string, handler: (payload: any) => void) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler); // Unsubscribe
  }
}
```

### Integration with React Query

```typescript
// modules/board/hooks/useBoardSocket.ts
export function useBoardSocket(projectKey: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const ws = new WebSocketManager();
    ws.connect(`${WS_URL}/ws/board/${projectKey}/`, getAccessToken());

    const unsubMove = ws.subscribe("issue.moved", (payload) => {
      // Skip if we're the actor (already applied optimistically)
      if (payload.actor_id === user.id) return;

      // Update React Query cache with remote change
      queryClient.setQueryData(
        queryKeys.issues.board(projectKey, filters),
        (old: BoardData) => moveBoardItem(old, payload)
      );
    });

    return () => {
      unsubMove();
      ws.disconnect();
    };
  }, [projectKey]);
}
```

**Echo suppression** is critical: when user A drags an issue, they get the optimistic
update immediately. The server then broadcasts to all clients. Without checking
`actor_id`, user A would see the update applied twice (once optimistic, once from WS).

---

## 12. Reusable Component Strategy

### UI Primitives (Compound Component Pattern)

```typescript
// shared/components/ui/DropdownMenu.tsx
// Uses compound components — the same pattern as Radix UI

<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={handleEdit}>
      Edit issue
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={handleDelete} variant="danger">
      Delete issue
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

### Button Component (Variance-based)

```typescript
// shared/components/ui/Button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium" +
  " transition-colors focus-visible:outline-none focus-visible:ring-2" +
  " disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
);
```

### Data-Fetching Pattern (Custom Hook)

```typescript
// Pattern: Every API call wrapped in a custom hook
// modules/issue/hooks/useIssues.ts
export function useIssues(projectKey: string, filters?: IssueFilters) {
  return useQuery({
    queryKey: queryKeys.issues.board(projectKey, filters),
    queryFn: () => issueApi.listIssues(projectKey, filters),
    select: (data) => groupByStatus(data),  // Transform for board view
  });
}

// Usage in component — clean separation
function BoardView({ projectKey }: { projectKey: string }) {
  const { data: columns, isLoading, error } = useIssues(projectKey, filters);

  if (isLoading) return <BoardSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <Board columns={columns} />;
}
```

---

## 13. Docker Setup

```yaml
# docker-compose.yml
version: "3.9"

services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./client/src:/app/src    # Hot reload
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
      - VITE_WS_URL=ws://localhost:8000
    depends_on:
      - api

  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./server:/app
    environment:
      - DATABASE_URL=postgres://planera:planera@db:5432/planera
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.development
      - SECRET_KEY=dev-secret-key-change-in-prod
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: >
      sh -c "python manage.py migrate &&
             daphne -b 0.0.0.0 -p 8000 config.asgi:application"

  celery:
    build:
      context: ./server
      dockerfile: Dockerfile
    command: celery -A config.celery worker -l info
    volumes:
      - ./server:/app
    environment:
      - DATABASE_URL=postgres://planera:planera@db:5432/planera
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.development
    depends_on:
      - api
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=planera
      - POSTGRES_USER=planera
      - POSTGRES_PASSWORD=planera
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U planera"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

```dockerfile
# server/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
```

```dockerfile
# client/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Why Daphne**: ASGI server that supports both HTTP and WebSocket. In production
you'd use `uvicorn` with workers, but Daphne integrates cleanly with Django Channels
for development.

---

## 14. Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Production                         │
│                                                     │
│  ┌─────────────┐                                    │
│  │ Cloudflare  │                                    │
│  │ CDN + DNS   │                                    │
│  └──────┬──────┘                                    │
│         │                                           │
│  ┌──────┴──────────────────────────────┐            │
│  │         Railway / Render / Fly.io   │            │
│  │                                     │            │
│  │  ┌──────────┐  ┌────────────────┐  │            │
│  │  │ Vite     │  │ Django + ASGI  │  │            │
│  │  │ Static   │  │ (Daphne)       │  │            │
│  │  │ Build    │  │                │  │            │
│  │  └──────────┘  └───────┬────────┘  │            │
│  │                        │           │            │
│  │              ┌─────────┴────────┐  │            │
│  │              │ Celery Worker    │  │            │
│  │              └──────────────────┘  │            │
│  └──────────────────────────────────────┘            │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐               │
│  │ Neon / Supabase│  │ Upstash      │               │
│  │ (Postgres)   │    │ (Redis)      │               │
│  └──────────────┘    └──────────────┘               │
└─────────────────────────────────────────────────────┘
```

**For demo**: Railway is the fastest path. `railway up` deploys from Docker Compose
in minutes. Free tier handles demo load. Neon gives free managed Postgres.
Upstash gives free managed Redis with WebSocket-compatible connections.

---

## 15. Clean Code Conventions

### Python (Backend)
```python
# Type hints everywhere
def get_issues_for_board(
    project: Project,
    filters: IssueFilterParams | None = None,
) -> QuerySet[Issue]:
    ...

# Explicit over implicit
# BAD:  Issue.objects.filter(project__org=org)
# GOOD: Issue.objects.filter(project__org=request.organization)
#       ↑ Uses middleware-injected org, scoped automatically

# Service functions are verbs
IssueService.create_issue(...)
IssueService.move_issue(...)
IssueService.assign_issue(...)

# Serializers define the API surface explicitly
class IssueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no description/comments."""
    assignee = UserMinimalSerializer(read_only=True)
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id", "identifier", "title", "status", "priority",
            "position", "assignee", "labels", "created_at",
        ]
```

### TypeScript (Frontend)
```typescript
// Strict types — no `any`
// Discriminated unions for API responses
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };

// Enums as const objects (not TS enums — they're broken)
export const IssueStatus = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

// Component props: explicit, documented
interface BoardCardProps {
  issue: IssueListItem;
  isDragging?: boolean;
  onSelect: (identifier: string) => void;
}

// File naming: kebab-case for files, PascalCase for components
// board-card.tsx exports BoardCard
// use-board-dnd.ts exports useBoardDnD
```

### Naming Conventions Summary
| Layer | Convention | Example |
|---|---|---|
| Django models | singular PascalCase | `Issue`, `Membership` |
| Django views | PascalCase + ViewSet | `IssueViewSet` |
| Django URLs | kebab-case | `/projects/:key/issues/` |
| React components | PascalCase | `BoardCard` |
| React hooks | camelCase with use prefix | `useBoardDnD` |
| React files | kebab-case.tsx | `board-card.tsx` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |
| API query keys | dot.notation in factory | `queryKeys.issues.board(...)` |

---

## 16. Scaling Considerations (Discuss in Interview)

### What Would Change at 100K Users

**Database**:
- Add read replicas for analytics queries
- Partition `issues_activity` by `created_at` (time-series pattern)
- Move to connection pooling (PgBouncer)
- Consider CQRS: separate write model from read model for board queries

**Search**:
- Move from PostgreSQL FTS to Elasticsearch/Meilisearch
- Index issues, comments, projects for cross-entity search

**WebSockets**:
- Replace in-process Channels with dedicated WS service
- Use Redis Streams instead of channel layer for guaranteed delivery
- Add presence service (who's viewing which board)

**Caching**:
- Cache board state per project in Redis (invalidate on write)
- Cache user permissions (invalidate on membership change)
- Edge caching for static API responses (project list)

**Infrastructure**:
- Move to Kubernetes for horizontal scaling
- Separate API and WebSocket services
- Add API gateway (rate limiting, request coalescing)
- CDN for frontend assets

**What NOT to do prematurely**: Don't mention microservices unless asked why.
The monolith with clear boundaries is correct at this scale. Going micro
too early is the most expensive architectural mistake in startups.

---

## 17. What to Prioritize for Maximum Interview Impact

### Tier 1: Must Demo (Architecture Depth)
1. **Kanban drag-and-drop with optimistic updates**: Shows mastery of complex
   client state, server sync, and UX polish
2. **Real-time board sync**: Open two browsers, drag in one, see it move in
   the other. This is the "wow" moment.
3. **RBAC demonstration**: Switch between owner and member accounts,
   show different permissions. Signals security thinking.
4. **Command palette (Cmd+K)**: Shows product sense and attention to
   keyboard-first UX

### Tier 2: Should Demo (Engineering Quality)
5. **Clean API responses**: Show Postman/Thunder with consistent envelopes
6. **Database schema**: Show the ERD diagram, explain fractional indexing
7. **Docker one-command setup**: `docker compose up` and everything works
8. **Activity timeline**: Show event sourcing pattern on issue detail

### Tier 3: Mention But Don't Demo
9. **Scaling strategy**: "Here's what I'd change at 100K users"
10. **Monitoring**: "I'd add Sentry + Datadog, here's where I'd put spans"
11. **CI/CD pipeline**: "I'd add GitHub Actions with lint, test, build, deploy"
12. **Feature flags**: "I'd use LaunchDarkly/Unleash for gradual rollouts"

### What Interviewers Are Actually Evaluating
- **System design thinking**: Can you reason about tradeoffs?
- **Production awareness**: Error handling, edge cases, security
- **Code organization**: Is the codebase navigable by a stranger?
- **UX sensibility**: Does the product feel good, not just work?
- **Communication**: Can you explain WHY you made each decision?

---

## 18. Day-by-Day Execution Plan

### Day 1 (Monday): Foundation
**Morning**:
- [ ] Initialize monorepo: `client/` + `server/`
- [ ] Docker Compose with all services
- [ ] Django project scaffold with custom User model
- [ ] Vite + React + TypeScript + Tailwind setup
- [ ] Install all dependencies (listed below)

**Afternoon**:
- [ ] Auth system: JWT with refresh token rotation
- [ ] Login + Register pages (functional, not styled)
- [ ] Axios interceptors for auth
- [ ] Django: Organization + Membership models + migrations
- [ ] Basic API: register, login, create org

**Deliverable**: Can register, login, and create an organization via API.

### Day 2 (Tuesday): Core Domain Models
**Morning**:
- [ ] Project model + API (CRUD)
- [ ] Issue model with all fields + API (CRUD + filters)
- [ ] Label model + many-to-many with Issue
- [ ] Django admin registration for all models
- [ ] Seed script: generate sample data

**Afternoon**:
- [ ] Frontend: App shell (sidebar + main layout)
- [ ] Frontend: Project list page
- [ ] Frontend: React Query hooks for projects + issues
- [ ] Frontend: Basic issue list view

**Deliverable**: Navigate between projects, see list of issues.

### Day 3 (Wednesday): Kanban Board (The Hero Feature)
**Morning**:
- [ ] Backend: Issue move endpoint with fractional indexing
- [ ] Backend: Board query (issues grouped by status, ordered by position)
- [ ] Frontend: DnD Kit setup with board layout
- [ ] Frontend: BoardColumn + BoardCard components

**Afternoon**:
- [ ] Optimistic updates for drag-and-drop
- [ ] Smooth drag animations and visual feedback
- [ ] Quick-create issue from board (inline form)
- [ ] Board filters (assignee, priority, label)

**Deliverable**: Fully functional Kanban board with drag-and-drop.

### Day 4 (Thursday): Issue Detail + Comments + Activity
**Morning**:
- [ ] Issue detail slide-over panel
- [ ] Inline property editing (status, priority, assignee, labels)
- [ ] Comment model + API
- [ ] Comment thread in detail panel

**Afternoon**:
- [ ] Activity model + auto-logging via Django signals
- [ ] Activity timeline in detail panel
- [ ] Issue description with Markdown support
- [ ] Delete/archive issue

**Deliverable**: Full issue lifecycle: create → edit → comment → track activity.

### Day 5 (Friday): Real-time + Search + Notifications
**Morning**:
- [ ] Django Channels setup + BoardConsumer
- [ ] WebSocket client with reconnection
- [ ] Real-time board sync (issue.moved, issue.created)
- [ ] Echo suppression for actor

**Afternoon**:
- [ ] PostgreSQL full-text search endpoint
- [ ] Frontend search: Command Palette (Cmd+K)
- [ ] Notification model + API
- [ ] Notification panel with unread badge

**Deliverable**: Two-browser real-time demo works. Search works.

### Day 6 (Saturday): Dashboard + RBAC + Polish
**Morning**:
- [ ] Dashboard page: issue counts by status, priority distribution
- [ ] Simple burndown/velocity chart (Recharts)
- [ ] RBAC enforcement on all endpoints
- [ ] RBAC visual: hide admin controls for members

**Afternoon**:
- [ ] UI polish pass: consistent spacing, colors, shadows
- [ ] Loading skeletons for all data-fetching states
- [ ] Error states and empty states
- [ ] Toast notifications for mutations
- [ ] Keyboard shortcuts (Cmd+K, Esc to close panels)

**Deliverable**: Dashboard populated. RBAC visible. UI feels polished.

### Day 7 (Sunday): Final Polish + Deploy + Prep
**Morning**:
- [ ] End-to-end happy path testing
- [ ] Fix visual bugs and edge cases
- [ ] Add sample data seeding script (realistic demo data)
- [ ] Deploy to Railway / Render

**Afternoon**:
- [ ] Write README.md with architecture overview
- [ ] Record 3-minute demo video (optional but powerful)
- [ ] Prepare talking points for each architectural decision
- [ ] Test deployed version end-to-end

**Deliverable**: Live URL, clean repo, ready for presentation.

---

## 19. Senior-Level Engineering Decisions and Tradeoffs

### Decision 1: Monolith over Microservices
**Chose**: Django monolith with clear app boundaries
**Why**: A well-structured monolith is the correct architecture for a small team
and early-stage product. Microservices add operational complexity (service mesh,
distributed tracing, eventual consistency) without benefit at this scale.
**Tradeoff**: If we needed to scale the WebSocket layer independently, we'd
extract it first — that's the natural seam.

### Decision 2: PostgreSQL FTS over Elasticsearch
**Chose**: PostgreSQL `SearchVector` + `GIN` index
**Why**: Eliminates an entire infrastructure dependency. PG FTS handles millions
of documents. At our demo scale, it's more than sufficient.
**Tradeoff**: No fuzzy matching, no "did you mean", no faceted search. We'd add
Meilisearch (not Elasticsearch — better DX) when search becomes a core workflow.

### Decision 3: Fractional Indexing over Integer Positions
**Chose**: String-based lexicographic ordering for card positions
**Why**: Reordering with integers requires updating O(n) rows (every item below
the insertion point). Fractional indexing updates exactly 1 row.
**Tradeoff**: Position strings grow over time with many reorders. We'd add a
background task to "rebalance" positions periodically (compaction).

### Decision 4: React Query over Redux/RTK Query
**Chose**: React Query for server state, Zustand for UI state
**Why**: React Query's mental model (cache + invalidation) maps directly to how
server data works. Redux's mental model (global store + reducers) adds ceremony
without benefit for server state. RTK Query is better than raw Redux but still
carries Redux's boilerplate.
**Tradeoff**: Two state libraries to learn. Worth it for the clean separation.

### Decision 5: Cursor Pagination over Offset
**Chose**: Cursor-based pagination (keyset pagination)
**Why**: Stable results when items are created/deleted between pages. O(1) query
performance vs O(n) for OFFSET. Used by Linear, Stripe, GitHub.
**Tradeoff**: Can't jump to "page 47". Acceptable for our use case — we're not
building a phone book.

### Decision 6: JWT with Refresh Token Rotation
**Chose**: Short-lived access token (15m) + rotating refresh token
**Why**: Stateless auth for API requests (no DB lookup per request). Refresh
rotation means a stolen refresh token is only valid for one use.
**Tradeoff**: Token revocation requires a blacklist (we'd use Redis). For 1-week
scope, we accept that a compromised access token is valid for up to 15 minutes.

### Decision 7: Event Sourcing-Inspired Activity Log
**Chose**: Append-only Activity table with JSONB payload
**Why**: Full audit trail of every change. Enables "undo" in the future. The
JSONB payload avoids schema changes when adding new activity types.
**Tradeoff**: Not true event sourcing (we don't rebuild state from events).
It's a pragmatic hybrid — structured events for audit, traditional CRUD for state.

### Decision 8: CSS Utility-First (Tailwind) over CSS Modules
**Chose**: Tailwind CSS
**Why**: Fastest iteration speed. No context-switching between files. Built-in
design system (spacing, color scales). Dead code elimination is automatic.
**Tradeoff**: Markup is verbose. Mitigated by extracting components (not classes).
We never `@apply` — that defeats the purpose.

---

## 20. Key Dependencies

### Backend (requirements.txt)
```
django==5.1
djangorestframework==3.15
djangorestframework-simplejwt==5.3
django-cors-headers==4.4
django-filter==24.3
channels==4.1
channels-redis==4.2
daphne==4.1
psycopg[binary]==3.2
redis==5.1
celery==5.4
factory-boy==3.3
python-decouple==3.8
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "react-router-dom": "^6.26",
    "@tanstack/react-query": "^5.56",
    "zustand": "^4.5",
    "@dnd-kit/core": "^6.1",
    "@dnd-kit/sortable": "^8.0",
    "@dnd-kit/utilities": "^3.2",
    "axios": "^1.7",
    "class-variance-authority": "^0.7",
    "clsx": "^2.1",
    "tailwind-merge": "^2.5",
    "lucide-react": "^0.441",
    "recharts": "^2.12",
    "react-hot-toast": "^2.4",
    "react-markdown": "^9.0",
    "date-fns": "^3.6"
  },
  "devDependencies": {
    "typescript": "^5.6",
    "vite": "^5.4",
    "@vitejs/plugin-react": "^4.3",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10.4",
    "postcss": "^8.4",
    "eslint": "^9.10",
    "@typescript-eslint/eslint-plugin": "^8.5",
    "prettier": "^3.3",
    "prettier-plugin-tailwindcss": "^0.6"
  }
}
```

---

## 21. UI Design Direction

### Visual Language
- **Dark mode primary** (like Linear) with light mode toggle
- **Monospace identifiers**: Issue IDs like `PLN-42` in mono font
- **Compact density**: 32px row height in lists, 8px base spacing unit
- **Muted chrome**: Gray sidebar and borders, color only for status/priority
- **Status colors**: Backlog (gray), Todo (white), In Progress (yellow),
  Review (blue), Done (green), Cancelled (red)
- **Priority icons**: Urgent (red !!!), High (orange ↑), Medium (yellow —),
  Low (blue ↓), None (gray ···)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────────────┐ │
│ │          │ │  Breadcrumb: Planera > Project > Board     │ │
│ │  Sidebar │ ├────────────────────────────────────────────┤ │
│ │          │ │  Toolbar: Filters | Search | View Toggle   │ │
│ │  - Home  │ ├────────────────────────────────────────────┤ │
│ │  - Issues│ │                                            │ │
│ │  - Board │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│ │  - Prjcts│ │  │ Backlog │ │  Todo   │ │  In     │     │ │
│ │  - Dash  │ │  │         │ │         │ │  Prog   │ ... │ │
│ │          │ │  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │     │ │
│ │  ─────── │ │  │ │Card │ │ │ │Card │ │ │ │Card │ │     │ │
│ │  - Notifs│ │  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │     │ │
│ │  - Settgs│ │  │ ┌─────┐ │ │ ┌─────┐ │ │         │     │ │
│ │          │ │  │ │Card │ │ │ │Card │ │ │         │     │ │
│ │          │ │  │ └─────┘ │ │ └─────┘ │ │         │     │ │
│ └──────────┘ │  └─────────┘ └─────────┘ └─────────┘     │ │
│              └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Design References to Study
- **Linear** (linear.app): The gold standard for this project type
- **Height** (height.app): Excellent task detail panel
- **Plane** (plane.so): Open-source alternative with good DnD
- **Vercel Dashboard**: For sidebar and navigation patterns
- **Raycast**: For command palette inspiration

---

## Summary: Architecture at a Glance

```
Frontend:  React 18 + TypeScript + Tailwind + React Query + Zustand + DnD Kit
Backend:   Django 5.1 + DRF + Django Channels + Celery
Database:  PostgreSQL 15 (JSONB + FTS + GIN) + Redis 7
Auth:      JWT (short access + rotating refresh) + RBAC
Real-time: Django Channels (WebSocket) + Redis channel layer
Deploy:    Docker Compose → Railway/Render + Neon PG + Upstash Redis
```

**Build fewer features. Build them like a Staff Engineer.**
