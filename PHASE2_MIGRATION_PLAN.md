# Phase 2 Migration Plan — Refactor Architecture

Goal: Incrementally move the `Tracker` app from a small monolithic serverless + static frontend to a maintainable, feature-based architecture that preserves existing functionality while preparing the codebase for CareerPilot.

Principles
- Preserve backward compatibility of current API contract (`/api/login`, `/api/logout`, `/api/logs`).
- Make minimal, well-tested changes per commit.
- Add safe fallbacks for serverless limits (e.g., filesystem ephemeral).
- Prepare for TypeScript migration by introducing modular boundaries and tests.

High-level approach (strangler pattern)
1. Stabilize and secure current runtime (persistence fallback, rate-limiting).
2. Introduce a modular server `lib/` with clear adapters (storage, auth, rate-limit).
3. Add test harness and linting to enable safe refactors.
4. Migrate frontend incrementally to componentized structure (start with forms and API client).
5. Introduce TypeScript gradually: new modules typed first, then migrate existing modules by feature.

Suggested folder layout (target)

- api/ (serverless adapters)
  - _lib/
    - auth.js
    - storage.js (adapter interface)
    - storage.adapters/
      - memory.js
      - file.js
      - db.js (placeholder)
    - rate-limit.js
  - login.js
  - logout.js
  - logs.js
- public/
  - src/
    - components/
      - AuthForm/
      - DailyLogForm/
      - HistoryTable/
    - services/
      - apiClient.js
    - utils/
  - index.html
  - app.js (entry shim)
- scripts/
- tests/
- data/ (local dev persistence)

Migration steps (concrete)

Step A — Safety & persistence (already started)
- Replace current in-memory storage with a storage adapter that attempts file persistence and falls back to memory (keeps same API surface). (DONE)
- Add a `data/logs.json` local store for dev. (DONE)
- Add a basic IP-based rate limiter for `/api/login` to limit brute force (per-instance). (DONE)

Step B — Hardening & infra
- Add CSP guidance and a simple middleware to set CSP headers in server responses (Vercel supports headers in `vercel.json`).
- Add `express`-like small middleware pattern inside `_lib` for future use.

Step C — Tests, lint, CI
- Add ESLint + Prettier configs and lightweight test runner (Jest or node-tap).
- Add unit tests for `api/_lib/auth.js` and `api/_lib/storage.js`.
- Add GitHub Actions to run lint + tests on PRs.

Step D — Modularization
- Split `api/_lib/storage.js` into adapter pattern: `memory.js` and `file.js`.
- Introduce a `storageFactory()` that selects adapter by env var (e.g., `STORAGE_ADAPTER=file` or `STORAGE_ADAPTER=memory`).
- Update `api/logs.js` to use the new factory (no API changes).

Step E — Frontend modularization
- Create `public/src/services/apiClient.js` that wraps `fetch` and centralizes auth header usage.
- Split `public/app.js` into component modules under `public/src/components/` and use a minimal bundler (esbuild) or keep as ES modules for modern browsers.
- Add input sanitization helpers and avoid `innerHTML` where possible (use `textContent` / createElement).

Step F — TypeScript migration
- Initialize `tsconfig.json` and migrate `api/_lib` files to TypeScript first (non-breaking exports preserved via JS interop if needed).
- Migrate frontend component files to TSX/React in a new `frontend/` folder, preserving static `public/` until migration complete.

Step G — Feature expansion & CareerPilot
- With modular API and persistent storage in place, begin adding CareerPilot features as separate API routes and frontend modules (Applications, CV parsing, ATS scanning, Recruiter CRM, Analytics).
- Introduce authentication/user model if multi-user is required; otherwise clearly document single-user mode.

Backward compatibility & migration notes
- On first startup of the migrated app, detect legacy storage (if present) and migrate to new schema with versioning. Provide a migration function and backups in `data/`.
- Keep API response shapes identical for existing endpoints to avoid breaking the current `public/app.js` until frontend migration.

Testing & verification checklist
- Unit tests for `auth.verifyPassword`, `auth.verifyToken`, storage adapters.
- Integration test: login flow + addLog + getLogs roundtrip (using file adapter locally).
- Manual end-to-end: `vercel dev` local run, login, add logs, refresh history.

Risks & mitigations
- Filesystem persistence on serverless is ephemeral: recommend using a real DB for production (Postgres, Fauna, Supabase). The file adapter is for local/dev only.
- Rate limiter is per-instance: for distributed deployments use a shared cache (Redis) or edge provider rate-limiting.

Next actions (short term)
1. Commit the changes that add safe persistence and rate limiting (done).
2. Add ESLint, tests, and CI in the next change.
3. Implement storage adapter factory and update `api/logs.js` to use it.
4. Begin frontend modularization and sanitize DOM updates.

Estimated schedule (conservative)
- Week 1: Safety fixes, persistence adapter, basic tests
- Week 2: Lint, CI, adapter factory, storage migration helpers
- Week 3–4: Frontend modularization, small TS migration, component library
- Week 5+: Feature-by-feature migration toward CareerPilot

Contact
If you'd like, I can now implement Step B (CSP headers + middleware) and Step C (ESLint + tests). Otherwise I will proceed to implement the adapter factory and update `api/logs.js` next.
