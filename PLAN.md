# Planera — Development Execution Plan

> A production-grade, Linear-inspired project management platform.
> Executable top-to-bottom. Every task ≤ 2 hours. No task references anything unbuilt.
> Day 1–2: Foundation. Day 3: Kanban hero. Day 4–5: Depth. Day 6–7: Polish + Deploy.

---

## Naming Conventions (Locked)

| Concept | UI / API label | Django app | DB table prefix |
|---|---|---|---|
| Tenant / account | **Workspace** | `organizations` | `organizations_` |
| Workspace URL param | `:slug` | — | — |
| Header sent by client | `X-Organization-Slug` | — | — |
| Issue identifier | `PLN-42` | `issues` | `issues_` |

> All plan sections use "Workspace" for the product concept. The Django app remains `organizations/` — it already exists on disk and renaming it would break migrations.

---

## Known Version Fixes (Applied — Do Not Revert)

These pins differ from the original architecture doc due to compatibility issues discovered during setup:

| Package | Original | Fixed | Reason |
|---|---|---|---|
| `psycopg[binary]` | `==3.2` | `==3.2.3` | `3.2` resolved to unpublished `3.2.0.dev1` |
| `djangorestframework-simplejwt` | `==5.3` | `==5.3.1` + `setuptools>=69.0` | `5.3.0` imports `pkg_resources` missing in Python 3.12-slim |
| `eslint` | `^9.10` | `^10.0.0` | Vite scaffold installs `@eslint/js@^10` which requires eslint 10 |
| Client Dockerfile CMD | `--host 0.0.0.0` | `--host 0.0.0.0 --port 3000` | Vite defaults to 5173; docker-compose maps host 3000 → container 3000 |
| `daphne` in INSTALLED_APPS | last | **first** (before `staticfiles`) | Daphne requires it to precede `django.contrib.staticfiles` |
| `config/settings.py` | flat file | `config/settings/` package | `startproject` creates a flat file; we need base/development/production split |
| `INSTALLED_APPS` app paths | `apps.users` etc. | `users` etc. | `startapp` creates top-level dirs, not inside an `apps/` subdirectory |

---

## Table of Contents

1. [Project Initialization Checklist](#1-project-initialization-checklist)
2. [Implementation Order](#2-implementation-order)
3. [Task Breakdown by Layer](#3-task-breakdown-by-layer)
4. [Critical Path](#4-critical-path)
5. [Risk Register](#5-risk-register)

---

## 1. Project Initialization Checklist

> **Status**: Fully completed. Docker Compose is running with all 5 services healthy.
> The commands below reflect what was actually run (with fixes applied).

### 1.1 — Create Monorepo Root

```bash
mkdir planera && cd planera
git init
printf 'node_modules/\n__pycache__/\n*.pyc\n.env\n.env.*\n!.env.example\n.DS_Store\ndist/\nbuild/\n' > .gitignore
mkdir client server
```

### 1.2 — Scaffold Frontend (`/client`)

```bash
cd client
npm create vite@latest . -- --template react-ts
npm install

npm install \
  react-router-dom@^6.26 \
  @tanstack/react-query@^5.56 \
  @tanstack/react-query-devtools@^5.56 \
  zustand@^4.5 \
  @dnd-kit/core@^6.1 \
  @dnd-kit/sortable@^8.0 \
  @dnd-kit/utilities@^3.2 \
  axios@^1.7 \
  class-variance-authority@^0.7 \
  clsx@^2.1 \
  tailwind-merge@^2.5 \
  lucide-react@^0.441 \
  recharts@^2.12 \
  react-hot-toast@^2.4 \
  react-markdown@^9.0 \
  date-fns@^3.6

npm install -D \
  tailwindcss@^3.4 \
  autoprefixer@^10.4 \
  postcss@^8.4 \
  eslint@^10.0.0 \
  @typescript-eslint/eslint-plugin@^8.5 \
  prettier@^3.3 \
  prettier-plugin-tailwindcss@^0.6

npx tailwindcss init -p
```

**Verify**: `npm run dev` opens Vite at `http://localhost:5173`.

### 1.3 — Scaffold Backend (`/server`)

```bash
cd ../server
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install \
  django==5.1 \
  djangorestframework==3.15 \
  djangorestframework-simplejwt==5.3.1 \
  setuptools>=69.0 \
  django-cors-headers==4.4 \
  django-filter==24.3 \
  channels==4.1 \
  channels-redis==4.2 \
  daphne==4.1 \
  "psycopg[binary]==3.2.3" \
  redis==5.1 \
  celery==5.4 \
  factory-boy==3.3 \
  python-decouple==3.8 \
  whitenoise==6.7.0

pip freeze > requirements.txt

django-admin startproject config .

python manage.py startapp users
python manage.py startapp organizations
python manage.py startapp projects
python manage.py startapp issues
python manage.py startapp notifications
python manage.py startapp analytics

mkdir -p core realtime tests
touch core/__init__.py core/models.py core/pagination.py core/exceptions.py \
      core/middleware.py core/permissions.py core/fractional_index.py
touch realtime/__init__.py realtime/consumers.py realtime/routing.py \
      realtime/middleware.py realtime/serializers.py
touch tests/__init__.py tests/factories.py tests/conftest.py
```

**Important**: After `startproject`, convert `config/settings.py` to a package:
```bash
mkdir config/settings
mv config/settings.py config/settings/base.py
touch config/settings/__init__.py
```

Then create `config/settings/development.py` and `config/settings/production.py` (see T01).

Update `manage.py`, `config/asgi.py`, and `config/wsgi.py` to use:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
```

**Verify**: `python manage.py check` returns no errors.

### 1.4 — Docker Compose

`planera/docker-compose.yml` (remove the `version:` line — it is obsolete):

```yaml
services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./client/src:/app/src
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
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.development
      - SECRET_KEY=dev-secret-key-change-in-prod
      - POSTGRES_DB=planera
      - POSTGRES_USER=planera
      - POSTGRES_PASSWORD=planera
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: >
      sh -c "python manage.py collectstatic --noinput &&
             python manage.py migrate &&
             daphne -b 0.0.0.0 -p 8000 config.asgi:application"

  celery:
    build:
      context: ./server
      dockerfile: Dockerfile
    command: celery -A config.celery worker -l info --concurrency=2
    volumes:
      - ./server:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.development
      - SECRET_KEY=dev-secret-key-change-in-prod
      - POSTGRES_DB=planera
      - POSTGRES_USER=planera
      - POSTGRES_PASSWORD=planera
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
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

`server/Dockerfile`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
```

`client/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

**Verify**: `docker compose up --build` — all 5 services up, no crashes.
- Frontend: `http://localhost:3000`
- API admin: `http://localhost:8000/admin/`

---

## 2. Implementation Order

Each task has a unique ID used as a dependency reference. Time is realistic (not optimistic).

---

### DAY 1 — Foundation

#### T01 — Django settings split + BaseModel ✅ COMPLETED

**Definition of done**: `python manage.py check` passes with split settings; `BaseModel` importable; ASGI routing stub in place; Celery configured; static files served via WhiteNoise.

**Actual files on disk**:
- `config/settings/__init__.py` — empty package marker
- `config/settings/base.py` — INSTALLED_APPS (daphne first), DRF config, simplejwt, CORS, Channels layer stub, WhiteNoise middleware, `AUTH_USER_MODEL`, `STATIC_ROOT`
- `config/settings/development.py` — DEBUG=True, PostgreSQL from env vars, Redis URL, CORS origins, Celery config
- `config/settings/production.py` — all secrets from env, SECURE cookies, ALLOWED_HOSTS from env
- `config/asgi.py` — `ProtocolTypeRouter` with HTTP + WebSocket (stub routing), `JWTAuthMiddleware` stub
- `config/celery.py` — `Celery('planera')`, autodiscover_tasks
- `config/wsgi.py` — points to `config.settings.development`
- `core/models.py` — `BaseModel`: UUID PK (`uuid.uuid4`), `created_at`, `updated_at`, abstract
- `core/pagination.py` — `CursorPagination` (page_size=50, ordering=`-created_at`)
- `core/exceptions.py` — custom DRF exception handler returning `{error: {code, message, details}}`
- `realtime/routing.py` — `websocket_urlpatterns = []` (stub, populated in T33)
- `realtime/middleware.py` — passthrough `JWTAuthMiddleware` stub (replaced in T33)
- `requirements.txt` — includes `whitenoise==6.7.0` and `setuptools>=69.0`

**Deps**: None
**Time**: 1.5h (completed)

---

#### T02 — Custom User model ✅ COMPLETED

**Definition of done**: `python manage.py migrate` creates `users_user` table with UUID PK; Django admin shows Users section; `createsuperuser` works.

**Actual files on disk**:
- `users/models.py` — `User(AbstractBaseUser, PermissionsMixin)`: UUID PK, email (unique, USERNAME_FIELD), full_name, avatar_url, is_active, is_staff, created_at, updated_at. `UserManager` defined in same file (not a separate managers.py).
- `users/migrations/0001_initial.py` — hand-written migration (auto-generate was not possible without running manage.py inside container)
- `users/admin.py` — `UserAdmin(BaseUserAdmin)` registered with list_display, search, fieldsets

> **Note**: `User` extends `AbstractBaseUser + PermissionsMixin` directly, NOT `BaseModel`. This is correct — stacking `AbstractBaseUser` and a custom `BaseModel` both defining `id` causes conflicts. The UUID PK is defined inline on the User model.

**Deps**: T01
**Time**: 1h (completed)

---

#### T03 — Auth API (register, login, refresh, logout, me) ✅ COMPLETED

**Definition of done**: `POST /api/v1/auth/login/` returns `{access, refresh}`; refresh token set as httpOnly cookie; `GET /api/v1/auth/me/` returns user with valid Bearer token; `POST /api/v1/auth/refresh/` issues new access token from cookie.

**Actual files on disk**:
- `users/serializers.py` — `UserSerializer` (id, email, full_name, avatar_url; read_only: id, email, created_at), `RegisterSerializer` (email, full_name, password + `create_user()`), `LoginSerializer` (email, password; `validate()` calls `authenticate()`)
- `users/tokens.py` — `get_tokens_for_user(user)` → `{access, refresh}` using simplejwt; `REFRESH_COOKIE_NAME = "refresh_token"`; `set_refresh_cookie()` (httpOnly, SameSite=Lax, path=/api/v1/auth/, max_age=7days); `clear_refresh_cookie()`
- `users/views.py` — `RegisterView`, `LoginView` (sets refresh cookie), `RefreshView` (reads cookie, issues new access + rotates cookie), `LogoutView` (clears cookie), `MeView` (GET + PATCH)
- `users/urls.py` — `/register/`, `/login/`, `/refresh/`, `/logout/`, `/me/`
- `config/urls.py` — `path("api/v1/auth/", include("users.urls"))`

**Verified**: `POST /register/` → 201 with user+access; `POST /login/` → 200 with httpOnly cookie; `POST /refresh/` → 200 with new access + rotated cookie; `GET /me/` with Bearer → 200 with user object.

**Deps**: T02
**Time**: 2.5h (completed)

---

#### T04 — Workspace + Membership models + API ✅ COMPLETED

**Definition of done**: `POST /api/v1/workspaces/` creates workspace (stored in `organizations_organization`); `GET /api/v1/workspaces/:slug/members/` lists members with roles; `OrgContextMiddleware` attaches `request.organization` from `X-Organization-Slug` header.

**Actual files on disk**:
- `organizations/models.py` — `Organization(BaseModel)` (name, slug UNIQUE, logo_url), `Membership(BaseModel)` (org FK, user FK, role ENUM owner/admin/member, unique_together)
- `organizations/serializers.py` — `WorkspaceSerializer`, `MembershipSerializer`, `MembershipUpdateSerializer`, `InviteMemberSerializer`
- `organizations/permissions.py` — `ROLE_HIERARCHY` dict; `IsOrgMember`, `IsOrgAdminOrOwner`, `IsOrgOwner` using `_get_role()` helper
- `organizations/middleware.py` — `OrgContextMiddleware`: reads `X-Organization-Slug` header, uses `SimpleLazyObject` for lazy org lookup, skips `/admin/`, `/api/v1/auth/`, `/static/`
- `organizations/views.py` — `WorkspaceViewSet` (list/create/retrieve/patch/delete + `members` + `invite` actions), `MembershipViewSet` (list/patch role/delete)
- `organizations/urls.py` — DefaultRouter with workspace + membership viewsets
- `organizations/admin.py` — `OrganizationAdmin`, `MembershipAdmin` registered
- `organizations/migrations/0001_initial.py` — auto-generated
- `config/settings/base.py` — `OrgContextMiddleware` added after `AuthenticationMiddleware`
- `config/urls.py` — `path("api/v1/workspaces/", include("organizations.urls"))`

**Verified**: `POST /workspaces/` → 201 with workspace; creator auto-assigned `owner` role; `GET /workspaces/acme/members/` → owner membership with nested user; `GET /workspaces/` → paginated list scoped to current user.

**Deps**: T02
**Time**: 2h (completed)

---

#### T05 — Frontend scaffold: Vite + Tailwind + folder structure ✅ COMPLETED

**Definition of done**: `http://localhost:3000` shows blank app with Tailwind dark background; all module folders exist; `vite.config.ts` proxy routes `/api` and `/ws` to backend.

**Actual files on disk**:
- `client/vite.config.ts` — `@` alias to `./src`; proxy `/api` → `http://localhost:8000`; proxy `/ws` → `ws://localhost:8000` (with `ws: true`); server host `0.0.0.0`, port `3000`
- `client/tailwind.config.js` — `darkMode: "class"`, content `['./index.html', './src/**/*.{ts,tsx}']`, status/priority color tokens, `fontFamily.mono`
- `client/src/styles/globals.css` — `@tailwind` directives; CSS custom properties for light + dark: `--background`, `--surface`, `--surface-hover`, `--border`, `--text-primary`, `--text-muted`, `--accent`
- `client/src/styles/tokens.css` — status + priority CSS custom property tokens with dark-mode overrides
- `client/src/index.css` — replaced with `@import` of globals.css + tokens.css
- `client/src/App.tsx` — `QueryClientProvider` + `AppRouter` + `Toaster` + `ReactQueryDevtools`
- `client/src/app/Router.tsx` — `BrowserRouter` with public routes (`/login`, `/register`) + `/app/*` routes (placeholder pages); root redirects to `/app`
- `client/src/app/providers/` — directory stub (AuthProvider added in T07)
- Module directories with `index.ts` stubs: `auth/`, `workspace/`, `project/`, `board/`, `issue/`, `dashboard/`, `notifications/`
- Shared directories: `components/ui/`, `components/layout/`, `components/data/`, `hooks/`, `lib/`, `stores/`, `types/`

**Verified**: `http://localhost:3000` → 200; `tsc --noEmit` → 0 errors; `/app` redirects and renders placeholder pages; Tailwind CSS custom properties active.

**Deps**: None (parallel with T01–T04)
**Time**: 1.5h (completed)

---

#### T06 — Shared types + Axios client + React Query config ✅ COMPLETED

**Definition of done**: `api.ts` exports configured Axios instance; 401 triggers silent refresh with module-level lock (no race condition); `queryClient.ts` exports `QueryClient` and `queryKeys` factory.

**Files**:
- `client/src/shared/types/enums.ts` — const objects (not TypeScript enums):
  ```ts
  export const IssueStatus = { BACKLOG: "backlog", TODO: "todo", IN_PROGRESS: "in_progress", IN_REVIEW: "in_review", DONE: "done", CANCELLED: "cancelled" } as const
  export const IssuePriority = { URGENT: "urgent", HIGH: "high", MEDIUM: "medium", LOW: "low", NONE: "none" } as const
  export const MemberRole = { OWNER: "owner", ADMIN: "admin", MEMBER: "member" } as const
  ```
- `client/src/shared/types/models.ts` — `User`, `Organization` (as "Workspace" in UI), `Membership`, `Project`, `Issue`, `Comment`, `Label`, `Activity`, `Notification` interfaces
- `client/src/shared/types/api.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` discriminated unions
- `client/src/shared/lib/api.ts` — Axios instance; request interceptor injects `Authorization: Bearer {token}` and `X-Organization-Slug`; response interceptor: on 401, check `isRefreshing` flag, if false set true + call refresh + drain queue + retry, if true push to queue
- `client/src/shared/lib/queryClient.ts` — `QueryClient` (staleTime: 60s, gcTime: 10min, retry: 1, refetchOnWindowFocus: true); `queryKeys` factory for issues, projects, workspaces, notifications, dashboard
- `client/src/shared/lib/constants.ts` — `STATUS_COLORS`, `STATUS_LABELS`, `PRIORITY_ICONS`, `PRIORITY_LABELS`, `PRIORITY_COLORS`
- `client/src/shared/lib/utils.ts` — `cn(...classes)` combining clsx + tailwind-merge

**Deps**: T05
**Time**: 1.5h

---

#### T07 — Auth store + Login/Register pages ✅ COMPLETED

**Definition of done**: Register → login → redirect to `/app`; access token in memory only; refresh token in httpOnly cookie; `useAuth()` returns `{ user, isAuthenticated, login, logout }`; page refresh rehydrates session.

**Files**:
- `client/src/modules/auth/stores/authStore.ts` — Zustand: `{ user, accessToken, setAuth, clearAuth }`
- `client/src/modules/auth/services/authApi.ts` — `register()`, `login()`, `logout()`, `refreshToken()`, `getMe()`
- `client/src/modules/auth/hooks/useAuth.ts` — wraps authStore
- `client/src/modules/auth/hooks/useSession.ts` — on mount: call `getMe()` to rehydrate from cookie; sets auth state
- `client/src/modules/auth/components/LoginForm.tsx` — email + password fields, validation, error display, loading state
- `client/src/modules/auth/components/RegisterForm.tsx` — full_name + email + password
- `client/src/app/providers/AuthProvider.tsx` — calls `useSession` on mount
- `client/src/app/Router.tsx` — public routes (login, register) + `<ProtectedRoute>` wrapper that redirects to `/login` if unauthenticated

**Deps**: T06
**Time**: 2.5h

---

### DAY 2 — Core Domain

#### T08 — Project model + API ✅ COMPLETED

**Definition of done**: `POST /api/v1/projects/` creates project scoped to `request.organization`; `GET /api/v1/projects/:key/` returns detail; UNIQUE(org_id, key) enforced at DB level.

**Files**:
- `projects/models.py` — `Project(BaseModel)`: org FK → `organizations_organization`, name, key (VARCHAR 10), description, lead FK → `users_user` (nullable), icon, color, issue_count (denormalized, updated via signal)
- `projects/serializers.py` — `ProjectListSerializer`, `ProjectDetailSerializer`, `ProjectCreateSerializer`
- `projects/permissions.py` — `ProjectPermission`: wraps `IsOrgMember`; write actions require `IsOrgAdminOrOwner`
- `projects/views.py` — `ProjectViewSet` (lookup_field=`key`; get_queryset scoped to `request.organization`)
- `projects/urls.py`
- `config/urls.py` — add `path("api/v1/projects/", include("projects.urls"))`

**Deps**: T04
**Time**: 1.5h

---

#### T09 — Issue + Label models + migrations ✅ COMPLETED

**Definition of done**: `python manage.py migrate` creates all issue tables with composite index on `(project_id, status, position)` and GIN index on `search_vector`.

**Files**:
- `issues/models.py` — `Issue(BaseModel)`: project FK, identifier (VARCHAR 20, e.g. "PLN-42"), title (VARCHAR 300), description (TEXT), status ENUM, priority ENUM, position (VARCHAR 50, fractional index), creator FK, assignee FK (nullable), due_date, estimate (integer, story points); `Label(BaseModel)`: org FK, name (VARCHAR 50), color (VARCHAR 7); M2M `Issue.labels` through `issues_issue_labels`
- `issues/migrations/0001_initial.py` — auto-generated
- `issues/migrations/0002_search_indexes.py` — `RunSQL` to add: composite index on `(project_id, status, position)`, index on `assignee_id`, `search_vector` tsvector generated column, GIN index on `search_vector`

**Deps**: T08
**Time**: 1.5h

---

#### T10 — Issue service layer ✅ COMPLETED

**Definition of done**: `IssueService.create_issue()` creates issue with auto-incremented identifier (e.g. "PLN-3"), logs an Activity row, increments `project.issue_count` atomically; all operations wrapped in `transaction.atomic()`.

**Files**:
- `issues/services.py` — `IssueService` static methods:
  - `create_issue(*, project, creator, **data)` — atomic: `_next_identifier()`, `Issue.objects.create()`, `Activity.objects.create()`, `Project.objects.filter(pk=project.pk).update(issue_count=F("issue_count")+1)`; `on_commit` → broadcast stub
  - `update_issue(*, issue, actor, **data)` — atomic update + activity log
  - `assign_issue(*, issue, assignee, actor)` — update assignee + activity log + notification trigger
  - `delete_issue(*, issue, actor)` — soft delete or hard delete + activity log
  - `_next_identifier(project)` — `SELECT MAX(identifier number part) + 1` within atomic block
- `issues/signals.py` — `post_delete` on `Issue` decrements `project.issue_count` via `F()` expression

**Deps**: T09
**Time**: 1.5h

---

#### T11 — Issue API (list, create, detail, update, delete) ✅ COMPLETED

**Definition of done**: `GET /api/v1/projects/:key/issues/` returns cursor-paginated issues; supports `?status=`, `?priority=`, `?assignee_id=`, `?label=`, `?search=` filters; POST delegates to `IssueService`.

**Files**:
- `issues/serializers.py` — `IssueListSerializer` (no description field), `IssueDetailSerializer` (nested assignee/creator/labels), `IssueCreateSerializer`, `IssueUpdateSerializer`, `IssueMoveSerializer` (status + position)
- `issues/filters.py` — `IssueFilterSet(django_filters.FilterSet)`: status, priority, assignee_id, label (M2M filter), search (title icontains)
- `issues/views.py` — `IssueViewSet` (lookup_field=`identifier`; get_queryset scoped to org via project; `move` custom action)
- `issues/urls.py`
- `config/urls.py` — add issue + label URLs

**Deps**: T10
**Time**: 2h

---

#### T12 — Activity model + auto-logging ✅ COMPLETED

**Definition of done**: Status changes, assignee changes, label changes auto-create Activity rows via signals; `GET /api/v1/issues/:identifier/activity/` returns timeline.

**Files**:
- `issues/models.py` — add `Activity(BaseModel)`: issue FK, actor FK, verb (VARCHAR 50: created/moved/assigned/commented/labelled), data (JSONB e.g. `{"from": "todo", "to": "done"}`)
- `issues/signals.py` — `pre_save` on Issue: diff `status` and `assignee_id` fields, create Activity entries on change
- `issues/serializers.py` — add `ActivitySerializer` with nested `UserMinimalSerializer`
- `issues/views.py` — add `@action(detail=True) def activity` on `IssueViewSet`

**Deps**: T11
**Time**: 1h

---

#### T13 — Comment model + API ✅ COMPLETED

**Definition of done**: `POST /api/v1/issues/:identifier/comments/` creates comment; `PATCH /api/v1/comments/:id/` succeeds only for the comment author (403 otherwise).

**Files**:
- `issues/models.py` — add `Comment(BaseModel)`: issue FK, author FK, body (TEXT)
- `issues/serializers.py` — add `CommentSerializer` with nested `UserMinimalSerializer` for author
- `issues/views.py` — add `CommentViewSet` with `IsAuthorOrReadOnly` custom permission

**Deps**: T12
**Time**: 1h

---

#### T14 — RBAC enforcement on all endpoints ✅ COMPLETED

> Moved from Day 6 — permissions must be applied when views are written, not retrofitted.

**Definition of done**: Member cannot delete workspace or manage members (gets 403); Admin cannot delete workspace; all ViewSets explicitly declare `permission_classes`; `OrgScopedPermission` base class in `core/permissions.py`.

**Files**:
- `core/permissions.py` — `OrgScopedPermission(BasePermission)` base class that checks `request.organization` is set
- `organizations/permissions.py` — finalize `IsOrgOwner`, `IsOrgAdminOrOwner`, `IsOrgMember` with `has_permission` using `ROLES` dict
- `projects/views.py` — add `permission_classes = [IsAuthenticated, IsOrgMember]`; delete requires `IsOrgAdminOrOwner`
- `issues/views.py` — add `permission_classes = [IsAuthenticated, IsOrgMember]`
- `organizations/views.py` — invite/role-change requires `IsOrgAdminOrOwner`; delete workspace requires `IsOrgOwner`

**Deps**: T04, T11
**Time**: 1.5h

---

#### T15 — Django admin + seed script (stub) ✅ COMPLETED

**Definition of done**: All models visible in Django admin; `python manage.py seed_demo` creates 1 workspace, 3 users (owner/admin/member), 2 projects, 10 issues. (Final seed with 30 issues done in T48.)

**Files**:
- `organizations/admin.py` — register `Organization`, `Membership`
- `projects/admin.py` — register `Project`
- `issues/admin.py` — register `Issue`, `Comment`, `Label`, `Activity`
- `issues/management/__init__.py`, `issues/management/commands/__init__.py`
- `issues/management/commands/seed_demo.py` — stub version
- `tests/factories.py` — `UserFactory`, `WorkspaceFactory`, `MembershipFactory`, `ProjectFactory`, `IssueFactory`, `LabelFactory` using factory_boy

**Deps**: T13
**Time**: 1.5h

---

#### T16 — UI primitives (shared/components/ui) ✅ COMPLETED

**Definition of done**: All listed components exported and typed; `Button` uses CVA variants; dark mode classes work; `cn()` utility available.

**Files**:
- `client/src/shared/components/ui/Button.tsx` — CVA variants: default, destructive, outline, ghost, link; sizes: sm, default, lg, icon; `loading` prop with spinner
- `client/src/shared/components/ui/Input.tsx` — forwardRef, error state styling
- `client/src/shared/components/ui/Select.tsx` — controlled, placeholder, typed options
- `client/src/shared/components/ui/Modal.tsx` — backdrop, focus trap, slide-in transition
- `client/src/shared/components/ui/DropdownMenu.tsx` — compound: `Trigger`, `Content`, `Item`, `Separator`
- `client/src/shared/components/ui/Avatar.tsx` — image with letter-initials fallback, size variants (sm, md, lg)
- `client/src/shared/components/ui/Badge.tsx` — color variants for status and priority
- `client/src/shared/components/ui/Skeleton.tsx` — animated pulse placeholder
- `client/src/shared/components/ui/Toast.tsx` — thin wrapper over react-hot-toast
- `client/src/shared/components/ui/Tooltip.tsx` — hover delay, portal-based positioning

**Deps**: T05
**Time**: 2h

---

#### T17 — AppShell layout (sidebar + main content area) ✅ COMPLETED

**Definition of done**: Authenticated app renders Linear-style sidebar + content area with `<Outlet />`; sidebar shows workspace name, nav links (Board, Issues, Projects, Dashboard); collapses via `uiStore.sidebarOpen`.

**Files**:
- `client/src/shared/stores/uiStore.ts` — `sidebarOpen`, `activeIssueId`, `commandPaletteOpen`, `boardViewMode` ("kanban" | "list"); all actions
- `client/src/shared/stores/filtersStore.ts` — `statusFilter`, `priorityFilter`, `assigneeFilter`, `labelFilter`, `searchQuery`, `resetAll()`
- `client/src/shared/components/layout/AppShell.tsx` — sidebar + main with `<Outlet />`; renders `<CommandPalette />` globally
- `client/src/shared/components/layout/Sidebar.tsx` — workspace name, nav links with icons (lucide-react), settings/notifications at bottom; 240px wide, muted border
- `client/src/shared/components/layout/BreadcrumbNav.tsx` — Planera > Project Name > View
- `client/src/app/App.tsx` — compose all providers: `QueryClientProvider`, `ReactQueryDevtools`, `Toaster`, `AuthProvider`, `Router`

**Deps**: T07, T16
**Time**: 2h

---

#### T18 — Workspace frontend (hooks, service, WorkspaceSwitcher) ✅ COMPLETED

**Definition of done**: After login, workspaces load; current workspace in Zustand; `X-Organization-Slug` header auto-attached to all API calls.

**Files**:
- `client/src/modules/workspace/services/workspaceApi.ts` — `listWorkspaces()`, `createWorkspace()`, `getWorkspace()`, `getMembers()`, `inviteMember()`, `updateMemberRole()`
- `client/src/modules/workspace/hooks/useWorkspace.ts` — React Query; sets default workspace on first load
- `client/src/modules/workspace/hooks/useMembers.ts`
- `client/src/modules/workspace/stores/workspaceStore.ts` — Zustand: `{ currentWorkspace, setCurrentWorkspace }`
- `client/src/modules/workspace/components/WorkspaceSwitcher.tsx` — dropdown in sidebar header showing workspace name + avatar
- `client/src/shared/lib/api.ts` — update request interceptor: attach `X-Organization-Slug` from `workspaceStore.currentWorkspace.slug`

**Deps**: T17
**Time**: 1.5h

---

#### T19 — Project list page + hooks ✅ COMPLETED

**Definition of done**: `/app/projects` lists all projects for current workspace; clicking navigates to `/app/projects/:key/board`.

**Files**:
- `client/src/modules/project/services/projectApi.ts` — `listProjects()`, `createProject()`, `getProject()`
- `client/src/modules/project/hooks/useProjects.ts` — `useQuery` with `queryKeys.projects.all()`
- `client/src/modules/project/components/ProjectList.tsx` — grid of cards
- `client/src/modules/project/components/ProjectCard.tsx` — icon, name, key badge, issue count
- `client/src/app/Router.tsx` — add `/app/projects` route

**Deps**: T18
**Time**: 1h

---

#### T20 — Issue list view (non-board) ✅ COMPLETED

**Definition of done**: `/app/projects/:key/issues` shows compact flat list: identifier (monospace), priority icon, title, status badge, assignee avatar, due date; row click opens IssueDetailPanel (stub for now).

**Files**:
- `client/src/modules/issue/services/issueApi.ts` — `listIssues()`, `getIssue()`, `createIssue()`, `updateIssue()`, `deleteIssue()`, `moveIssue()`, `searchIssues()`
- `client/src/modules/issue/hooks/useIssues.ts` — parameterized by `projectKey` + optional filters
- `client/src/modules/issue/components/IssueRow.tsx` — 32px row height; identifier in `font-mono`, priority icon, status badge, assignee avatar
- Route: `/app/projects/:key/issues`

**Deps**: T17, T11
**Time**: 1.5h

---

### DAY 3 — Kanban Board (Hero Feature)

#### T21 — Fractional indexing utility (backend) ✅ COMPLETED

**Definition of done**: `generate_position_between("a0", "a1")` returns a string between them; inserting at start/end works; 50 sequential reorders don't cause string overflow.

**Why this matters**: Integer positions require updating O(n) rows on reorder. Fractional indexing updates exactly 1 row — what Linear uses in production.

**Files**:
- `core/fractional_index.py` — `generate_position_between(before: str | None, after: str | None) -> str`, `generate_start_position() -> str`, `generate_end_position() -> str`; edge-case safe (empty column, head insert, tail insert)

**Deps**: T01
**Time**: 1h

---

#### T22 — Issue move endpoint + board query ✅ COMPLETED

**Definition of done**: `POST /api/v1/issues/PLN-1/move/` with `{status, position}` updates atomically and returns updated issue; `GET /api/v1/projects/:key/issues/` with `?ordering=position` returns issues suitable for board grouping.

**Files**:
- `issues/services.py` — add `IssueService.move_issue(issue, new_status, new_position, actor)`: `transaction.atomic()`, update issue fields, create Activity, `on_commit` → broadcast stub (Celery task added in T34)
- `issues/views.py` — add `@action(detail=True, methods=["post"]) def move`
- `issues/serializers.py` — add `IssueMoveSerializer` validating status ENUM + position string

**Deps**: T21, T11
**Time**: 1.5h

---

#### T23 — BoardView + BoardColumn + BoardCard components ✅ COMPLETED

**Definition of done**: `/app/projects/:key/board` renders 6 columns; issues appear as cards in correct columns; column headers show count + status color dot.

**Files**:
- `client/src/modules/board/services/boardApi.ts` — `getBoardIssues(projectKey, filters)`
- `client/src/modules/board/hooks/useBoardIssues.ts` — `select` transforms flat list → `Record<IssueStatus, Issue[]>`
- `client/src/modules/board/components/BoardView.tsx` — `DndContext` wrapper, renders `BoardColumn` per status
- `client/src/modules/board/components/BoardColumn.tsx` — `SortableContext`, column header with count, droppable zone, vertical scroll
- `client/src/modules/board/components/BoardCard.tsx` — `useSortable`; identifier (mono), title, priority icon, assignee avatar, label badges; `DropdownMenu` with Delete option
- `client/src/modules/board/components/BoardHeader.tsx` — filter chips + board/list view toggle
- `client/src/shared/lib/boardUtils.ts` — `moveBoardItem(boardData, params)` pure function; `groupByStatus(issues)` transformer
- Route: `/app/projects/:key/board`

**Deps**: T20, T16
**Time**: 2.5h

---

#### T24 — DnD Kit wiring + useBoardDnD hook ✅ COMPLETED

**Definition of done**: Dragging a card between columns reorders it visually during drag; drag overlay shows card with shadow + slight rotation; releasing fires API call.

**Files**:
- `client/src/modules/board/hooks/useBoardDnD.ts` — `DragStartEvent`, `DragOverEvent`, `DragEndEvent` handlers; tracks `activeCard` and `overId`; computes `newPosition` using fractional index client-side between neighbors

**Deps**: T23
**Time**: 1.5h

---

#### T25 — useMoveIssue with full optimistic update cycle ✅ COMPLETED

**Definition of done**: Drag → instant visual move → API fires → on error, card snaps back with error toast; no flicker on success. This is the demo centerpiece.

**Optimistic cycle**: `onMutate` (snapshot + cancelQueries + setQueryData) → `onError` (restore snapshot) → `onSettled` (invalidateQueries).

**Files**:
- `client/src/modules/issue/hooks/useIssueMutations.ts` — `useMoveIssue()` with full cycle; also `useCreateIssue()`, `useUpdateIssue()`, `useDeleteIssue()` with snapshot/rollback discipline

**Deps**: T24
**Time**: 2h

---

#### T26 — QuickCreateCard (inline issue creation from board) ✅ COMPLETED

**Definition of done**: "+ Add issue" at column bottom opens inline input; Enter creates issue with column status pre-set; optimistic card appears immediately.

**Files**:
- `client/src/modules/board/components/QuickCreateCard.tsx` — controlled input, `useCreateIssue` mutation, auto-focus, Esc to cancel

**Deps**: T25
**Time**: 1h

---

#### T27 — Board filters (useBoardFilters) ✅ COMPLETED

**Definition of done**: Assignee/priority/label filter chips in BoardHeader narrow visible cards; active filter count badge shows; clearing resets filtersStore.

**Files**:
- `client/src/modules/board/hooks/useBoardFilters.ts` — reads/writes `filtersStore`; derives `activeFilterCount`
- `client/src/modules/board/components/BoardHeader.tsx` — filter chip dropdowns, clear-all button, view mode toggle

**Deps**: T26
**Time**: 1h

---

### DAY 4 — Issue Detail + Comments + Activity

#### T28 — IssueDetailPanel (slide-over)

**Definition of done**: Clicking any issue opens a right-side slide-over panel with transition; shows identifier, title, description (Markdown), status, priority; Esc closes; `uiStore.activeIssueId` drives visibility.

**Files**:
- `client/src/modules/issue/hooks/useIssue.ts` — `useQuery` on `queryKeys.issues.detail(identifier)`
- `client/src/modules/issue/components/IssueDetailPanel.tsx` — translate-x slide transition; header (identifier + title + close/delete buttons), properties column, description, tabs (Comments / Activity)
- `client/src/shared/hooks/useKeyboardShortcut.ts` — `useKeyboardShortcut(key, callback, options?: {meta?, ctrl?, shift?})`

**Deps**: T17, T20, T25
**Time**: 2h

---

#### T29 — IssueProperties (inline editing)

**Definition of done**: Clicking status/priority/assignee/labels in the panel opens a dropdown; changes fire `useUpdateIssue` optimistically; server creates activity entry.

**Files**:
- `client/src/modules/issue/components/IssueProperties.tsx` — property grid rows, each with current value + dropdown on click
- `client/src/modules/issue/components/StatusBadge.tsx` — status → color dot + label
- `client/src/modules/issue/components/PriorityIcon.tsx` — priority → lucide icon + color (urgent=red !!!, high=orange ↑, medium=yellow —, low=blue ↓, none=gray ···)

**Deps**: T28
**Time**: 1.5h

---

#### T30 — IssueComments + useIssueComments ✅ COMPLETED

**Definition of done**: Comments tab shows thread; new comment at bottom posts optimistically with "sending" state; author sees edit/delete icons.

**Files**:
- `client/src/modules/issue/hooks/useIssueComments.ts` — list query + `useAddComment` mutation (optimistic append with temp UUID)
- `client/src/modules/issue/components/IssueComments.tsx` — `CommentItem`: avatar, author name, `formatDistanceToNow` timestamp, body; author edit/delete icons

**Deps**: T28, T13
**Time**: 1.5h

---

#### T31 — IssueActivity component ✅ COMPLETED

**Definition of done**: Activity tab shows vertical timeline; each entry: actor avatar + human-readable verb sentence + relative timestamp.

**Files**:
- `client/src/modules/issue/components/IssueActivity.tsx` — ordered `ActivityItem` list; verb map (e.g. `moved` → "moved this from {from} to {to}")

**Deps**: T28, T12
**Time**: 1h

---

#### T32 — Markdown description editing ✅ COMPLETED

**Definition of done**: Description renders as Markdown; clicking switches to textarea; blur triggers debounced autosave (no optimistic update needed).

**Files**:
- `client/src/modules/issue/components/IssueDescription.tsx` — toggle render/edit mode; `useDebounce` on value → `useUpdateIssue` on 800ms idle
- `client/src/shared/hooks/useDebounce.ts` — generic debounce hook

**Deps**: T29
**Time**: 1h

---

#### T33 — Delete/archive issue ✅ COMPLETED

**Definition of done**: Delete in BoardCard menu and IssueDetailPanel header fires `useDeleteIssue`; issue removed optimistically; `project.issue_count` decremented via server signal.

**Files**:
- `client/src/modules/issue/hooks/useIssueMutations.ts` — add `useDeleteIssue()` with snapshot/rollback
- `client/src/modules/board/components/BoardCard.tsx` — DropdownMenu with "Delete" option
- `client/src/modules/issue/components/IssueDetailPanel.tsx` — delete button in header actions

**Deps**: T29
**Time**: 1h

---

### DAY 5 — Real-time + Search + Notifications

#### T34 — Django Channels ASGI setup + BoardConsumer ✅ COMPLETED

**Definition of done**: `ws://localhost:8000/ws/board/PLN/?token=<jwt>` connects; client joins `board_PLN` group; disconnect removes it; invalid token rejected with close code 4001.

**Verify with**:
```bash
# Install websocat: brew install websocat
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.com","password":"password"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")
websocat "ws://localhost:8000/ws/board/PLT/?token=$TOKEN"
```

**Files**:
- `config/asgi.py` — replace stub with real `ProtocolTypeRouter`: HTTP → Django, WebSocket → `AllowedHostsOriginValidator(JWTAuthMiddleware(URLRouter(websocket_urlpatterns)))`
- `realtime/routing.py` — `websocket_urlpatterns` = `ws/board/<str:project_key>/` + `ws/notifications/`
- `realtime/middleware.py` — real `JWTAuthMiddleware`: reads `?token=` from scope query string, validates via simplejwt `UntypedToken`, sets `scope["user"]`; closes with 4001 on failure
- `realtime/consumers.py` — `BoardConsumer(AsyncJsonWebsocketConsumer)`: `connect` (verify project membership, `group_add`, `accept`), `disconnect` (`group_discard`), `board_event` (handler for `{"type": "board.event"}` messages that forwards to WebSocket)
- `config/settings/development.py` — `CHANNEL_LAYERS` with `channels_redis.core.RedisChannelLayer`, explicit `host`/`port` (not URL string)

**Deps**: T04, T22
**Time**: 2h

---

#### T35 — Celery broadcast task + on_commit hook ✅ COMPLETED

**Definition of done**: Moving an issue triggers `broadcast_board_update.delay(...)`; Celery task sends to `board_{key}` channel group; payload includes `actor_id` for echo suppression.

**Files**:
- `issues/tasks.py` — `@shared_task broadcast_board_update(project_id, event_type, payload)`: fetch project key, `async_to_sync(channel_layer.group_send)(f"board_{key}", {"type": "board.event", "data": {...}})`
- `issues/services.py` — wire `transaction.on_commit(lambda: broadcast_board_update.delay(...))` inside `move_issue()`, `create_issue()`, `delete_issue()`

**Deps**: T34
**Time**: 1.5h

---

#### T36 — WebSocketManager client + useBoardSocket hook ✅ COMPLETED

**Definition of done**: Board page opens WS on mount; moving in Browser A appears in Browser B within 500ms; echo suppression prevents double-apply on actor.

**Files**:
- `client/src/shared/lib/ws.ts` — `WebSocketManager`: `connect(url, token)`, exponential backoff reconnect (1s→2s→4s…30s, max 5 attempts), `subscribe(type, handler)` returns unsubscribe fn, `disconnect()`
- `client/src/modules/board/hooks/useBoardSocket.ts` — `useEffect` on `projectKey`: connect, subscribe to `issue.moved`/`issue.created`/`issue.deleted`; echo suppress on `actor_id === currentUser.id`; `queryClient.setQueryData` with `moveBoardItem()`; cleanup on unmount
- `client/src/modules/board/components/BoardView.tsx` — call `useBoardSocket(projectKey)`

**Deps**: T35, T25
**Time**: 2h

---

#### T37 — PostgreSQL full-text search endpoint ✅ COMPLETED

**Definition of done**: `GET /api/v1/search/?q=login+bug` returns issues ranked by relevance; results scoped to `request.organization`.

**Files**:
- `issues/migrations/0003_search_vector_generated.py` — `RunSQL` to add generated `search_vector tsvector` column and GIN index (if not done in 0002)
- `issues/views.py` — add `SearchView` using `SearchQuery` + `SearchRank` + `SearchHeadline`
- `config/urls.py` — add `path("api/v1/search/", ...)`

**Deps**: T11
**Time**: 1.5h

---

#### T38 — CommandPalette (Cmd+K) ✅ COMPLETED

**Definition of done**: `Cmd+K` opens centered modal; typing searches issues (debounced, ≥2 chars); ↑↓ navigate results; Enter navigates to issue; Esc closes.

**Files**:
- `client/src/shared/components/layout/CommandPalette.tsx` — triggered by `uiStore.commandPaletteOpen`; `useDebounce` on input → call `searchIssues()`; keyboard nav with `selectedIndex` state
- `client/src/shared/components/layout/AppShell.tsx` — wire `useKeyboardShortcut("k", toggle, { meta: true })`

**Deps**: T28
**Time**: 2h

---

#### T39 — Notification model + API ✅ COMPLETED

**Definition of done**: `GET /api/v1/notifications/` returns notifications for current user with `unread_count` in meta; mark-read works.

**Files**:
- `notifications/models.py` — `Notification(BaseModel)`: recipient FK, org FK, type (VARCHAR 50), title, data (JSONB), is_read; INDEX(recipient_id, is_read, created_at DESC)
- `notifications/serializers.py` — `NotificationSerializer`
- `notifications/views.py` — `NotificationViewSet` + `mark_read` action
- `notifications/urls.py`
- `config/urls.py` — add notifications URL

**Deps**: T04
**Time**: 1h

---

#### T40 — Notification Celery tasks + WebSocket push

**Definition of done**: Assigning an issue to user X creates a Notification and pushes it to user X's open WS connection in real-time.

**Files**:
- `notifications/tasks.py` — `@shared_task create_and_push_notification(recipient_id, org_id, type, title, data)`: create Notification row, `group_send` to `notifications_{user_id}` group
- `realtime/consumers.py` — add `NotificationConsumer(AsyncJsonWebsocketConsumer)` for per-user channels
- `issues/services.py` — call `create_and_push_notification.delay(...)` in `assign_issue()` via `on_commit`

**Deps**: T39, T35
**Time**: 1.5h

---

#### T41 — Notification panel (frontend)

**Definition of done**: Bell icon in sidebar shows animated unread badge; panel lists notifications; auto-marked read on open; WS pushes new items without refresh.

**Files**:
- `client/src/modules/notifications/services/notifApi.ts`
- `client/src/modules/notifications/hooks/useNotifications.ts` — list query + `useMarkRead` mutation
- `client/src/modules/notifications/hooks/useNotificationSocket.ts` — WS `ws/notifications/`; on `notification.new`, invalidate query
- `client/src/modules/notifications/components/NotificationPanel.tsx` — slide-over
- `client/src/modules/notifications/components/NotificationItem.tsx` — type icon, title, timestamp, unread dot
- `client/src/shared/components/layout/Sidebar.tsx` — add bell icon with badge

**Deps**: T40, T36
**Time**: 1.5h

---

### DAY 6 — Dashboard + Polish

#### T42 — Analytics service + dashboard API ✅ COMPLETED

**Definition of done**: `GET /api/v1/analytics/dashboard/` returns `{ issue_counts_by_status, issue_counts_by_priority, open_issues, overdue_count, recent_activity[5] }`; all queries scoped to workspace.

**Files**:
- `analytics/services.py` — `DashboardService.get_stats(org, project=None)` with `.values("status").annotate(count=Count("id"))` aggregations
- `analytics/views.py` — `DashboardView`
- `analytics/urls.py`
- `config/urls.py` — add analytics URL

**Deps**: T11
**Time**: 1.5h

---

#### T43 — Dashboard page (frontend) ✅ COMPLETED

**Definition of done**: `/app/dashboard` shows 4 stat cards, a status distribution bar chart (Recharts), and recent activity feed.

**Files**:
- `client/src/modules/dashboard/services/dashboardApi.ts`
- `client/src/modules/dashboard/hooks/useDashboardStats.ts`
- `client/src/modules/dashboard/components/StatCard.tsx` — number + label + trend arrow
- `client/src/modules/dashboard/components/StatusChart.tsx` — Recharts `BarChart` with status colors
- `client/src/modules/dashboard/components/ActivityFeed.tsx` — recent workspace-wide activity
- Route: `/app/dashboard`

**Deps**: T42, T16
**Time**: 1.5h

---

#### T44 — RBAC in frontend (hide admin controls) ✅ COMPLETED

**Definition of done**: Member user sees no "Delete project", "Invite member", or "Change role" UI; conditionally rendered based on `membership.role`.

**Files**:
- `client/src/modules/workspace/hooks/useMyRole.ts` — derives current user's role in current workspace from membership list
- `client/src/shared/components/ui/RoleGuard.tsx` — `<RoleGuard roles={["owner","admin"]}>` renders children or null
- Update `ProjectList`, member management UI, `IssueDetailPanel` to wrap admin actions in `<RoleGuard>`

**Deps**: T18, T14
**Time**: 1h

---

#### T45 — Loading skeletons + error + empty states ✅ COMPLETED

**Definition of done**: Board loading shows skeleton columns; list loading shows skeleton rows; error shows retry button; empty project shows "Create your first issue" CTA.

**Files**:
- `client/src/shared/components/data/EmptyState.tsx` — illustration + title + CTA
- `client/src/shared/components/data/ErrorBoundary.tsx` — React error boundary with fallback UI
- `client/src/modules/board/components/BoardSkeleton.tsx` — 4 columns × 3 pulse cards
- `client/src/modules/issue/components/IssueListSkeleton.tsx` — 8 skeleton rows
- Update `BoardView` and issue list to use `isLoading` / `error` / empty branches

**Deps**: T23, T20
**Time**: 1.5h

---

#### T46 — Toast + keyboard shortcuts finalization ✅ COMPLETED

**Definition of done**: All mutations show success/error toasts; `Cmd+K` opens palette; `Esc` closes panels; `C` on board opens QuickCreate.

**Files**:
- `client/src/modules/issue/hooks/useIssueMutations.ts` — add `toast.success()` / `toast.error()` to all mutation callbacks
- `client/src/app/App.tsx` — register global shortcuts: `Esc` → close active panel, `C` → open QuickCreate

**Deps**: T38, T33
**Time**: 1h

---

#### T47 — UI polish pass ✅ COMPLETED

**Definition of done**: Dark mode toggle works; sidebar is muted chrome (gray borders, compact spacing); identifiers in `font-mono`; status/priority colors match tokens; drag overlay shows shadow + 2° rotation; all spacing on 8px grid.

**Files**:
- `client/src/styles/globals.css` — finalize CSS custom properties for light/dark
- `client/src/styles/tokens.css` — finalize all color tokens
- `client/tailwind.config.js` — custom color palette, font-mono extension
- `client/src/shared/components/layout/AppShell.tsx` — dark mode toggle in sidebar footer
- Styling sweep: `BoardCard`, `IssueRow`, `Sidebar`, `IssueDetailPanel`

**Deps**: T45
**Time**: 2.5h

---

### DAY 7 — Final Polish + Deploy

#### T48 — Seed script finalization ✅ COMPLETED

**Definition of done**: `python manage.py seed_demo --fresh` wipes and recreates: workspace "Acme Engineering", 3 users (`alice@acme.com/password` owner, `bob@acme.com/password` admin, `carol@acme.com/password` member), 2 projects (Platform: PLT, Mobile: MOB), 30 issues with realistic titles across all statuses/priorities, 10 comments, 5 labels (Bug, Feature, Improvement, Docs, Urgent).

**Files**:
- `issues/management/commands/seed_demo.py` — finalize with `--fresh` flag, realistic issue titles, multi-status distribution

**Deps**: T15
**Time**: 1h

---

#### T49 — .env.example + production settings verification ✅ COMPLETED

**Definition of done**: `.env.example` documents every required env var; `docker compose up --build` starts all services with seed data; production settings verified correct.

**Files**:
- `.env.example` — every env var with description comment
- `config/settings/production.py` — verify ALLOWED_HOSTS, CORS, secure cookies, STATIC_ROOT

**Deps**: T01
**Time**: 1h

---

#### T50 — End-to-end happy path + bug fixes ✅ COMPLETED

**Definition of done**: Full flow works without errors: register → create workspace → create project → create issue → move on board (optimistic) → open detail panel → edit inline → comment → see activity → dashboard loads → real-time sync in two tabs.

**Files**: Bug fixes as discovered.
**Time**: 2.5h

---

#### T51 — README + deploy to Railway/Render

**Definition of done**: Live URL accessible; `README.md` has one-command setup, architecture ASCII diagram, tech stack, feature list, demo credentials, screenshot/GIF of board.

**Files**:
- `README.md`
- `railway.toml` or `render.yaml`

**Deps**: T50
**Time**: 1.5h

---

## 3. Task Breakdown by Layer

### Auth Feature

| Layer | Task | File |
|---|---|---|
| Model | T02 | `users/models.py` (User + UserManager in same file) |
| Migration | T02 | `users/migrations/0001_initial.py` |
| Serializer | T03 | `users/serializers.py` |
| Token utilities | T03 | `users/tokens.py` |
| Views | T03 | `users/views.py` |
| URLs | T03 | `users/urls.py`, `config/urls.py` |
| Frontend types | T06 | `shared/types/models.ts` |
| Frontend API service | T07 | `modules/auth/services/authApi.ts` |
| Frontend hooks | T07 | `modules/auth/hooks/useAuth.ts`, `useSession.ts` |
| Frontend store | T07 | `modules/auth/stores/authStore.ts` |
| Frontend components | T07 | `LoginForm.tsx`, `RegisterForm.tsx` |

### Workspace Feature

| Layer | Task | File |
|---|---|---|
| Model | T04 | `organizations/models.py` |
| Permissions | T04, T14 | `organizations/permissions.py`, `core/permissions.py` |
| Middleware | T04 | `organizations/middleware.py` |
| Views + URLs | T04 | `organizations/views.py`, `urls.py` |
| Frontend store | T18 | `modules/workspace/stores/workspaceStore.ts` |
| Frontend hooks | T18 | `useWorkspace.ts`, `useMembers.ts` |
| Frontend component | T18 | `WorkspaceSwitcher.tsx` |

### Project Feature

| Layer | Task | File |
|---|---|---|
| Model | T08 | `projects/models.py` |
| Serializers | T08 | `projects/serializers.py` |
| Permissions | T08, T14 | `projects/permissions.py` |
| Views + URLs | T08 | `projects/views.py`, `urls.py` |
| Frontend service | T19 | `modules/project/services/projectApi.ts` |
| Frontend hook | T19 | `useProjects.ts` |
| Frontend components | T19 | `ProjectList.tsx`, `ProjectCard.tsx` |

### Issue Feature

| Layer | Task | File |
|---|---|---|
| Model | T09 | `issues/models.py` |
| Migrations | T09 | `0001_initial.py`, `0002_search_indexes.py` |
| Activity model | T12 | `issues/models.py` (added) |
| Comment model | T13 | `issues/models.py` (added) |
| Service layer | T10 | `issues/services.py` |
| Signals | T10, T12 | `issues/signals.py` |
| Serializers | T11 | `issues/serializers.py` |
| Filters | T11 | `issues/filters.py` |
| Views + URLs | T11 | `issues/views.py`, `urls.py` |
| Frontend service | T20 | `modules/issue/services/issueApi.ts` |
| Frontend list hook | T20 | `useIssues.ts` |
| Frontend detail hook | T28 | `useIssue.ts` |
| Frontend mutations | T25 | `useIssueMutations.ts` |
| Frontend list view | T20 | `IssueRow.tsx` |
| Frontend detail panel | T28 | `IssueDetailPanel.tsx` |
| Frontend properties | T29 | `IssueProperties.tsx` |

### Kanban Board Feature

| Layer | Task | File |
|---|---|---|
| Fractional index util | T21 | `core/fractional_index.py` |
| Move service | T22 | `issues/services.py` (added) |
| Move endpoint | T22 | `issues/views.py` (added action) |
| Board components | T23 | `BoardView`, `BoardColumn`, `BoardCard`, `BoardHeader` |
| Board utilities | T23 | `shared/lib/boardUtils.ts` |
| DnD orchestration | T24 | `modules/board/hooks/useBoardDnD.ts` |
| Optimistic mutations | T25 | `modules/issue/hooks/useIssueMutations.ts` |
| Quick create | T26 | `QuickCreateCard.tsx` |
| Filters | T27 | `useBoardFilters.ts` |
| Real-time sync | T36 | `useBoardSocket.ts` |

### Real-time Feature

| Layer | Task | File |
|---|---|---|
| ASGI config | T34 | `config/asgi.py` |
| WS auth middleware | T34 | `realtime/middleware.py` |
| Board consumer | T34 | `realtime/consumers.py` |
| WS routing | T34 | `realtime/routing.py` |
| Celery broadcast task | T35 | `issues/tasks.py` |
| on_commit wiring | T35 | `issues/services.py` |
| WS client class | T36 | `shared/lib/ws.ts` |
| Board socket hook | T36 | `modules/board/hooks/useBoardSocket.ts` |
| Notification consumer | T40 ✅ | `realtime/consumers.py` (already present) |
| Notification task | T40 ✅ | `notifications/tasks.py` (created) |
| Notification socket hook | T41 ✅ | `modules/notifications/hooks/useNotificationSocket.ts` |
| Notification panel | T41 ✅ | `modules/notifications/components/NotificationPanel.tsx` |
| Notification item | T41 ✅ | `modules/notifications/components/NotificationItem.tsx` |

---

## 4. Critical Path

The longest dependency chain — nothing here can be parallelized:

```
T01 (Django settings + BaseModel)
 └─► T02 (User model)
      └─► T03 (Auth API)
           └─► T04 (Workspace + Membership)
                └─► T08 (Project model)
                     └─► T09 (Issue + Label models)
                          └─► T10 (IssueService)
                               └─► T11 (Issue API)
                                    └─► T22 (Move endpoint)
                                         └─► T34 (Django Channels)
                                              └─► T35 (Celery broadcast)
                                                   └─► T36 (WS client + useBoardSocket)
```

**Total critical path**: ~18 hours of backend work across Days 1–5.

### Parallelizable Work

| Track A (Backend) | Track B (Frontend) |
|---|---|
| T01 Django settings | T05 Vite + Tailwind scaffold |
| T02 User model | T06 Types + API client |
| T03 Auth API | T07 Auth store + Login/Register |
| T04 Workspace | T16 UI primitives |
| T08 Projects | T17 AppShell layout |

| Track C (Issue depth) | Track D (Notifications) |
|---|---|
| T28 IssueDetailPanel | T39 Notification model + API |
| T29 IssueProperties | T40 Notification tasks + WS |
| T30 IssueComments | T41 Notification panel |

---

## 5. Risk Register

### R01 — DnD + fractional indexing edge cases
- **Likelihood**: High | **Impact**: High
- **Triggers**: Dragging to empty column, rapid successive drags before API responds, 50+ reorders causing position string growth
- **Mitigation**: Write `core/fractional_index.py` with unit tests first; test empty column, head insert, tail insert; add `rebalance_positions` management command as safety valve
- **Fallback**: Integer positions + O(n) updates for MVP; describe fractional indexing in demo verbally

### R02 — Django Channels WS not connecting in Docker
- **Likelihood**: Medium | **Impact**: High (kills real-time demo)
- **Triggers**: Redis channel layer config mismatch; Daphne WS upgrade headers; CORS on WS connections
- **Mitigation**: Test WS connection on Day 3 (immediately after T34 is written, not Day 5); use explicit `host`/`port` in `CHANNEL_LAYERS` not URL string; verify with `websocat` command (see T34 DoD)
- **Fallback**: Run Daphne on host machine (not Docker) for the demo; real-time still works

### R03 — JWT refresh race condition
- **Likelihood**: Medium | **Impact**: Medium
- **Triggers**: React Query fires 5 queries on mount; all get 401 simultaneously; each tries to refresh; token rotation makes second refresh fail
- **Mitigation**: Module-level `isRefreshing` flag + Promise queue in `shared/lib/api.ts` (see T06 description)
- **Fallback**: Extend access token to 1 hour for demo only

### R04 — React Query cache flicker after drag-drop
- **Likelihood**: Medium | **Impact**: Medium
- **Triggers**: `onSettled` fires `invalidateQueries` → re-fetch overwrites optimistic state before network responds
- **Mitigation**: In `onSettled`, only invalidate if a rollback happened; rely on WS events for other clients
- **Fallback**: Remove `onSettled` invalidation; board stays fresh via WS; invalidate only on disconnect

### R05 — Time overrun on Day 3 (Kanban)
- **Likelihood**: Medium | **Impact**: Medium
- **Minimum shippable state**: T23 (board renders) + T25 (optimistic DnD) without real-time. Add T36 (WS) on Day 5.
- **Fallback priority**: Kanban + optimistic updates + RBAC = demo-ready. Notifications + Dashboard are additive.

### R06 — WhiteNoise / static files in production
- **Likelihood**: Low | **Impact**: Low
- **Mitigation**: `collectstatic --noinput` runs in Docker startup command; `STATICFILES_STORAGE = CompressedManifestStaticFilesStorage`; already verified working in dev

### R07 — Vite proxy not forwarding WebSocket upgrades
- **Likelihood**: Low | **Impact**: High (WS fails in dev without Docker)
- **Mitigation**: `vite.config.ts` must have `ws: true` on the `/ws` proxy entry (see T05)
- **Fallback**: Connect WS client directly to `ws://localhost:8000` (bypass Vite proxy) in dev

---

## Quick Reference: Task → Day Map

| Day | Tasks | Theme |
|---|---|---|
| Day 1 | T01 ✅, T02 ✅, T03 ✅, T04 ✅, T05 ✅, T06 ✅, T07 ✅ | Foundation |
| Day 2 | T08 ✅, T09 ✅, T10 ✅, T11 ✅, T12 ✅, T13 ✅, T14 ✅, T15 ✅, T16 ✅, T17 ✅, T18 ✅, T19 ✅, T20 ✅ | Core domain + frontend shell |
| Day 3 | T21 ✅, T22 ✅, T23 ✅, T24 ✅, T25 ✅, T26 ✅, T27 ✅ | Kanban board hero feature |
| Day 4 | T28 ✅, T29 ✅, T30 ✅, T31 ✅, T32 ✅, T33 ✅ | Issue detail depth |
| Day 5 | T34 ✅, T35 ✅, T36 ✅, T37 ✅, T38 ✅, T39 ✅, T40 ✅, T41 ✅ | Real-time + search + notifications |
| Day 6 | T42 ✅, T43 ✅, T44 ✅, T45 ✅, T46 ✅, T47 ✅ | Dashboard + polish |
| Day 7 | T48 ✅, T49 ✅, T50 ✅, T51 | Seed data + deploy |

**Completed**: T01–T50
**Next**: T51 (README + deploy to Railway/Render)

**Minimum viable demo** (if short on time): T01–T11 + T16–T20 + T21–T25 + T34–T36 + T14 = working Kanban with real-time sync and auth. Everything else is additive.
