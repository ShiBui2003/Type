# HANDOFF

Full project history for this Typeform clone, phase by phase. This file
is meant to stand alone — read it and you should have the full picture
without needing to dig through commit history or chat logs.

## What this is

A functional Typeform clone: a drag-and-drop form builder, a full-screen
animated one-question-at-a-time respondent flow, and (not yet built) a
results dashboard with summary stats.

- `frontend/` — Next.js 16 (App Router, TypeScript, Tailwind v4)
- `backend/` — FastAPI + SQLAlchemy 2.0 + SQLite
- Deployed: frontend on Vercel (`https://type-one-tau.vercel.app`),
  backend on Railway (`https://type-production-7a20.up.railway.app`,
  SQLite on a persistent volume)
- Repo: `https://github.com/ShiBui2003/Type`

Two forms are seeded on first boot (idempotent — skipped if any form
already exists): **Customer Feedback Survey** (short_text, email,
multiple_choice, dropdown, long_text) and **Event RSVP**
(multiple_choice as a Yes/No toggle, number with min/max, date,
rating) — together covering all 8 question types with real seeded
responses.

## Architecture

Client-fetch-only throughout — no server components hitting the
database, no API routes on the Next.js side. The frontend is a pure
SPA-style client that talks to the FastAPI backend over
`NEXT_PUBLIC_API_URL`; the backend reads its CORS allow-list from
`ALLOWED_ORIGINS`. Neither side hardcodes the other's URL.

Frontend state is centralized in two React Context providers, both
following the same shape (reducer + debounced-save pattern):
- `FormBuilderContext` — the builder's form/question state, a per-key
  debounced autosave queue (800ms, coalesces multiple field edits into
  one PATCH), and a reorder concurrency guard (at most one reorder
  request in flight).
- `RespondentFlowContext` — the respondent flow's answers/errors/
  navigation state, with a submission guard (at most one submit
  request ever in flight) and a `stateRef` pattern so the document-level
  keyboard handler's callbacks never change identity (see Phase 3 for
  why this matters — it's a bug fix, not a stylistic choice).

Backend is one FastAPI app, two routers (`forms.py` for everything
authenticated-creator-facing, `public.py` for the two respondent-facing
endpoints), one shared `validation.py` module used by both the submit
endpoint and the seed script so persistence logic and client-facing
copy can't drift apart.

## Database schema — decisions and why

Six tables: `users`, `forms`, `questions`, `question_options`,
`responses`, `answers`.

- **`questions.position` is a float**, not an integer index. Drag-reorder
  writes one row (the moved question's position, recomputed as the
  midpoint between its new neighbors) instead of renumbering every
  sibling on every drag.
- **`questions.deleted_at` is a soft delete.** A published form's
  questions may already have answers attached; hard-deleting the row
  would either orphan those answers or cascade-delete them, silently
  destroying response history. The builder only ever shows
  `deleted_at IS NULL`; summary/export can still join back to a removed
  question's historical answers.
- **`answers` keeps typed columns (`value_text`/`value_number`/
  `value_option_id`) plus a `value_json` fallback.** The typed columns
  exist so SQL can `AVG()`/`GROUP BY` directly for the results view;
  `value_json` is the fallback of record — e.g. when an option is
  deleted from the builder, `value_option_id` gets nulled out but
  `value_json` still shows what was actually chosen at submission time.
- **`forms.slug` is random, nullable, and assigned once on first
  publish, then reused forever** — not derived from the title, and
  never re-editable once set (this is why `ShareLinkModal` has no
  "edit slug" control; that affordance would imply a feature that
  doesn't exist). *(A commit message references a `NOTES.md` for this
  — that file was never actually created; the slug-immutability
  rationale lives only in code comments in `models.py`/`types.ts` and
  here. Flagging the discrepancy rather than quietly leaving it.)*
- **`questions.settings_json` / `forms.theme_json` are free-form JSON**,
  not fixed columns. Forcing eight very different question types'
  config (rating scale, number min/max, multiple_choice's yes/no
  variant) into dedicated columns would make a table that's mostly
  nulls.

## API surface

```
GET    /api/forms                          list + response counts
POST   /api/forms                          create
GET    /api/forms/{id}                     full form + questions
PATCH  /api/forms/{id}                     title/welcome/thank-you/theme
DELETE /api/forms/{id}
POST   /api/forms/{id}/duplicate
POST   /api/forms/{id}/publish             assigns slug once, first time only
POST   /api/forms/{id}/unpublish
POST   /api/forms/{id}/questions           create question (+ options)
PATCH  /api/questions/{id}                 update question (+ sync options)
DELETE /api/questions/{id}                 soft delete
PATCH  /api/forms/{id}/questions/reorder   {question_id, after_id, before_id}
GET    /api/forms/{id}/responses           list responses (Phase 4 will use this)
GET    /api/responses/{id}                 single response detail
GET    /api/forms/{id}/summary             aggregate stats (Phase 4)

GET    /api/public/forms/{slug}            respondent-safe form shape
POST   /api/public/forms/{slug}/responses  submit; 422 with {errors: {question_id: message}}
```

## Visual design system

Two rounds of read-only recon against the real Typeform admin UI
(`docs/typeform-design-spec.md` has the full raw findings, including
explicit GAP markers for anything not directly measured). Landed as a
Tailwind v4 `@theme` block in `globals.css`, not hardcoded per
component:

- **Color**: near-black plum `#3C323E` ("ink") as the primary color
  everywhere a blue/black default would normally go — buttons, active
  tabs, links. Warm off-white page background `#FAFAFA`, `#F7F7F8`
  panels, `#FFFFFF` canvas/cards — panels are distinguished by
  background-color contrast alone, not borders or shadows.
- **Shadows**: a "ring" box-shadow system (`0 0 0 2–3px` at 6–9%
  opacity, near-black-plum tinted) on every elevated surface — modals,
  popovers, menus, theme tiles — instead of conventional blurred drop
  shadows.
- **Radius**: two-tier system — 8px buttons, 12px cards/menus/popovers,
  16px large modals, fully-pilled toggles.
- **Motion**: dominant ease `cubic-bezier(0.55,0,0.1,1)` at 200–300ms
  reused across fades/expands/hover states. Modal entrance is a plain
  opacity-only fade (175ms) — an earlier pass had guessed a springy
  entrance curve by inferring from adjacent CSS class names; a second
  recon pass directly measured the real keyframe and disproved that,
  corrected and documented as an explicit correction in the spec doc
  rather than silently overwritten.
- **Type**: system-font stack for admin chrome (13/14/16/21/24px, a
  tight scale); Inter (via `next/font/google`) for respondent-facing
  surfaces only — the builder's live-preview canvas and the real
  `/f/[slug]` flow — matching how real Typeform draws that same
  distinction.
- Respondent-facing **form themes** (`THEME_PRESETS` in
  `lib/constants.ts` — Default/Midnight/Tan/Mint) are a deliberately
  separate system from the admin design tokens above; one form's theme
  never leaks into another's or into builder chrome.

## Phase 0 — deploy skeleton

Next.js frontend and FastAPI backend scaffolded and deployed before any
real feature was built, specifically so the deploy pipeline itself
couldn't become a late-stage surprise. One health-check page proved the
two deployed services could actually reach each other (`NEXT_PUBLIC_API_URL`
→ Railway, `ALLOWED_ORIGINS` → Vercel) before Phase 1 wrote a single
model.

Verified: health check green on the live Vercel URL against live
Railway, including a manual Railway service restart to confirm the
persistent volume survives a restart.

## Phase 1 — backend

Full 6-table schema, every endpoint listed above, idempotent seeding
wired into FastAPI's lifespan handler (a fresh deploy self-seeds two
published forms with real responses, covering all 8 question types).
`validation.py` is the single source of truth for per-type answer
validation (required, email format, number min/max, date validity,
rating range, option-integrity) — shared by the submit endpoint and the
seed script.

Verified locally end-to-end: full CRUD lifecycle, reorder, publish/
unpublish slug persistence, every validation error path, option
deletion nulling out `value_option_id` while `value_json` preserves
the historical answer, and cascade delete behavior.

## Phase 2 — dashboard and three-panel builder

Dashboard: create/rename/duplicate/delete/publish/unpublish, a
copyable share-link modal. Builder: draggable question list (dnd-kit),
a question editor, a live preview panel that updates per keystroke, and
a Settings route (Thank You screen editor, preset themes, 5 explicitly
inert "Coming soon" stubs rather than fake-functional buttons).

Question type picker shows exactly the 8 types from the brief; Yes/No
is a toggle on `multiple_choice` (`settings_json.variant`), not a 9th
type or a separate component. dnd-kit's `onDragEnd` computes only the
moved question's new neighbors and sends
`{question_id, after_id, before_id}`, matching the backend's
single-row position-recompute contract exactly.

**Two real bugs caught during Playwright verification, not just tested
around:**
- dnd-kit's `DndContext` keys an internal effect on the `sensors`
  array; conditionally swapping it to `[]` to "disable" dragging during
  a pending reorder changed that array's length between renders and
  violated React's hook rules. Fixed by disabling via
  `pointer-events-none` instead of touching `sensors`.
- The builder's outer layout used `min-h-screen`, which only sets a
  floor — it doesn't give `h-full` descendants a definite height to
  resolve percentages/flex-grow against. The question list panel
  silently rendered at ~292px regardless of window size. Fixed with
  `h-screen` (a fixed height) + `min-h-0` on the flex-1 wrapper — the
  same two-part fix later reused for the Phase 3 respondent shell.

Styling passes (4 separate commits, each against a fresh round of
real-Typeform recon or screenshots) applied the design-system tokens
above to dashboard/builder chrome, fixed an OS-dark-mode auto-trigger
bug (Tailwind's default `dark:` variant is media-query-based; made it
class-based/opt-in via `@custom-variant dark`, since nothing in this
app ever adds a `.dark` class), and caught/fixed two live-Railway data
incidents caused by leftover test-script code (a hardcoded revert
touching the wrong form's title; a stray `Publish`/`Unpublish` selector
match) — both confirmed fixed and the real seeded data restored via
direct API checks before moving on.

Deferred, tracked (not dropped): a few leftover `zinc-*` colors in
sub-components, and further empty-state polish — both left for a final
polish pass.

## Phase 3 — respondent flow

Full-screen `/f/[slug]` experience: one question at a time, all 8
types, direction-aware slide+fade transitions, a progress bar,
persistent nav chevrons, welcome and thank-you screens. No backend
changes needed — the existing `PublicFormOut`/`PublicSubmitIn`/
`PublicSubmitOut` schemas already had exactly the shape this needed.

- **Keyboard nav**: Enter/arrows to move; letter shortcuts on
  `multiple_choice` only (the dropdown's letters go into its own search
  box instead); long_text's plain-Enter-inserts-newline vs.
  Ctrl+Enter-advances split; the dropdown combobox captures its own
  arrow keys to move its highlighted suggestion instead of hijacking
  flow navigation.
- **Validation**: `lib/respondentValidation.ts` is a direct mirror of
  `backend/validation.py`'s exact message copy (including the dynamic
  min/max/scale messages) — instant client-side feedback only, never
  the source of truth.
- **422 handling as a real safety net, not decoration**: the backend's
  `{errors: {question_id: message}}` response (e.g. an option was
  deleted mid-session) is parsed and the flow jumps to the *earliest*
  flagged question in form order, showing the server's actual message.
- Loading/error states for a bad slug ("Form not found"), an
  unpublished form's stale slug ("This form is no longer accepting
  responses"), and a zero-question form — never a blank screen.

**Two real bugs found and fixed during verification:**
1. The document-level keydown handler originally read
   `state.answers`/`state.currentIndex` via closures, so `goNext`/
   `goBack` got a new identity on nearly every keystroke, forcing the
   listener to tear down and re-attach constantly. A keypress landing
   in that gap was dropped — caught live by a letter-shortcut
   immediately followed by an arrow key occasionally doing nothing.
   Fixed by reading a `stateRef` instead, so `goNext`/`goBack`/
   `setAnswer` are stable and the listener registers exactly once per
   mount.
2. long_text's plain-Enter-inserts-newline behavior was implemented via
   the textarea's own `onKeyDown` calling `stopPropagation()`, assuming
   that would stop the same document-level listener from also seeing
   the event. It doesn't — a native `document.addEventListener`
   listener isn't reliably shielded by a React synthetic event's
   `stopPropagation()`. The carve-out now lives in the global handler
   itself (checks `document.activeElement` directly).

Verified locally end to end against a throwaway scratch form covering
all 8 types: every validation message matched `validation.py`'s exact
copy, back/forward navigation restored previously entered answers, the
dropdown combobox filtered and captured its own arrows, the 422
fallback correctly targeted the flagged question with the real server
message, and the submitted response's answers persisted correctly
across every type. Mobile pass at 375px: no horizontal overflow on any
screen, 44px+ tap targets, keyboard hint hidden, nav chevrons still
present (not stripped, per the brief). Both error states confirmed.
Then repeated live against the deployed Vercel + Railway stack
(commit `6f58915`) on the real seeded Event RSVP form — response count
incremented correctly (5 → 6), matching a manual test run
independently by the project owner.

Scratch/test forms created during verification (both locally and on
the live Railway database) were deleted afterward via direct API
calls, confirmed via `curl` before and after each cleanup so the real
seeded forms' response counts were never touched.

## Known gaps / deferred items

- A few leftover `zinc-*` colors in sub-components and further
  empty-state polish (Phase 2, tracked not dropped).
- `NOTES.md` is referenced by one commit message but was never actually
  created — the content it would have held (slug immutability
  rationale) lives in code comments and in this file instead.
- Welcome-screen *editor* (Settings) is still deferred per the brief's
  own scope-control note — only the welcome-screen *preview* exists in
  the builder, and the real interactive `WelcomeScreen` in the
  respondent flow reads directly from `form.welcome_title`/
  `welcome_description` (empty until a real editor exists to set them).
- Results/responses dashboard (Phase 4) not started. The backend
  endpoints (`GET /api/forms/{id}/responses`, `GET /api/forms/{id}/summary`)
  already exist from Phase 1 and are unused by the frontend so far.

## What's next

Phase 4 — results dashboard (per-question summary stats, individual
response detail view) — same plan-then-approve checkpoint as Phases 2
and 3 before implementation starts.
