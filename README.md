# Typeform Clone

A functional Typeform clone: a drag-and-drop form builder, a full-screen
animated one-question-at-a-time respondent flow, and a results
dashboard with summary stats. Frontend is Next.js (App Router,
TypeScript, Tailwind v4); backend is FastAPI + SQLAlchemy 2.0 + SQLite.
Deployed at `https://type-one-tau.vercel.app` (frontend, Vercel) against
`https://type-production-7a20.up.railway.app` (backend, Railway,
SQLite on a persistent volume).

## Tech Stack

- **Frontend**: Next.js 16 (App Router, TypeScript), Tailwind v4, dnd-kit
  (drag-and-drop), motion (animations)
- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic
- **Database**: SQLite (file-based; a persistent volume in production)
- **Deployment**: Vercel (frontend), Railway (backend)

## Setup

**Requirements:** Node 20+, Python 3.11+.

```bash
git clone https://github.com/ShiBui2003/Type.git
cd Type
```

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env         # ALLOWED_ORIGINS=http://localhost:3000, DB_PATH=./app.db
uvicorn main:app --reload --port 8000
```

**Frontend** (separate terminal):

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`. No manual seeding step: the backend's
FastAPI `lifespan` handler runs `create_all` and an idempotent
`seed_if_empty()` on every startup, so the first request to a fresh
`app.db` self-seeds two published forms — **Customer Feedback Survey**
and **Event RSVP** — each with real responses already attached. The
dashboard should never show an empty state on a clean checkout; if it
does, the backend isn't reachable (check `NEXT_PUBLIC_API_URL` matches
where uvicorn is actually listening).

## Architecture

Client-fetch-only throughout — no server components hit the database,
no API routes live on the Next.js side. The frontend is a plain
client-rendered app that talks to FastAPI over `NEXT_PUBLIC_API_URL`;
the backend's CORS allow-list comes from `ALLOWED_ORIGINS`. Neither
side hardcodes the other's URL, so the same code runs unchanged against
localhost in dev and the real Vercel/Railway domains in production.

Frontend state lives in two React Context providers, both following the
same reducer + debounced-save shape:

- **`FormBuilderContext`** — the builder's form/question state, a
  per-key debounced autosave queue (800ms, coalesces multiple field
  edits into one PATCH), and a reorder concurrency guard (at most one
  reorder request in flight at a time).
- **`RespondentFlowContext`** — the respondent flow's answers/errors/
  navigation state, a submission guard (at most one submit request
  ever in flight), and a `stateRef` pattern so the document-level
  keyboard handler's `goNext`/`goBack` callbacks never change identity
  between renders — closing over state directly here caused a real,
  observed race where a keypress could land in the gap while the
  listener was tearing down and re-attaching.

The backend is one FastAPI app split into two routers: `forms.py`
(everything creator-facing — CRUD, publish/unpublish, reorder,
responses/summary) and `public.py` (the two respondent-facing
endpoints only — fetch a published form by slug, submit a response).
Both routers call into one shared `validation.py` module for per-type
answer validation, so the persistence logic and the client-facing error
copy can't drift apart from each other.

## Database schema

Six tables: `users`, `forms`, `questions`, `question_options`,
`responses`, `answers`.

- **`questions.position` is a float, not an integer index.** Drag-reorder
  writes exactly one row — the moved question's position, recomputed as
  the midpoint between its new neighbors — instead of renumbering every
  sibling question on every drag.
- **`questions.deleted_at` is a soft delete, not a hard one.** A
  published form's questions can already have answers attached by the
  time an editor removes one; hard-deleting the row would either orphan
  those answers or cascade-delete them, silently destroying response
  history. The builder only ever queries `deleted_at IS NULL`, but
  summary/export can still join back to a removed question's historical
  answers.
- **`answers` keeps typed columns (`value_text` / `value_number` /
  `value_option_id`) plus a `value_json` fallback.** The typed columns
  exist so SQL can `AVG()` / `GROUP BY` directly for the results view.
  `value_json` is the fallback of record: if an option is later deleted
  from the builder, `value_option_id` gets nulled out (its foreign key
  no longer resolves), but `value_json` still shows exactly what was
  chosen at submission time — the historical answer isn't lost just
  because the option that produced it no longer exists.
- **`forms.slug` is random, nullable, and assigned once on first
  publish, then permanent.** It isn't derived from the title and there's
  no rename/edit path — this is why the share-link modal has no "edit
  slug" control: adding one would imply a feature that doesn't exist.
- **`questions.settings_json` / `forms.theme_json` are free-form JSON**,
  not dedicated columns. Eight very different question types each need
  different config (rating scale, number min/max, multiple_choice's
  yes/no variant); fixed columns for all of it would produce a table
  that's mostly nulls.

## API overview

| Endpoint | Description |
|---|---|
| `GET /api/forms` | List the creator's forms with status + response count |
| `POST /api/forms` | Create a form |
| `GET /api/forms/{id}` | Full form + its questions |
| `PATCH /api/forms/{id}` | Update title / welcome / thank-you / theme |
| `DELETE /api/forms/{id}` | Delete a form |
| `POST /api/forms/{id}/duplicate` | Duplicate a form (and its questions) |
| `POST /api/forms/{id}/publish` | Publish; assigns a slug the first time only |
| `POST /api/forms/{id}/unpublish` | Unpublish (slug persists, reused if republished) |
| `POST /api/forms/{id}/questions` | Create a question (+ options) |
| `PATCH /api/forms/{id}/questions/reorder` | Reorder: `{question_id, after_id, before_id}` |
| `GET /api/forms/{id}/responses` | List responses submitted to a form |
| `GET /api/forms/{id}/summary` | Aggregate per-question stats |
| `PATCH /api/questions/{id}` | Update a question (+ sync its options) |
| `DELETE /api/questions/{id}` | Soft-delete a question |
| `GET /api/responses/{id}` | Single response, full detail |
| `GET /api/public/forms/{slug}` | Respondent-safe shape of a published form |
| `POST /api/public/forms/{slug}/responses` | Submit a response; `422` with `{errors: {question_id: message}}` on validation failure |

## Assumptions & scope

- **Yes/No is a `multiple_choice` variant, not a 9th question type.**
  Toggling "Yes/No question" in the builder sets
  `settings_json.variant = "yes_no"` on a regular `multiple_choice`
  question and locks its options to exactly Yes/No — same schema,
  same respondent-flow component, one less type to special-case
  end-to-end.
- **The welcome screen is edited in place on the preview canvas**, not
  in the right-hand panel — clicking the heading in the preview puts a
  cursor there and you type the real title, matching how the actual
  Typeform builder works. It's implemented with transparent inputs
  styled to inherit the canvas theme rather than `contentEditable`,
  which fights React over caret position when the node re-renders from
  state. Edits use the same `patchForm` + 800ms debounced autosave as
  every other field, so there's one save path. An empty `welcome_title`
  still falls back to the form title at respondent time, which is what
  the placeholder shows.
- **Free-text answers are sampled, not aggregated.** The per-question
  summary shows option counts for choice questions and average +
  distribution for number/rating, but short/long text, email, and date
  answers surface the 5 most recent as "Latest answers" — there's no
  meaningful aggregate for free text, so the results view doesn't
  pretend there is one.
- **The summary includes removed questions on purpose.** Soft-deleted
  questions keep their historical answers (see the schema notes above),
  so the Results view still shows their stats and answers, badged
  "Removed question" rather than silently dropped.

For the full phase-by-phase build history, the two real bugs found and
fixed in each phase, and the visual design system — see `HANDOFF.md`.
Raw Typeform recon notes are in `docs/typeform-design-spec.md`.
