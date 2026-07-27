# HANDOFF

Full project history for this Typeform clone, phase by phase. This file
is meant to stand alone — read it and you should have the full picture
without needing to dig through commit history or chat logs.

## What this is

A functional Typeform clone: a drag-and-drop form builder, a full-screen
animated one-question-at-a-time respondent flow, and a results dashboard
with per-question summary stats and individual response detail.

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
GET    /api/forms/{id}/responses           list responses (Results table)
GET    /api/responses/{id}                 single response detail (Results modal)
GET    /api/forms/{id}/summary             aggregate stats (Results summary)

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
  flow navigation. *(That last claim was written here in Phase 3 but did
  not actually hold until the fourth bug below was fixed — the intent
  was implemented in the wrong place. It is true now, and verified by a
  test that asserts the highlight index moves rather than only that the
  flow didn't advance.)*
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

## Phase 4 — results dashboard

A "Results" tab in the builder nav (Build / Results / Settings) at
`/forms/{id}/results`, living under the existing `/forms/[id]` layout so
it gets `FormBuilderContext` (and the live question order) for free.
No backend changes — all three Phase 1 endpoints were confirmed against
their actual code before building, and their shapes matched exactly.

- **Summary sub-tab** (default): a counter strip in the spec's measured
  Insights style (response count + latest-response time only — real
  Typeform also shows Views/Starts/Completion rate there, all of which
  need partial-response tracking that's explicitly out of scope, so no
  fabricated counters), then one card per question. Which body a card
  renders is driven by which branch the backend populated: option bars
  with count + percentage (choice types, incl. the Yes/No variant),
  average + value distribution (number/rating), or the 5 latest answers
  (text/email/date — free text isn't aggregated by design).
- **Responses sub-tab**: table of submissions (numbered oldest-first so
  a response keeps its number as new ones arrive), submitted time,
  answer count. Row click or an explicit View button (the focusable
  control for keyboard users) opens a detail modal that fetches
  `GET /api/responses/{id}` and walks the *live* form's questions in
  position order — answers arrive in insertion order from the backend —
  showing "—" for unanswered ones; answers to soft-deleted questions
  are appended with a "Removed question" badge, and a choice answer
  whose option was later deleted renders "(option removed)" (the
  value_json fallback carries only the dead option id, which shouldn't
  leak to the UI).
- **Empty state**: the spec's measured "No responses" layout (21px/400
  heading). The real Typeform pairs it with a "Generate test response"
  button — deliberately omitted (it fabricates data); "Share your form"
  opens the existing ShareLinkModal on published forms, and drafts get
  publish-first copy with no dead button.
- The response-table row structure and detail-modal layout are **our own
  design** on the established token system — the spec explicitly GAPs
  both (the recon form had zero responses).
- `lib/answerDisplay.ts` is the one place that renders the polymorphic
  answer `value`, mirroring `_answer_value()` in `routers/forms.py`.
  It also parses backend timestamps as UTC: they're naive-UTC
  (`datetime.utcnow`) serialized *without* a timezone suffix, and
  feeding those to `new Date()` bare would silently shift every
  displayed time by the viewer's UTC offset — caught while writing the
  formatter, verified fixed (11:10 UTC seeds render 16:40 IST).

Verified locally (23 automated Playwright checks against the real
seeded forms plus a throwaway scratch form, deleted afterward with the
form list confirmed restored): all four summary body types, partial
answer counts ("3 of 5 answered" on the optional long_text), detail
modal listing every question in form order, Escape-to-close, both empty
states, a fresh public submission appearing with correct percentages,
the deleted-option and deleted-question paths end to end, and no
horizontal overflow at 375px. No app-code bugs surfaced during
verification this phase; the two failures hit along the way were both
test-harness races (a modal-content wait matching the table's
"Submitted" column header behind the modal; screenshots firing inside
the 175ms modal fade) — fixed in the scripts, not the app.

## Post-Phase-4 fix — a third real bug, in Phase 2 code

Found during a final verification pass against the assignment brief
itself (not a Phase 4 test) — flagged before touching anything, fixed
only after explicit approval, per the standing rule against changing
Phase 0-3 code without asking first.

`FormBuilderContext.tsx`'s `addQuestion`/`deleteQuestion` (Phase 2 code,
unchanged since) each built their next `questions` array from
`state.form.questions` captured in the callback's closure, then awaited
the create/delete API call before dispatching that precomputed array
via `set_questions`. Two adds (or two deletes) close enough together —
well within reach of a normal double-click, no unusual timing needed —
meant the second callback's closure still held the *pre-first-call*
array; dispatching it silently overwrote the first question out of
local UI state. The server always had it correctly (a reload "fixed"
it), which is exactly why this survived Phase 2's original verification
undetected.

Fixed by moving the array-building into the reducer instead of the
callback: two new actions, `append_question` and `remove_question`,
compute the next array from the reducer's *own* current state at
dispatch time, never from a value closed over before the `await`.
`addQuestion`/`deleteQuestion` now only call the API and dispatch one
action carrying the minimal payload (the new question, or the deleted
id) — no array construction outside the reducer. Same root-cause family
as the Phase 3 `stateRef` fix (stale-closured state racing a network
round trip), on the dispatch side this time instead of the
event-listener side.

Verified by reproducing the exact failure on purpose: two "Add
question" clicks fired with no wait between them (so the second POST
starts before the first's response can land), repeated for a second
pair (4 questions total), then two rapid-fire deletes back to back —
10/10 automated checks confirmed every question survived in both the
rendered DOM and a fresh `GET /api/forms/{id}`, run against a scratch
form (deleted afterward, local form list confirmed restored). Redeployed
(commit `d3b2d2a`) and re-confirmed live: both seeded forms' response
counts unchanged (Customer Feedback Survey 5, Event RSVP 6) via direct
API check and in the rendered dashboard, and the builder opens cleanly
against the deployed bundle.

## Fourth real bug — the Phase 3 fix that was never applied to its sibling

Found during the final pre-submission re-verification, not by a report.
This is the most interesting one to be able to explain, because it isn't
a novel bug: it's the *same* bug as Phase 3 #2, in a component that was
never updated when that fix landed.

**Symptom.** Arrow keys inside the dropdown's search box advanced the
whole flow instead of moving the dropdown's highlighted suggestion — so
you could not arrow through dropdown options at all; pressing Down
skipped to the next question. Confirmed on both local and the live
deployment before fixing.

**Root cause — two halves that only bite together.**
1. `ChoiceInput` tried to shield itself by calling `e.stopPropagation()`
   inside a React **synthetic** `onKeyDown`. The flow's navigation
   handler is a native `document.addEventListener`, and a synthetic
   `stopPropagation()` does not stop it. This is verbatim the Phase 3 #2
   failure: `long_text` had made exactly this assumption, it was proven
   wrong, and the carve-out was moved into the global handler — but only
   for the textarea. The dropdown was left relying on the technique that
   had already been disproven three lines away in the same file's sibling.
2. The global handler's guard *actively excluded* the dropdown:
   `isPlainTextInput()` returned `false` when
   `data-respondent-dropdown-search === "true"`, so the early
   `if (inTextInput) return;` never fired and the handler fell through to
   `goNext()`. Both handlers ran on every arrow press.

**Fix.** An explicit dropdown carve-out in the global handler in
`RespondentFlow.tsx`, the same shape as the textarea one directly above
it: if the active element is the dropdown search box and the key is an
arrow, return and let the combobox own it. Enter deliberately still falls
through, so one keystroke both picks the highlighted option and advances.
`isPlainTextInput()` was simplified back to "textarea or input" now that
the dropdown no longer needs to be special-cased there — the attribute is
read in exactly one place instead of two that disagreed.

**Verification.** A test that asserts the *positive* behaviour rather
than only the absence of the old one: the highlight index moves 0→1→2 on
ArrowDown and back on ArrowUp, the flow stays on the same question,
Left/Right stay in the search text, and Enter picks the **highlighted**
option (asserted as "Green", not the first option) and then advances.
Then the full 21-check keyboard suite across all 8 question types, since
this touches the shared global handler — confirming no regression to
`multiple_choice` letter shortcuts or `long_text`'s Ctrl+Enter carve-out,
both of which live in that same handler.

**Takeaway.** When a bug is caused by a *pattern* (here: trusting
synthetic `stopPropagation()` against a native listener), fixing the one
reported instance isn't finishing the job — every sibling using the same
pattern needs the same treatment. The Phase 3 write-up documented the
lesson correctly and still only applied it to the component where it had
been observed.

## Known gaps / deferred items

- ~~Leftover `zinc-*` colors in sub-components~~ — **closed.** All 31
  remaining occurrences were replaced with design tokens. Tailwind's
  `zinc` ramp is a cool blue-tinted grey while the measured tokens are
  warm plum, so zinc text read visibly blue next to ink text. The
  live-preview canvas was fixed differently on purpose — it's
  respondent-facing and themed, so its borders became
  `currentColor`-relative rather than ink tokens; the hardcoded light
  zinc borders there were a real bug on the Midnight preset, not just a
  tint mismatch.
- `NOTES.md` is referenced by one commit message but was never actually
  created — the content it would have held (slug immutability
  rationale) lives in code comments and in this file instead.
- ~~Welcome-screen editor deferred~~ — **closed.** The welcome screen is
  now edited inline on the preview canvas itself (click the heading, type
  in place), which is how the real builder works and avoids adding
  another side-panel field. Everything downstream already existed
  (`welcome_title`/`welcome_description` in the schema, the PATCH
  endpoint, and the respondent `WelcomeScreen`), so only the editor was
  missing.
- Three toolbar controls were inert placeholders and were all dealt with
  rather than left looking clickable. The device toggle and Settings icon
  were **wired up** for real. Preview was first **removed** — the brief's
  "live preview" is already met by the always-visible canvas — and then
  **re-added as a real control**: it opens `/f/{slug}` in a new tab, the
  actual respondent experience rather than a mock. The public API is
  slug-based and published-only so it can't open a draft; on a draft it
  renders disabled with a "Publish this form to preview it" tooltip
  instead of vanishing. A full-screen preview driven by unsaved builder
  state was scoped out deliberately — it would mean running
  `RespondentFlowContext` against a second data source, and that file has
  produced three of the four real bugs in this project.
- ~~CSV export~~ — **built** as a bonus feature, after the core work was
  done and verified. `GET /api/forms/{id}/responses/export` streams the
  CSV; the Results view and the dashboard card menu are two entry points
  onto one shared implementation. It reuses the Results detail view's
  rules for column order, soft-deleted questions and deleted options, so
  the export reads the same as the UI.
- Partial-response/completion-rate tracking: listed under the brief's
  "Bonus (Optional)" section — deliberately not built and not
  built-toward (the summary counter strip shows only counters backed by
  data we actually record). Dark mode was also skipped on purpose: it
  would reopen the colour-token system that caused the media-query
  `dark:` bug in Phase 2, which isn't a good trade for a non-required
  feature.
- Three UI-polish items found in the final recon pass, deferred not
  dropped: **character counters** on the title/description fields (real
  Typeform shows them), the **respondent nav chevrons sitting bottom-left**
  where the real flow puts them bottom-right, and the **welcome-screen
  placeholder rendering at 40% opacity**, which reads closer to
  "disabled" than to "click here to edit". None of the three tie to
  specific wording in the brief — it asks for inline editing and
  keyboard navigation, both of which work — and there was no time left
  before submission to justify spending the remaining budget on them
  over the items that do map to brief requirements. Each is a
  contained, well-understood change (roughly 10–20 minutes apiece) if
  they're ever picked up.
- Description text is editable in the right-hand panel but **not inline
  on the canvas**, unlike the question title and welcome screen. Left
  deliberately: description is hidden entirely when empty, so making it
  inline would mean always rendering a placeholder row that claims
  respondents will see something they won't. The brief only names
  description as a per-question *setting*, which is satisfied.

## What's next

All four core phases are built, deployed, and verified, and the final
UI/UX closeout pass is done: inline canvas editing for both the welcome
screen and question titles, toggle switches replacing checkboxes, the
full design-token sweep, a Draft status pill, a skeleton loading state
on the dashboard, and every toolbar control now doing something real.
What remains is the short
deferred-polish list above — none of it blocking, all of it tracked
with reasoning rather than silently dropped.
