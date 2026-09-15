# Build spec — personal portfolio + private build journal

You are building this project from scratch. Read this entire document before writing code.

---

## 1. Context

A personal portfolio and engineering build-journal site for a single owner. Two halves:

- **Public** — anyone can read: projects, published journal entries, about page.
- **Admin** — password-locked, owner only: write/edit journal entries, upload and caption
  photos, manage projects.

Purpose: a long-term archive of documented engineering work, used for university
applications. The defining requirement is that **every uploaded photo carries a caption** —
undocumented photos are worthless for the site's purpose.

Scale: one writer, low traffic. Do not build for scale that does not exist.

---

## 2. Hard rules — violating any of these fails the build

1. **Do NOT seed any content.** No example projects, no sample journal entries, no
   placeholder "Lorem ipsum" posts, no demo images. The database starts empty. The owner
   writes all content themselves. Empty states in the UI must render gracefully (a short
   "nothing here yet" message), not crash or show fake data.
2. **Do NOT put secrets in the repo.** No passwords, no hashes, no connection strings in
   any tracked file. `.env.local` must be in `.gitignore` and must never be committed.
3. **Do NOT hardcode a password anywhere.** Authentication compares against a bcrypt hash
   read from an environment variable at runtime. See §6.
4. **Do NOT let unpublished entries reach the public.** Every public-facing query must
   filter `published = true`. This includes list pages, detail pages, project pages, RSS,
   sitemaps, and any API route.
5. **Do not skip the verification loop in §8.** "It should work" is not verification.

---

## 3. Stack

Use exactly these. Do not substitute without stating why.

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable), App Router, TypeScript, Server Actions |
| Styling | Tailwind CSS |
| Database | Postgres (Neon) |
| ORM / migrations | Drizzle + drizzle-kit |
| Password hashing | `bcryptjs` |
| Session token | `jose` (signed JWT in an httpOnly cookie) |
| Image storage | `@vercel/blob` |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| Hosting | Vercel |

No component library. Plain Tailwind. No state management library. No separate API layer —
use Server Actions.

---

## 4. Data model

Define in `src/db/schema.ts` using Drizzle. Generate SQL migrations with drizzle-kit;
do not hand-write migration files or push schema changes without a migration.

```
projects
  id            serial primary key
  slug          text unique not null          -- URL-safe, generated from title, editable
  title         text not null
  summary       text not null                 -- 1-3 sentences, shown on cards
  banner_url    text                          -- nullable
  status        text not null                 -- 'active' | 'complete' | 'shelved'
  started_at    date
  tech          text[]                        -- e.g. ['Fusion 360','C++','3D printing']
  repo_url      text                          -- nullable
  sort_order    integer not null default 0
  published     boolean not null default false
  created_at    timestamptz not null default now()
  updated_at    timestamptz not null default now()

journal_entries
  id            serial primary key
  slug          text unique not null
  project_id    integer references projects(id) on delete set null   -- NULLABLE
  title         text not null
  body_md       text not null                 -- Markdown source
  entry_date    date not null                 -- the day the work happened, owner-editable,
                                              --   NOT the created_at timestamp
  published     boolean not null default false
  created_at    timestamptz not null default now()
  updated_at    timestamptz not null default now()

entry_images
  id            serial primary key
  entry_id      integer not null references journal_entries(id) on delete cascade
  url           text not null
  caption       text not null                 -- NOT NULL. Enforced in DB and in the form.
  sort_order    integer not null default 0
  created_at    timestamptz not null default now()
```

Notes:

- `project_id` nullable is deliberate: journal entries may be standalone, not tied to a
  project.
- `entry_date` separate from `created_at` is deliberate: the owner often writes up work
  days after doing it, and the archive must be ordered by when work happened.
- `caption` is `NOT NULL` at the database level *and* required in the upload form. This is
  the most important constraint in the schema. Do not relax it.
- Index `journal_entries(published, entry_date desc)` and `journal_entries(project_id)`.

---

## 5. Routes

**Public**

```
/                        home — short intro, a few recent entries, link to projects
/projects                grid of published projects
/projects/[slug]         project detail + its published journal entries, newest first
/journal                 all published entries, newest first by entry_date,
                           filterable by project via ?project=slug
/journal/[slug]          single entry: rendered Markdown + its captioned images
/about                   static page, owner fills in content later
```

**Admin — all under `/admin`, all behind auth**

```
/admin/login             password form (the ONLY unauthenticated /admin route)
/admin                   dashboard: drafts first, then recent entries; "New entry" button
/admin/entries/new
/admin/entries/[id]      edit body, metadata, publish toggle; upload + caption + reorder
                           + delete images
/admin/projects          list + create
/admin/projects/[id]     edit
/admin/export            see §7
```

---

## 6. Authentication

Single user. No registration, no password reset, no email.

**Setting the password.** Build `scripts/hash-password.mjs`: a Node script that prompts for
a password on stdin (do not accept it as a command-line argument — that leaks into shell
history), hashes it with bcrypt at cost factor 12, and prints only the hash. The owner runs
it once, then pastes the hash into `.env.local` as `ADMIN_PASSWORD_HASH` and into Vercel's
environment variables. Document this in the README.

**Login.** `/admin/login` posts to a Server Action that:
- compares the submitted password against `ADMIN_PASSWORD_HASH` with `bcrypt.compare`
- on success, signs a JWT with `jose` using `AUTH_SECRET`, 30-day expiry, and sets it as a
  cookie: `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, `path: '/'`
- on failure, waits ~1 second before responding, and returns a generic error. Do not
  distinguish "wrong password" from any other failure in the response.
- rate-limits: after 5 failures from the same IP within 15 minutes, reject for 15 minutes.
  An in-memory map is acceptable for this scale; note the limitation in a comment.

**Enforcement.** `middleware.ts` matching `/admin/:path*`, excluding `/admin/login`.
Verify the JWT signature and expiry. On failure, redirect to `/admin/login`.

**Critical:** middleware alone is not sufficient. Every Server Action that mutates data
must independently verify the session before doing anything. Middleware protects page
navigation; it does not protect a Server Action invoked directly. Write a single
`requireAuth()` helper and call it as the first line of every mutating action.

**Logout.** A Server Action that clears the cookie.

Environment variables required:

```
DATABASE_URL
ADMIN_PASSWORD_HASH
AUTH_SECRET              # 32+ random bytes, base64
BLOB_READ_WRITE_TOKEN
```

Provide `.env.example` with these keys and empty values. Commit that; never `.env.local`.

---

## 7. The export page

`/admin/export` renders every `entry_images` row across the whole database as a contact
sheet: thumbnail, caption, entry title, entry date, project name. Filterable by project and
by date range. Each has a checkbox; selected items can be downloaded as a zip, and their
captions copied as a text manifest.

Rationale, so you build it correctly: the owner will eventually submit a portfolio capped
at 25 attachments, selected from hundreds of photos accumulated over two years. This page
exists to make that selection tractable. Optimise it for scanning a large number of images
quickly — dense grid, lazy-loaded thumbnails, captions always visible, not on hover.

---

## 8. Build phases and the verification loop

Build in this order. **Do not start a phase until the previous one has passed review.**

| Phase | Deliverable |
|---|---|
| 0 | Next.js + TypeScript + Tailwind scaffold. Repo initialised, `.gitignore` correct, README started. |
| 1 | Neon connection, Drizzle schema, migrations generated and applied, DB client helper. |
| 2 | Login, session cookie, middleware, `requireAuth()`, logout. |
| 3 | Admin: create / edit / delete journal entries, Markdown body, publish toggle. |
| 4 | Public `/journal` and `/journal/[slug]`, Markdown rendering. |
| 5 | Image upload to Blob, required captions, reorder, delete. Images render on public entry pages. |
| 6 | Projects CRUD, public `/projects` and `/projects/[slug]`, entry↔project association. |
| 7 | Home, `/about`, nav, footer, responsive layout, dark mode. |
| 8 | `/admin/export`. |
| 9 | Accessibility pass, SEO metadata, `robots.txt`, sitemap (published content only), error and empty states, README with setup and deploy instructions. |

### The loop — run this at the end of every phase

```
iteration = 0
repeat:
  1. npx tsc --noEmit          -> must exit 0
  2. npm run lint              -> must exit 0
  3. npm run build             -> must exit 0
  4. Start the dev server. Exercise every acceptance criterion for this phase
     (§9) with real requests — curl, or Playwright for anything involving a
     browser session. Record actual observed output, not expected output.
  5. If all criteria pass -> break
  6. Otherwise: fix the specific failures, iteration += 1
  7. If iteration >= 5: stop and report what is failing and what you have tried.
     Do not continue to the next phase.
```

### Phase review agent

After the loop passes, spawn a **subagent** as an independent reviewer for that phase. Give
it: this spec, the phase's acceptance criteria, and the diff for the phase. Do not give it
your own summary of what you did — let it read the code.

It returns:

```
{ "verdict": "PASS" | "FAIL",
  "blocking":    [ { file, line, problem, why_it_matters } ],
  "nonblocking": [ ... ] }
```

On `FAIL`, fix every blocking item and re-run the loop, then re-review. Only advance on
`PASS`. Note non-blocking items in a running `REVIEW_NOTES.md`.

The reviewer's instruction is to be adversarial: assume the implementer took shortcuts and
go looking for them. Specifically instruct it to try to break auth and to look for
unpublished content leaking to public routes.

### Master review — after phase 9

Spawn a final reviewer with a fresh read of the whole repository. Its checklist:

**Security**
- Every `/admin` route is unreachable without a valid session. Test each one directly.
- Every mutating Server Action independently calls `requireAuth()`. Invoke at least one
  directly without a session cookie and confirm it refuses.
- No secret, password, or hash appears in any tracked file. `git log -p | grep` for them —
  check history, not just the working tree.
- `.env.local` is gitignored and was never committed.
- Session cookie has `httpOnly`, `secure` (in prod), `sameSite`.
- Image upload requires auth and rejects non-image content types.

**Correctness**
- No unpublished project or entry is reachable via any public route, including direct
  `/journal/[slug]` access to a known draft slug. Test this explicitly.
- Schema matches §4 exactly, including `entry_images.caption NOT NULL`.
- Deleting an entry cascades to its images; deleting a project sets entries' `project_id`
  to null rather than deleting them.
- Public ordering is by `entry_date`, not `created_at`.

**Compliance with §2**
- Database contains zero rows. No seed script, no fixture file, no hardcoded sample content
  anywhere in the codebase.

**Regression**
- Re-run every acceptance criterion from every phase, not just the last one. Later phases
  frequently break earlier ones.

**Build**
- `tsc --noEmit`, lint, and `npm run build` all clean.

Output a written report. Fix all blocking findings, then re-run the master review from
scratch. Repeat until clean or until you have clearly stated what you cannot resolve.

---

## 9. Acceptance criteria

Each must be verified by observation, not assumption.

**Phase 1** — `drizzle-kit` generates migrations; applying them to a fresh database creates
all three tables with correct types and constraints; inserting a row into `entry_images`
with a null caption is rejected by the database.

**Phase 2** — `GET /admin` without a cookie redirects to `/admin/login`. Correct password
sets a cookie and reaches `/admin`. Wrong password fails, takes ≥1s, and reveals nothing.
A tampered JWT is rejected. 6 rapid wrong attempts trigger the rate limit. Logout clears
the cookie and `/admin` becomes unreachable again.

**Phase 3** — Create an entry, confirm it in the database. Edit it, confirm the change and
that `updated_at` moved. Toggle publish both ways. Delete it, confirm removal. A Server
Action called without a session cookie refuses.

**Phase 4** — A published entry appears at `/journal` and renders at its slug. A draft
appears at neither, and direct navigation to the draft's slug returns 404 — not the
content, and not a redirect that leaks its existence. Markdown renders (headings, lists,
code, links). `/journal` with zero published entries renders an empty state without error.

**Phase 5** — Upload succeeds and returns a Blob URL stored in the database. Submitting the
upload form with an empty caption is rejected client-side and server-side. Images appear on
the public entry page in `sort_order`. Reordering persists. Deleting an image removes the
row. Deleting an entry cascades.

**Phase 6** — Project CRUD works end to end. An entry can be attached to and detached from
a project. `/projects/[slug]` shows only that project's published entries. Unpublished
projects 404 publicly. Deleting a project leaves its entries intact with null `project_id`.

**Phase 7** — All pages render at 375px, 768px and 1440px with no horizontal scroll. Dark
mode follows system preference. Nav works from every page.

**Phase 8** — Export lists every image in the database with caption, entry title, entry
date and project. Filters work. Selection and zip download work. Renders acceptably with
200+ images (generate throwaway rows to test this, then delete them — the database must be
empty at handover).

**Phase 9** — Lighthouse accessibility ≥ 95 on public pages. Every image has alt text
(use the caption). Sitemap contains only published content. `/admin` is disallowed in
`robots.txt`. A README exists that a beginner can follow from clone to deployed.

---

## 10. Handover

When the master review is clean, produce `HANDOVER.md` containing:

- What each directory and key file is for, in plain language. The owner is a beginner; write
  it for someone who has not built a web app before.
- How to run it locally.
- How to set the admin password (the `scripts/hash-password.mjs` flow).
- How to deploy to Vercel and which environment variables to set there.
- How to add a new field to a table and generate the migration.
- The non-blocking review findings from `REVIEW_NOTES.md`, as a list of known rough edges.

Do not write content into the site. The database is handed over empty.

---

## 11. Repository hygiene — `main` must always be deployable

Vercel deploys `main` to production automatically. A broken commit on `main` is a broken
public website. Set this up in phase 0, before there is anything to break.

### Branching

- `main` is protected and always deployable. No direct commits, including by the owner.
- All work happens on branches: `feat/...`, `fix/...`, `chore/...`.
- Merge via pull request, **squash merge only**. One readable commit per change on `main`.
- Delete branches after merge.

Configure in GitHub → Settings → Branches → add a rule for `main`:
require a pull request before merging; require status checks to pass; require branches to
be up to date; allow squash merging only (disable merge commits and rebase merging in
Settings → General).

### CI

Create `.github/workflows/ci.yml` running on every pull request targeting `main` and on
pushes to `main`:

```
- checkout
- setup-node (LTS, with npm cache enabled)
- npm ci
- npx tsc --noEmit
- npm run lint
- npm run build
```

Use `npm ci`, not `npm install` — it installs exactly the lockfile and fails if
`package.json` and `package-lock.json` disagree, which is the point of a CI check.

The build step needs environment variables to be present but does not need real ones.
Supply dummy values as GitHub Actions secrets or inline env, and make sure the app does not
attempt a database connection at build time. If it does, fix that — build-time database
access will also break Vercel deploys.

Make this workflow a required status check in the branch protection rule.

### Commit messages

Conventional Commits, subject line under 72 characters:

```
feat: add caption requirement to image upload
fix: filter unpublished entries from project pages
chore: bump drizzle-kit
docs: explain password hashing in README
```

The squashed commit's message is what lands on `main`, so it should describe the change as
a whole, not the last fix in the branch.

### Repository size

Git history is permanent. A large file committed once and deleted next commit stays in the
repository forever and is paid for by every clone.

`.gitignore` must cover at minimum:

```
node_modules/
.next/
out/
.env
.env.local
.env*.local
.vercel
*.log
.DS_Store
/coverage
```

Rules:

- No images, video, or audio in the repository. All uploaded media goes to Vercel Blob.
  The only permitted binary assets are a favicon, an OG image, and the owner's CV PDF.
- No build output, no dependencies, no database dumps, no `.env` files of any kind.
- If a file over 5 MB is ever staged, stop and reconsider rather than committing it.

Verification: after phase 9, run `git count-objects -vH` and report the repository size.
If `size-pack` exceeds ~20 MB, investigate what is in the history — something has been
committed that should not have been.

### Acceptance criteria for §11

- A direct push to `main` is rejected by branch protection.
- A pull request with a TypeScript error fails CI and cannot be merged.
- A pull request that passes CI can be squash-merged, producing exactly one new commit
  on `main`.
- `git log --oneline main` reads as a clean, linear sequence of meaningful changes.
- `git count-objects -vH` reports a `size-pack` under 20 MB.
- `git log --all -p | grep -iE "(ADMIN_PASSWORD_HASH|AUTH_SECRET|postgres://|\$2[aby]\$)"`
  returns nothing.
