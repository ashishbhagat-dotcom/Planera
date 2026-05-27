# Planera — Extension Roadmap

> **Purpose**: Implementation roadmap for post-launch feature extensions.
> **Baseline**: T01–T50 completed. Production running at `http://216.48.183.12`.
> **Principle**: MVP-first. Every feature must be demo-able in under 60 seconds. No over-engineering.

---

## Current State

### Completed (T01–T50)
- Auth (JWT + httpOnly refresh cookie) — production-grade
- Workspace / Membership / RBAC — owner / admin / member roles enforced
- Projects with unique keys (PLT, MOB, etc.)
- Issues with fractional-index ordering, status/priority, labels, due dates, estimates
- Kanban board with DnD + optimistic updates — the hero feature
- Real-time WebSocket sync via Django Channels + Celery + Redis
- Issue detail panel (comments, activity, markdown description)
- Command palette (Cmd+K) with full-text search
- Dashboard with Recharts (stat cards + activity feed)
- Notifications (WebSocket push + panel)
- Seed data: workspace "Acme Engineering", 3 users, 2 projects, 30 issues, 5 labels

### Active File Structure (Reference)
```
server/
  users/          — User, OTPRegistration
  organizations/  — Organization, Membership
  projects/       — Project
  issues/         — Issue, Label, Activity, Comment
  notifications/  — Notification
  analytics/      — DashboardService
  realtime/       — BoardConsumer, NotificationConsumer, JWTAuthMiddleware
  core/           — BaseModel, fractional_index, pagination, permissions

client/src/
  modules/
    auth/         — LoginForm, RegisterForm, authStore, authApi
    board/        — BoardView, BoardColumn, BoardCard, useBoardDnD, useBoardSocket
    dashboard/    — DashboardPage, StatCard, StatusChart, ActivityFeed
    issue/        — IssueListView, IssueDetailPanel, IssueProperties, IssueRow
    notifications/— NotificationPanel, useNotificationSocket
    project/      — ProjectList, ProjectCard, CreateProjectModal
    workspace/    — WorkspaceSwitcher, workspaceStore
  shared/
    stores/       — uiStore (sidebar, activeIssueId, darkMode...), filtersStore
    lib/          — api.ts (Axios), queryClient.ts (React Query), ws.ts (WebSocket)
    components/   — AppShell, Sidebar, CommandPalette, UI primitives
    types/        — models.ts, enums.ts, api.ts
```

### Known Gaps to Fix Before Extending
These are small but compound the quality of every feature added after them.

| # | Area | Fix |
|---|------|-----|
| 1 | Default landing page | Change `/app` redirect from `/app/dashboard` to `/app/my-issues` (after E01 is built) |
| 2 | WS reconnect UX | Add a thin yellow banner "Reconnecting…" at top of board when WS drops |
| 3 | Board empty state | Ensure "Create your first issue" CTA renders in each empty column |
| 4 | Issue detail skeleton | Show skeleton inside panel before data arrives (add `will-change: transform`) |
| 5 | Dark mode sweep | Audit modals, dropdowns, command palette against `tokens.css` |

---

## Feature Index

| ID | Feature | Priority | Complexity | Time | Schema Change |
|----|---------|----------|------------|------|---------------|
| E01 | My Issues Page | High | Low | 3h | None |
| E02 | Cycles (Sprints) ✅ COMPLETED | High | Medium | 6h | New table + FK on Issue |
| E03 | Sub-Issues | High | Low-Med | 3h | nullable `parent_id` on Issue |
| E04 | Bulk Actions | High | Medium | 3.5h | None |
| E05 | Favorites | Medium | Low | 2h | New table |
| E06 | AI Issue Assistant | High | Medium | 5h | None |
| E07 | Keyboard Navigation | Medium | Low | 2h | None |
| E08 | Issue Relations | Medium | Medium | 3h | New table |
| E09 | Custom Views (Saved Filters) | Medium | Medium | 3h | New table |
| E10 | Workspace Settings UI | Medium | Low | 2h | None |
| E11 | Due Date Features | Medium | Low | 1.5h | None (field exists) |
| E12 | Issue Templates | Future | Low | 2.5h | New table |

---

## High Priority Features

---

### E01 — My Issues Page

**Why**: First thing a user opens every morning in Linear. Makes Planera person-centric, not just project-centric. Zero schema changes — pure query.

**Complexity**: Low | **Time**: 3h | **Demo**: "Every issue assigned to me, across all projects, in one view."

#### Backend

**1. Add `MyIssuesView` to `issues/views.py`:**
```python
class MyIssuesView(ListAPIView):
    serializer_class = IssueListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = IssueFilterSet
    ordering_fields = ['status', 'priority', 'due_date', 'created_at']

    def get_queryset(self):
        return (
            Issue.objects
            .filter(assignee=self.request.user, project__organization=self.request.organization)
            .select_related('project', 'creator', 'assignee')
            .prefetch_related('labels')
        )
```

**2. Add `group_by` support** — add optional `?group_by=status|project|priority` query param. Grouping is done on the frontend via a selector transform (avoids complex server-side aggregation).

**3. Add URL to `issues/urls.py`:**
```python
path('me/issues/', MyIssuesView.as_view(), name='my-issues'),
```

**4. Add to `config/urls.py`** under `api/v1/`:
```python
path('api/v1/', include('issues.urls')),
```
*(Already included — just add the new path in `issues/urls.py`.)*

#### Frontend

**1. Create `client/src/modules/issue/hooks/useMyIssues.ts`:**
```typescript
export function useMyIssues(filters?) {
  return useQuery({
    queryKey: queryKeys.issues.mine(filters),
    queryFn: () => issueApi.getMyIssues(filters),
  })
}
```

**2. Add `getMyIssues()` to `client/src/modules/issue/services/issueApi.ts`.**

**3. Create `client/src/modules/issue/components/MyIssuesPage.tsx`:**
- Grouped list view: collapsible sections by status (default), project, or priority
- Group header shows count badge + collapse chevron
- Each row reuses `IssueRow.tsx`
- "Group by" dropdown in page header (status / project / priority)
- Empty state: "No issues assigned to you"

**4. Add to Router.tsx:**
```tsx
<Route path="my-issues" element={<MyIssuesPage />} />
```

**5. Update `AppShell` default redirect:** change `/app` → `/app/my-issues` (after this feature is built).

**6. Add to `Sidebar.tsx`** as first nav item:
```tsx
{ label: 'My Issues', icon: CircleUser, path: '/app/my-issues', badge: openCount }
```

**7. Add `queryKeys.issues.mine()` to `queryClient.ts`:**
```typescript
mine: (filters?: unknown) => ['issues', 'mine', filters]
```

**State management**: No new store needed. Use React Query. `filtersStore` can be reused for filter chips.

**Dependencies**: T11 (Issue API), T17 (AppShell)

---

### E02 — Cycles (Sprints)

**Why**: Linear's signature feature. Turns Planera from a static board into a time-aware planning tool. Progress bar + active sprint sidebar widget are the money shots.

**Complexity**: Medium | **Time**: 6h | **Demo**: "Sprint 3 — 68% complete, 2 days left. I can see everything in-flight."

#### Schema Changes

**1. Add `Cycle` model to `projects/models.py`:**
```python
class Cycle(BaseModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='cycles')
    name = models.CharField(max_length=100)  # "Sprint 3" or "2024-W38"
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ], default='upcoming')

    class Meta:
        db_table = 'projects_cycle'
        ordering = ['-start_date']
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='cycle_end_after_start'
            )
        ]
```

**2. Add nullable FK on `Issue` in `issues/models.py`:**
```python
cycle = models.ForeignKey(
    'projects.Cycle', null=True, blank=True,
    on_delete=models.SET_NULL, related_name='issues'
)
```

**3. Write migration** (`projects/migrations/000X_add_cycle.py` + `issues/migrations/000X_add_cycle_fk.py`).

#### Backend

**4. Add serializers to `projects/serializers.py`:**
- `CycleSerializer` — list fields: id, name, status, start_date, end_date, progress (computed)
- `CycleDetailSerializer` — includes `issue_counts_by_status` (annotated dict)
- `CycleCreateSerializer` — validates `end_date > start_date`

**5. Add `CycleViewSet` to `projects/views.py`:**
- Nested under project: `GET/POST /api/v1/projects/:key/cycles/`
- `retrieve`: returns `CycleDetailSerializer` with issue counts
- `@action(detail=False) active_cycle` — returns the single active cycle (or null)

**6. Add `set_cycle` action to `IssueViewSet` in `issues/views.py`:**
- `POST /api/v1/projects/:key/issues/:identifier/set-cycle/`
- Body: `{ cycle_id: UUID | null }` — assigns or removes issue from cycle

**7. Update `IssueListSerializer` to include `cycle_id` field.**

**8. Extend `IssueFilterSet` with `cycle` filter.**

**9. Add cycle URLs to `projects/urls.py`.**

**10. Update seed script** (`seed_demo.py`) to create 2 cycles per project: one active (60% done), one upcoming.

#### Frontend

**11. Create `client/src/modules/cycle/` module:**
```
cycle/
  services/cycleApi.ts     — listCycles(), getCycle(), createCycle(), patchCycle()
  hooks/useCycles.ts       — React Query list hook
  hooks/useCycle.ts        — React Query detail hook
  hooks/useCycleMutations.ts — create, update, setIssue
  components/
    CycleList.tsx          — list of all cycles with status chips
    CycleDetail.tsx        — filtered issue list/board for this cycle
    CycleCard.tsx          — card with progress bar and date range
    CycleProgressBar.tsx   — animated stacked bar (done=green, in_progress=blue, rest=gray)
    ActiveCycleWidget.tsx  — compact sidebar widget showing active sprint %
    CreateCycleModal.tsx   — name + date range picker
  index.ts
```

**12. Add routes to `Router.tsx`:**
```tsx
<Route path="projects/:key/cycles" element={<CycleList />} />
<Route path="projects/:key/cycles/:cycleId" element={<CycleDetail />} />
```

**13. Update `Sidebar.tsx`:**
- Add "Cycles" nav item under project section
- Show `ActiveCycleWidget` below nav (mini progress bar if active cycle exists)

**14. Update `IssueDetailPanel.tsx`:**
- Add "Cycle" property row — dropdown to assign/remove issue from a cycle

**15. Add `queryKeys.cycles` to `queryClient.ts`:**
```typescript
cycles: {
  all: (projectKey: string) => ['cycles', projectKey],
  detail: (cycleId: string) => ['cycles', 'detail', cycleId],
}
```

**State management**: React Query only. No Zustand needed.

**Real-time**: On issue `move` WS event, if `cycle_id` changed, invalidate `queryKeys.cycles.detail(cycleId)`.

**Dependencies**: E01, T08 (Project model), T11 (Issue API)

**Risk**: Auto-setting `status` to "active/completed" based on dates — implement as a computed property in the serializer (not a Celery task) to keep it simple. Celery automation is future scope.

---

### E03 — Sub-Issues

**Why**: Real projects decompose tasks. "Build auth" → "Design login", "Implement JWT", "Write tests". Table-stakes for any PM tool.

**Complexity**: Low-Medium | **Time**: 3h | **Demo**: "This epic has 5 sub-tasks — 3 done. See the progress right on the card."

**Rule**: Max 1 level deep (same as Linear). Enforced in serializer — reject `parent_id` if the parent itself has a `parent_id`.

#### Schema Changes

**1. Add `parent` FK to `Issue` in `issues/models.py`:**
```python
parent = models.ForeignKey(
    'self', null=True, blank=True,
    on_delete=models.CASCADE, related_name='sub_issues'
)
```

**2. Write migration** (`issues/migrations/000X_add_parent_fk.py`).

#### Backend

**3. Update `IssueDetailSerializer` in `issues/serializers.py`:**
- Add `sub_issues` field: `SubIssueSerializer(many=True, read_only=True)` (id, identifier, title, status, priority, assignee)
- Add `parent` field: `SubIssueSerializer(read_only=True)` (shows parent info if sub-issue)
- Add `sub_issue_count` and `completed_sub_issue_count` computed fields

**4. Update `IssueCreateSerializer`:**
- Accept optional `parent_id`
- Validate: parent exists in same project, parent has no parent itself

**5. Update `IssueService.create_issue()`** to accept and store `parent_id`.

**6. Update `IssueListSerializer`** to include `sub_issue_count` and `completed_sub_issue_count` for progress display.

#### Frontend

**7. Update `IssueDetailPanel.tsx`:**
- Add "Sub-issues" section below description
- List: `SubIssueRow` component (status dot, identifier, title, click to open)
- "+ Add sub-issue" button: opens `CreateIssueModal` with `parent_id` pre-set and project locked

**8. Update `IssueRow.tsx`:**
- If `sub_issue_count > 0`, show `▸ 2/5` indicator on right side

**9. Update `BoardCard.tsx`:**
- If sub-issues exist, add a thin progress bar at bottom of card
- `completedCount / totalCount` × 100% filled in accent color

**10. Update `CreateIssueModal.tsx`:**
- Accept optional `parentId` prop
- If provided, show "Sub-issue of: PLT-12" badge and hide project selector

**11. Update types in `shared/types/models.ts`:**
- Add `parent?: Issue`, `sub_issues?: Issue[]`, `sub_issue_count?: number`, `completed_sub_issue_count?: number` to `Issue`

**Dependencies**: T09 (Issue model), T25 (useIssueMutations)

**Risk**: Cascade delete — if parent is deleted, all sub-issues delete too. This is correct behavior (same as Linear) but ensure `useDeleteIssue` shows a confirmation dialog when `sub_issue_count > 0`.

---

### E04 — Bulk Actions

**Why**: The "power user" feature. Select 8 issues → move all to Done → cards animate simultaneously. Viscerally satisfying.

**Complexity**: Medium | **Time**: 3.5h | **Demo**: "Select 5 issues, bulk-assign to Bob, bulk-move to In Review — done."

#### Backend

**1. Add `BulkUpdateView` to `issues/views.py`:**
```python
class BulkUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def post(self, request):
        serializer = BulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = IssueService.bulk_update(
            identifiers=serializer.validated_data['identifiers'],
            changes=serializer.validated_data['changes'],
            actor=request.user,
            org=request.organization,
        )
        return Response(IssueListSerializer(updated, many=True).data)
```

**2. Add `BulkUpdateSerializer` to `issues/serializers.py`:**
```python
class BulkUpdateSerializer(serializers.Serializer):
    identifiers = serializers.ListField(child=serializers.CharField(), min_length=1, max_length=100)
    changes = serializers.DictField()  # {status?, priority?, assignee_id?, cycle_id?, label_ids?[]}
```

**3. Add `IssueService.bulk_update()` to `issues/services.py`:**
- Single `transaction.atomic()` block
- Validate all identifiers belong to `request.organization`
- `Issue.objects.filter(identifier__in=identifiers, ...).update(**changes)`
- Create one Activity entry per changed field per issue
- `on_commit` → broadcast each updated issue via Celery

**4. Add URL:** `path('issues/bulk-update/', BulkUpdateView.as_view(), name='issues-bulk-update')`

#### Frontend

**5. Create `client/src/shared/stores/selectionStore.ts`:**
```typescript
interface SelectionStore {
  selectedIds: Set<string>         // issue identifiers
  toggle: (id: string) => void
  selectRange: (ids: string[]) => void
  selectAll: (ids: string[]) => void
  clear: () => void
}
```

**6. Update `IssueRow.tsx`:**
- Checkbox appears on hover on the left (before priority icon)
- Shift+click triggers `selectRange`
- Row gets highlighted background when selected

**7. Update `BoardCard.tsx`:**
- Checkbox appears on hover in top-left corner
- Card gets a colored border ring when selected

**8. Create `client/src/shared/components/ui/BulkActionBar.tsx`:**
- Fixed bottom bar: `translate-y-0` when `selectedIds.size > 0`, else `translate-y-full`
- Shows: "{N} selected" + Status dropdown + Priority dropdown + Assignee dropdown + Label dropdown + Delete (destructive, red)
- "Clear selection" × button on right
- Fires `useBulkUpdate` mutation → clears selection on success

**9. Add `useBulkUpdate` to `useIssueMutations.ts`:**
- On success: `queryClient.invalidateQueries(queryKeys.issues.all(...))` for all affected projects

**10. Mount `BulkActionBar` in `AppShell.tsx`** so it appears across all views.

**11. Add keyboard shortcut `X`** to toggle selection on focused issue (extend `useKeyboardShortcut`).

**State management**: `selectionStore` is a new Zustand store. Clear selection on route change (via `useEffect` watching `pathname`).

**Dependencies**: E01 (for My Issues bulk actions), T25 (useIssueMutations)

---

### E06 — AI Issue Assistant

**Why**: The "wow" feature. Nobody expects AI in an internal PM tool. One moment of "AI just wrote my spec" changes the entire perception of the demo.

**Complexity**: Medium | **Time**: 5h

**Architecture decision**: Backend proxy only. API key never touches the frontend. Adds rate limiting and prompt engineering control server-side.

**AI Provider**: Anthropic Claude API (claude-haiku-4-5 for speed/cost, claude-sonnet-4-6 for quality).

#### Backend

**1. Install Anthropic SDK** in `server/requirements.txt`:
```
anthropic>=0.34.0
```

**2. Create `ai/` Django app:**
```
server/ai/
  __init__.py
  views.py
  urls.py
  services.py
  prompts.py
  apps.py
```
Add `'ai'` to `INSTALLED_APPS` in `base.py`.

**3. Add `ANTHROPIC_API_KEY` to settings:**
```python
# base.py
ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')
```

**4. Create `ai/prompts.py`** with prompt templates:
```python
IMPROVE_DESCRIPTION_PROMPT = """
You are a technical product manager. Rewrite the following issue description into a clear, structured spec.

Format your output as:
**Problem**: (1-2 sentences describing what's broken or missing)
**Expected behavior**: (what should happen)
**Acceptance criteria**:
- [ ] criterion 1
- [ ] criterion 2
**Notes**: (optional — edge cases, dependencies)

Issue title: {title}
Current description: {description}

Respond with only the rewritten description. No preamble.
"""

GENERATE_SUBTASKS_PROMPT = """
You are a senior engineer breaking down a task into sub-tasks.

Given the issue below, generate 3-5 concrete, actionable sub-tasks.
Each sub-task should be a single clear sentence, starting with a verb.

Issue title: {title}
Description: {description}

Respond with a JSON array of strings: ["Sub-task 1", "Sub-task 2", ...]
"""

ESTIMATE_EFFORT_PROMPT = """
You are an experienced software engineer. Estimate the story points and priority for this issue.

Respond with JSON only:
{{"story_points": <1|2|3|5|8|13>, "priority": <"urgent"|"high"|"medium"|"low">, "reasoning": "<one sentence>"}}

Issue title: {title}
Description: {description}
"""
```

**5. Create `ai/services.py`:**
```python
import anthropic
from django.conf import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

def call_claude(prompt: str, max_tokens: int = 1024) -> str:
    message = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=max_tokens,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return message.content[0].text
```

**6. Create `ai/views.py`** with `AISuggestView`:
```python
class AISuggestView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_ACTIONS = ('improve_description', 'generate_subtasks', 'estimate_effort')

    def post(self, request):
        action = request.data.get('action')
        if action not in self.ALLOWED_ACTIONS:
            return Response({'error': 'Invalid action'}, status=400)
        if not settings.ANTHROPIC_API_KEY:
            return Response({'error': 'AI not configured'}, status=503)

        context = request.data.get('context', {})
        result = AIService.run(action=action, context=context)
        return Response({'result': result})
```

**7. Add URL in `ai/urls.py`** and `config/urls.py`:
```python
path('api/v1/ai/', include('ai.urls')),
```

**8. Add `ANTHROPIC_API_KEY` to `docker-compose.yml`** under `api` environment:
```yaml
- ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```
And to `.env.example`.

#### Frontend

**9. Create `client/src/modules/ai/` module:**
```
ai/
  services/aiApi.ts       — suggestImproveDescription(), suggestSubtasks(), estimateEffort()
  hooks/useAISuggest.ts   — React Query mutation
  components/
    AIAssistButton.tsx    — sparkle (✨) icon button with dropdown
    AIResultPanel.tsx     — shows result with Apply / Discard buttons
    AILoadingState.tsx    — animated "Thinking…" shimmer
  index.ts
```

**10. `AIAssistButton.tsx`** — dropdown with three actions:
- ✨ Improve description
- 🔀 Generate sub-tasks
- ⚡ Estimate effort & priority

**11. `AIResultPanel.tsx`** — renders below trigger:
- Loading: shimmer skeleton
- Success: rendered Markdown result + "Apply" (green) + "Discard" (ghost) buttons
- Error: "AI unavailable, try again" with retry

**12. Update `IssueDetailPanel.tsx`:**
- Import and mount `AIAssistButton` in the header toolbar (beside Delete button)
- "Apply improve_description" → calls `useUpdateIssue` with new description
- "Apply generate_subtasks" → calls `useCreateIssue` N times with `parent_id` set
- "Apply estimate_effort" → calls `useUpdateIssue` with `priority` + `estimate`

**13. Add `queryKeys.ai` to `queryClient.ts`** (optional, mutations only):
```typescript
ai: { suggest: (action: string, issueId: string) => ['ai', action, issueId] }
```

**State management**: No Zustand needed. `useAISuggest` is a mutation with local `data` state.

**Dependencies**: E03 (sub-task creation uses parent_id)

**Risk**: API key cost in demo. Use `claude-haiku-4-5-20251001` (cheapest) for speed. Add a 5-second debounce and disable button while loading.

---

## Medium Priority Features

---

### E05 — Favorites

**Why**: Small feature, large UX impact. Personalizes the sidebar. Linear has it prominently.

**Complexity**: Low | **Time**: 2h

#### Schema Changes

Add `Favorite` model to `users/models.py`:
```python
class Favorite(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    target_type = models.CharField(max_length=20)  # 'project' | 'issue'
    target_id = models.UUIDField()
    position = models.CharField(max_length=50, default='a0')  # fractional index for ordering

    class Meta:
        db_table = 'users_favorite'
        unique_together = ('user', 'target_type', 'target_id')
        ordering = ['position']
```

#### Backend

- `FavoriteSerializer` (id, target_type, target_id, position, plus resolved `title`/`name`)
- `FavoriteViewSet`: list, create, destroy + `reorder` action
- URL: `api/v1/favorites/`

#### Frontend

- `client/src/modules/favorites/` module (services, hooks, components)
- Star icon on `ProjectCard.tsx` and `IssueDetailPanel.tsx` header
- Sidebar "Favorites" section above main nav — shows items with icons and names
- DnD reordering using existing `@dnd-kit` setup

**Dependencies**: Core models

---

### E07 — Keyboard Navigation

**Why**: Linear is famous for being keyboard-first. Adds authenticity and impresses power users.

**Complexity**: Low | **Time**: 2h | **Frontend-only**.

#### Shortcuts to implement

| Key | Context | Action |
|-----|---------|--------|
| `J` / `K` | Issue list / Board | Focus next / previous issue |
| `Enter` | Issue focused | Open detail panel |
| `X` | Issue focused | Toggle selection (E04) |
| `S` | Issue detail open | Cycle through statuses |
| `P` | Issue detail open | Cycle through priorities |
| `A` | Issue detail open | Open assignee picker |
| `L` | Issue detail open | Open label picker |
| `C` | Board / List | Open QuickCreate |
| `?` | Global | Show shortcuts modal |
| `Cmd+K` | Global | Command palette (already done) |
| `Esc` | Any panel | Close (already done) |

#### Implementation

**1. Create `client/src/shared/hooks/useKeyboardNavigation.ts`:**
- Tracks `focusedIndex` in a list context
- Exposes `focusedId`, `focusNext()`, `focusPrev()`, keyboard event handler

**2. Create `client/src/shared/components/layout/ShortcutsModal.tsx`:**
- Triggered by `?` key via `useKeyboardShortcut`
- Modal with two-column grid of all shortcuts
- Each row: key chip + description

**3. Update `IssueRow.tsx` and `BoardCard.tsx`:**
- Add `tabIndex`, `data-focused` attribute
- Visible focus ring when keyboard-navigated

**4. Extend `useKeyboardShortcut`** to support `S`, `P`, `A`, `L` when `uiStore.activeIssueId` is set.

**Dependencies**: T38 (existing `useKeyboardShortcut`)

---

### E08 — Issue Relations

**Why**: "This issue blocks 3 others" — gives context to work prioritization.

**Complexity**: Medium | **Time**: 3h

#### Schema Changes

Add `IssueRelation` model to `issues/models.py`:
```python
class IssueRelation(BaseModel):
    source = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='relations_from')
    target = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='relations_to')
    relation_type = models.CharField(max_length=20, choices=[
        ('blocks', 'Blocks'),
        ('blocked_by', 'Blocked by'),
        ('relates_to', 'Relates to'),
        ('duplicate_of', 'Duplicate of'),
    ])

    class Meta:
        db_table = 'issues_relation'
        unique_together = ('source', 'target', 'relation_type')
```

#### Backend

- `IssueRelationSerializer`
- `RelationViewSet` nested under issue detail
- `POST /api/v1/projects/:key/issues/:identifier/relations/`
- `DELETE /api/v1/projects/:key/issues/:identifier/relations/:id/`

#### Frontend

- "Relations" section in `IssueDetailPanel.tsx`
- Linked issue chips showing relation type + identifier
- "Add relation" opens a search-and-select (reuse command palette search)
- Blocked issues show 🔴 indicator on `BoardCard.tsx`

**Dependencies**: T09 (Issue model), T28 (IssueDetailPanel)

---

### E09 — Custom Views (Saved Filters)

**Why**: Power users build their own workflows. "Show me all high-priority unassigned bugs across all projects."

**Complexity**: Medium | **Time**: 3h

#### Schema Changes

Add `SavedView` model to `organizations/models.py`:
```python
class SavedView(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='saved_views')
    creator = models.ForeignKey('users.User', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='filter')
    filters = models.JSONField()  # {status:[], priority:[], assignee_id:str, labels:[], project_key:str}
    is_shared = models.BooleanField(default=False)
    project = models.ForeignKey('projects.Project', null=True, blank=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'organizations_saved_view'
        ordering = ['name']
```

#### Backend

- `SavedViewSerializer`, `SavedViewViewSet`
- `GET/POST /api/v1/views/` and `DELETE /api/v1/views/:id/`

#### Frontend

- "Save current filters as view" button in `BoardHeader.tsx`
- "Views" section in `Sidebar.tsx` (below Favorites)
- Clicking a saved view: applies `filtersStore` filters + navigates to project

**Dependencies**: T27 (filtersStore), E05 (Favorites — sidebar section pattern)

---

### E10 — Workspace Settings UI

**Why**: Member management and label management are currently API-only. This gives them a UI — makes Planera feel like a real product.

**Complexity**: Low | **Time**: 2h | **No schema changes** — wraps existing API.

#### Implementation

**1. `client/src/app/pages/SettingsPage.tsx`** already exists (stub). Build it out with three tabs:

- **General tab**: Workspace name, slug (read-only), logo URL — PATCH `/api/v1/workspaces/:slug/`
- **Members tab**: Table of members (avatar, name, email, role dropdown, remove button) — wraps `useMembers` + `workspaceApi.updateMemberRole()` / `inviteMember()`; gated by `<RoleGuard roles={['owner','admin']}>`
- **Labels tab**: List labels with color swatches + delete button + "New label" inline form — wraps `LabelViewSet`

**2. The route `/app/settings` already exists in Router.tsx** — just build out the page.

**Dependencies**: T04 (Workspace API), T14 (RBAC), T44 (RoleGuard)

---

### E11 — Due Date Features

**Why**: `due_date` field already exists on Issue. Just needs better UI surface. Quick win.

**Complexity**: Low | **Time**: 1.5h | **No schema changes**.

#### Implementation

**1. Update `BoardCard.tsx`:**
- Show `due_date` with calendar icon below title if set
- Red text + red icon if overdue (`due_date < today`)
- Orange text if due today

**2. Update `IssueProperties.tsx`:**
- Replace the due_date text display with a native `<input type="date">` that fires `useUpdateIssue` on change

**3. Update `MyIssuesPage.tsx` (E01):**
- Add "Overdue" group at the top of the page — red section header accent

**4. Update `StatCard.tsx` in `DashboardPage.tsx`:**
- "Overdue" stat card turns red background when `overdue_count > 0`

**Dependencies**: E01 (MyIssuesPage)

---

## Future Scope

These are architecturally significant. Don't rush them.

| Feature | Why defer | Estimated effort |
|---------|-----------|-----------------|
| **Roadmap / Timeline view** | Requires Gantt-style component, complex date math, zoom levels | 10–15h |
| **GitHub Integration** | OAuth app registration, webhook receiver, PR↔Issue linking | 6–8h |
| **Automations / Workflows** | Rule engine ("when status=done, close cycle") needs careful schema | 10h+ |
| **Custom Fields** | Polymorphic types, dynamic form rendering, filter integration | 8h+ |
| **Email Notifications** | OTP backend already built — needs Celery templates + unsubscribe links | 3h (after domain verified) |
| **Audit Log** | Immutable append-only log of all state changes, queryable | 3h |
| **File Attachments** | S3/MinIO + drag-drop upload + image preview in description | 5h |
| **Triage / Inbox** | Unassigned + untriaged queue with snooze | 4h |
| **Multi-workspace onboarding** | Currently works but lacks an onboarding flow for new workspaces | 4h |
| **Issue Templates (E12)** | Template pre-fills description + priority + labels on issue creation | 2.5h |
| **Time Tracking** | Log hours per issue, total per cycle | 4h |

### E12 — Issue Templates (Future)

When ready:

**Schema** — add `IssueTemplate` model to `organizations/models.py`:
```python
class IssueTemplate(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=100)  # "Bug Report", "Feature Request"
    description_template = models.TextField()
    default_priority = models.CharField(max_length=20, null=True, blank=True)
    default_labels = models.ManyToManyField('issues.Label', blank=True)
```

**Seed data**: 3 built-in templates — Bug Report, Feature Request, Improvement.

**Frontend**: "Use template" dropdown in `CreateIssueModal.tsx` — pre-fills description, priority, and labels from template.

---

## Schema Changes Summary

All changes are additive (no existing columns modified, only nullable columns added):

```sql
-- E02: Cycles
CREATE TABLE projects_cycle (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cycle_end_after_start CHECK (end_date > start_date)
);
CREATE INDEX idx_cycle_project ON projects_cycle(project_id);
CREATE INDEX idx_cycle_status  ON projects_cycle(status);

-- E02: Add cycle FK to Issue
ALTER TABLE issues_issue
    ADD COLUMN cycle_id UUID NULL REFERENCES projects_cycle(id) ON DELETE SET NULL;
CREATE INDEX idx_issue_cycle ON issues_issue(cycle_id);

-- E03: Sub-issues
ALTER TABLE issues_issue
    ADD COLUMN parent_id UUID NULL REFERENCES issues_issue(id) ON DELETE CASCADE;
CREATE INDEX idx_issue_parent ON issues_issue(parent_id);

-- E05: Favorites
CREATE TABLE users_favorite (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations_organization(id) ON DELETE CASCADE,
    target_type     VARCHAR(20) NOT NULL,
    target_id       UUID NOT NULL,
    position        VARCHAR(50) NOT NULL DEFAULT 'a0',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_type, target_id)
);

-- E08: Issue Relations
CREATE TABLE issues_relation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES issues_issue(id) ON DELETE CASCADE,
    target_id       UUID NOT NULL REFERENCES issues_issue(id) ON DELETE CASCADE,
    relation_type   VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_id, target_id, relation_type)
);

-- E09: Saved Views
CREATE TABLE organizations_saved_view (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations_organization(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
    project_id      UUID NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) NOT NULL DEFAULT 'filter',
    filters         JSONB NOT NULL DEFAULT '{}',
    is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## New API Routes Summary

```
High Priority:
  GET    /api/v1/me/issues/                                  → E01 (MyIssuesView)
  GET    /api/v1/projects/:key/cycles/                       → E02 (CycleViewSet list)
  POST   /api/v1/projects/:key/cycles/                       → E02 (CycleViewSet create)
  GET    /api/v1/projects/:key/cycles/:id/                   → E02 (CycleViewSet detail)
  PATCH  /api/v1/projects/:key/cycles/:id/                   → E02 (CycleViewSet update)
  GET    /api/v1/projects/:key/cycles/active/                → E02 (active_cycle action)
  POST   /api/v1/projects/:key/issues/:id/set-cycle/         → E02 (assign to cycle)
  POST   /api/v1/issues/bulk-update/                         → E04 (BulkUpdateView)
  POST   /api/v1/ai/suggest/                                 → E06 (AISuggestView)

Medium Priority:
  GET    /api/v1/favorites/                                  → E05
  POST   /api/v1/favorites/                                  → E05
  DELETE /api/v1/favorites/:id/                              → E05
  POST   /api/v1/projects/:key/issues/:id/relations/         → E08
  DELETE /api/v1/projects/:key/issues/:id/relations/:rel_id/ → E08
  GET    /api/v1/views/                                      → E09
  POST   /api/v1/views/                                      → E09
  DELETE /api/v1/views/:id/                                  → E09

Existing routes updated:
  GET  /api/v1/projects/:key/issues/   — add ?cycle= filter (E02)
  GET  /api/v1/projects/:key/issues/   — add sub_issue_count, cycle_id to serializer (E02, E03)
```

---

## New Frontend Routes

```
/app/my-issues                          → E01  (new default landing after login)
/app/projects/:key/cycles               → E02
/app/projects/:key/cycles/:cycleId      → E02
/app/settings                           → E10  (already exists as stub — build it out)
```

---

## New Zustand Stores

```typescript
// E04 — Selection for bulk actions
selectionStore: {
  selectedIds: Set<string>   // issue identifiers
  toggle(id: string): void
  selectRange(ids: string[]): void
  selectAll(ids: string[]): void
  clear(): void
}
```

All other features use React Query only — no additional Zustand needed.

---

## queryKeys Additions

```typescript
// Add to queryClient.ts
issues: {
  ...existing,
  mine: (filters?: unknown) => ['issues', 'mine', filters],     // E01
},
cycles: {
  all:    (projectKey: string)  => ['cycles', projectKey],       // E02
  detail: (cycleId: string)     => ['cycles', 'detail', cycleId], // E02
  active: (projectKey: string)  => ['cycles', projectKey, 'active'], // E02
},
favorites: {
  all: () => ['favorites'],                                       // E05
},
views: {
  all: () => ['views'],                                           // E09
},
```

---

## Recommended Implementation Order

Build in this sequence — each feature unlocks or polishes the next:

```
Phase 1 — Quick wins (Day 1, ~6h)
  E11  Due date styling          (1.5h — touches existing components only)
  E01  My Issues page            (3h   — high impact, no schema change)
  E07  Keyboard navigation       (2h   — frontend only, pure polish)
  Pre-flight fixes               (1h   — WS banner, dark mode, empty states)

Phase 2 — Core extensions (Day 2, ~7h)
  E03  Sub-issues                (3h   — one migration, additive)
  E02  Cycles                    (6h   — new model, most complex feature)

Phase 3 — Power features (Day 3, ~8h)
  E04  Bulk actions              (3.5h — new store, BulkActionBar)
  E06  AI assistant              (5h   — new Django app, Anthropic integration)

Phase 4 — Polish layer (Day 4, ~7h)
  E05  Favorites                 (2h)
  E10  Workspace Settings UI     (2h)
  E08  Issue Relations           (3h)

Phase 5 — Future (post-launch)
  E09  Custom Views
  E12  Issue Templates
  Roadmap / Timeline view
  GitHub integration
```

**Why this order**:
- E11 first — touches only CSS/display logic, zero risk, immediate visual improvement
- E01 before E02 — My Issues is the new default page; cycles build on project context
- E03 before E06 — AI "generate sub-tasks" depends on sub-issues being implemented
- E04 and E06 in Phase 3 — highest complexity, most impressive, built on stable foundation

---

## Dependency Map

```
E11  ──► (none — due_date field already exists)
E01  ──► T11 (Issue API), T17 (AppShell)
E03  ──► T09 (Issue model), T25 (mutations)
E02  ──► E01 (context), T08 (Project), T11 (Issue API), E03 (for cycle issues)
E04  ──► T25 (mutations), E01 (bulk on My Issues)
E06  ──► E03 (generate sub-tasks needs parent_id)
E05  ──► (none significant)
E07  ──► T38 (useKeyboardShortcut exists), E04 (X to toggle selection)
E08  ──► T09 (Issue model), T28 (IssueDetailPanel)
E09  ──► T27 (filtersStore), E05 (sidebar pattern)
E10  ──► T04 (Workspace API), T44 (RoleGuard)
E12  ──► T09 (Issue model), T15 (seed script)
```

---

## Architecture Decisions

1. **Cycles in `projects` app** — tightly coupled to projects; a new `cycles` app adds migration complexity with no benefit at this scale.

2. **Sub-issues max 1 level deep** — same as Linear. Recursive trees make the UI unwieldy. Enforce in serializer: reject `parent_id` if the parent itself has a `parent_id`.

3. **AI uses backend proxy** — API key stays server-side. Adds rate limiting, caching, and prompt engineering control. Use `claude-haiku-4-5-20251001` (fast + cheap) for all demo actions.

4. **Bulk update is a single POST, not N PATCHes** — atomic transaction, single network round-trip, one broadcast per issue. Never loop PATCH requests from the frontend.

5. **Favorites use explicit `target_type` + `target_id`** instead of Django's `GenericForeignKey` — simpler queries, explicit types, no ContentType framework dependency.

6. **Saved Views filters stored as JSONB** — matches the `filtersStore` shape exactly, so applying a view is `filtersStore.setState(view.filters)` with no transformation.

7. **`selectionStore` clears on route change** — prevents ghost selections when navigating between projects or views.

---

## Demo Script (2-minute walkthrough)

1. **Login** → lands on **My Issues** — "Your personal command center"
2. **Keyboard demo** → J, J, Enter (open detail), S (cycle status), Esc — "entirely keyboard-driven"
3. **AI button** → vague title → ✨ Improve Description → "Apply" → spec auto-generated
4. **Sub-issues** → add 3 sub-tasks from the AI suggestion → progress bar appears on card
5. **Board** → drag card → second tab syncs in real-time — "live sync across team"
6. **Bulk select** → X × 5 → bulk move to Done → all animate simultaneously
7. **Cycles** → active sprint at 68% progress → "team is on track"
8. **Cmd+K** → search → Enter → navigate without mouse
9. **Dashboard** → stat cards + chart → workspace health overview
10. **Settings** → Members tab → invite a teammate (RBAC enforced)
