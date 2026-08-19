# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wasans is a Next.js leaderboard/scoring app for a parkour-style game community ("trials"). Players submit
timed runs with video proof, moderators approve/deny them, personal bests and world records are tracked,
and scores/ranks are computed and mirrored to a companion Discord bot. It runs on Cloudflare Workers via
OpenNext, with Cloudflare D1 (SQLite) for storage and R2 for submission video/preview assets.

## Commands

- `npm run dev` — start the Next.js dev server (also boots the OpenNext Cloudflare dev shim).
- `npm run build` — production build (`next build --webpack`).
- `npm run lint` — ESLint (flat config, `eslint-config-next`).
- `npm test` — runs the Node test runner directly against `src/lib/server/__tests__/*.test.ts` (no Jest/Vitest). Uses `--import tsx` for TS support, so no separate build step is needed.
  - Run a single test file: `node --import tsx --test src/lib/server/__tests__/ux-rules.test.ts`
  - There is currently one test file covering multiple modules (scoring, moderation normalization, submission error mapping, username validation, ux-rules) — add new `*.test.ts` files under `src/lib/server/__tests__/` and they'll be picked up automatically.
- `npm run preview` — clean, build, then run `opennextjs-cloudflare preview` (runs the Worker build locally against Cloudflare bindings).
- `npm run deploy` / `npm run upload` — clean, build, then deploy/upload via `opennextjs-cloudflare` + Wrangler. These are real deploys — don't run without explicit user request.
- `npm run cf-typegen` — regenerates `cloudflare-env.d.ts` (`CloudflareEnv`) from `wrangler.jsonc` bindings. Re-run this after changing bindings in `wrangler.jsonc`.

There is no separate typecheck script; `next build` and editor/LSP diagnostics are the primary type-check path.

## Architecture

**Runtime**: Next.js App Router deployed as a Cloudflare Worker (via `@opennextjs/cloudflare`), not a Node
server. Route handlers get Cloudflare bindings through `getCloudflareContext({ async: true })` → `{ env, ctx }`.
`env.wasans` is the D1 database binding, `env.SUBMISSION_VIDEOS` is the R2 bucket for proof videos, and
`ctx.waitUntil(...)` is used extensively to run post-response work (Discord notifications, score/PB/WR
recalculation) without blocking the API response. Bindings are declared in [wrangler.jsonc](wrangler.jsonc)
and typed in `cloudflare-env.d.ts`.

**API surface**: All backend endpoints live under `src/app/v1/**/route.ts` (REST-ish, versioned `v1`, despite
not being under `src/app/api/`). Frontend pages live under `src/app/(main)/**` and call these routes via
fetch helpers built on `apiV1()` in [src/lib/api.ts](src/lib/api.ts). CORS for `/v1/*` is handled centrally
in [src/middleware.ts](src/middleware.ts) with a small allowlist of origins (`tully.sh`, `parkourreborn.com`,
localhost) — update that list, not individual routes, when adding a new allowed frontend origin.

**Layered backend code** (`src/lib/server/`):
- `repositories/*` — raw D1 queries only (no business logic), one per aggregate (`submission-repository`,
  `player-repository`, `leaderboard-repository`, `records-repository`).
- `services/*` — business logic composed from repositories: submission read/write, moderation
  (`moderation-service.ts`), auth, rate limiting, idempotency, audit logging, player scoring.
- Route handlers (`src/app/v1/**/route.ts`) stay thin: parse the request, call a service, map errors to
  HTTP responses via `src/lib/server/http.ts` (`jsonResponse`/`jsonError`) and `src/lib/submission-errors.ts`
  (maps error message strings to HTTP status codes — see `getSubmissionErrorStatus`).
- Pure decision logic that's easy to unit test (e.g. "should we notify the moderator", "should we
  create/update a Discord thread") is factored out into `src/lib/server/ux-rules.ts` rather than inlined in
  the service — follow this pattern when adding similar conditional side-effect logic.

**Auth**: Discord OAuth (`src/lib/server/discord-oauth.ts`, `src/app/v1/auth/discord/*`). Sessions are opaque
tokens in the `wasans_session` cookie, looked up against `auth_sessions` in D1 (`src/lib/server/auth.ts`).
`permission >= 1` on the `players` row means moderator (`canModerate()`). API routes needing auth call
`getAuthUser(request, db)` directly rather than going through a shared middleware.

**Bot API dual-auth**: Some moderation endpoints (e.g. PATCH submissions) can be called either by a logged-in
moderator's session cookie, or by the Discord bot using a shared secret (`botApiKey` env var) plus a Discord
user ID it resolves back to a player/moderator — see `resolveModeratorUser()` in
[src/lib/server/services/moderation-service.ts](src/lib/server/services/moderation-service.ts). When touching
moderation endpoints, preserve both auth paths.

**Scoring model**: `calculateScore(wr, time, trial)` in [src/lib/calc-score.ts](src/lib/calc-score.ts)
computes a 0–1 score from a run's time relative to that trial's world record and its bronze/platinum
thresholds (`src/lib/trials.ts`). A player's overall score is the average of their best per-trial scores
across all trials (`scoreFromPbs` in `moderation-service.ts`, and `src/lib/server/player-scores.ts` for bulk
recalculation). Rank names/Discord role IDs are derived from score bands in `roleRanks`
(`src/lib/server/notifications.ts`). Changing scoring math affects PBs, WRs, and Discord ranks together —
run `refreshPlayerPbs`/`refreshWorldRecords`/`refreshAllPlayerScores` (`src/lib/server/pbs.ts`,
`wrs.ts`, `player-scores.ts`) stay in sync when editing this path.

**Submission write flow** (`src/lib/server/services/submission-write-service.ts`): proof video can come from
a direct upload, a Medal.tv clip link (fetched server-side and re-hosted), or a plain link. Uploaded/fetched
video is stored in R2 under `scores/<uuid>.mp4` and served from a public CDN base URL. Submission creation
also fires an idempotency check (`idempotency-service.ts`, keyed by request hash) and a per-user rate limit
(`rate-limit-service.ts`) before writing — both backed by D1 tables (`api_idempotency_keys`,
`api_rate_limits`).

**Notifications**: `src/lib/server/notifications.ts` posts/updates Discord threads and DMs for pending runs,
approvals, and rank changes by calling out to the separate Discord bot's HTTP API — this repo doesn't host
the bot itself.

**Database**: `schema.sql` is the source of truth for the D1 schema (destructive `DROP TABLE IF EXISTS` +
`CREATE TABLE` — this is a reset script, not a migration). Core tables: `players`, `auth_sessions`,
`oauth_accounts`, `trials` (fixed list of 24 named trials, seeded via `INSERT OR IGNORE`), `submissions`,
`wrs` (current world record per trial), `pbs` (current personal best per player+trial), `audit_logs`,
plus `api_idempotency_keys`/`api_rate_limits` for the API layer above. `wrs`/`pbs` are derived/denormalized
tables kept in sync by the services layer (`wrs.ts`, `pbs.ts`) rather than computed on read.

**UI**: `src/components/ui/**` is shadcn/ui (Radix-based, `radix-nova` style, see [components.json](components.json))
— treat these as generated/vendored and prefer composing them over hand-editing, unless a real bug needs
fixing. App-specific components live in `src/components/custom/**`. Per-route accent colors/gradients are
defined in [src/lib/route-theme.ts](src/lib/route-theme.ts) and applied as CSS custom properties in
`src/app/(main)/layout.tsx` — add new top-level routes there to get a themed page.

## Conventions

- Path alias `@/*` → `src/*` (see [tsconfig.json](tsconfig.json)).
- Server-only modules are marked with `import "server-only"` at the top — keep this on any new file that
  touches D1/R2/secrets so it can't accidentally be pulled into a client bundle.
- API error responses are always `{ error: { code, message, request_id, details } }` via `jsonError()`;
  reuse the `ApiErrorCode` union in `src/lib/server/http.ts` rather than inventing new shapes.


---

Before writing any code, ask clarifying questions until you fully understand:
scope, edge cases, expected inputs/outputs, and what NOT to build.
Do not proceed until confirmed.

---

Code Mirroring & Consistency
Always match the exact style, patterns, and formatting of the existing codebase. Before writing new code, analyze how the surrounding files are written and type it the same way so it blends in perfectly. Do not change existing behavior, visuals, routing, animations, or responsiveness unless the task explicitly asks for it.

---

Style & Naming
Write code in a clean, simple, human style. Avoid formal, enterprise-style, or obvious AI-looking patterns. Make the code feel like it was written by a good solo developer: clean, compact, readable, and easy to edit later.

Do not use comments in code.

Keep names short, chill, and clear. Prefer practical names like navOpen, homeNav, nav-panel.tsx, or menu.tsx instead of long names like isNavigationContainerVisible or HomepageNavigationConfiguration.

---

UI Text & Copy
Write any displayed text or UI copy in a casual, chill way that matches the vibe of the rest of the page. Keep descriptions minimal and avoid adding a lot of text or useless descriptions everywhere.

---

Formatting & Layout
Keep simple TSX elements on one line when readable. Use multi-line formatting only when it genuinely improves readability, such as for large objects, arrays, complex JSX, or longer logic.

Do not run build commands unless new dependencies were installed or downloaded.

---

After completing a task, give a short summary of:
- what was built
- what was intentionally left out
- anything that might need attention later