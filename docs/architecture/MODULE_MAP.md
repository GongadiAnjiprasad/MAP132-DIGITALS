# MAP132 DIGITALS — Module Architecture & User-Story Register

**Baseline:** `main` at `96c007cd915d9e3a366c5ed2cfe7907f6666d64c` (2026-11-05)  
**Purpose:** Keep a recoverable, module-by-module map of the complete website so future changes can be scoped, tested, reviewed and rolled back without casually disturbing unrelated features.

> This is an architecture inventory and change-control guide, not a claim that the current code is already physically split into independent packages. The current React application still has a large `src/App.tsx`; the static editor workspace is in `workspace.html` and mirrored at `public/workspace.html`. Physical extraction must happen gradually, with behaviour-preserving tests.

## 1. Product/module register

| Module ID | Product area | Current implementation / ownership | Main user stories |
|---|---|---|---|
| M01 | Public Home / Portfolio | `src/HomeSlider.tsx`, `src/HomeSlider.css`; rendered by `App()` for the normal route | View cinematic home; navigate the five-page slider; browse selected work; view services/studio/contact; use responsive swipe/navigation; open Editor Workspace |
| M02 | Public-site content & media presentation | Home content types/defaults and media helpers in `src/App.tsx`; public rendering in `HomeSlider.tsx` | Load profile, skills and portfolio items; show uploaded video/image, YouTube and Drive previews; handle missing/invalid media safely |
| M03 | Editor Workspace — standalone resource room | `workspace.html` and exact mirror `public/workspace.html`; also `WorkspaceStandalone` / `WorkspaceLibrary` in `src/App.tsx` for hash route | Open private editing resource area; browse cinematic SFX and fonts; search/filter; preview; save font favourites; download permitted assets; add/delete personal resources; return to public site; use Dashboard shortcut |
| M04 | Admin Dashboard — authentication & shell | `AdminApp` in `src/App.tsx`; auth/session endpoints in `worker/index.ts` | Sign in; verify existing session; protect dashboard; show errors/loading; sign out without exposing protected data |
| M05 | Admin — Portfolio Manager | `AdminApp` portfolio tab in `src/App.tsx`; portfolio APIs in `worker/index.ts` | Add project by upload or YouTube/Drive/URL; preview before publish; list and delete projects; validate media metadata |
| M06 | Admin — Profile & Brand Content | `AdminApp` profile tab and content defaults in `src/App.tsx`; persistence in Worker/KV | Edit brand name, headline, intro, about and location; save and publish |
| M07 | Admin — Skills & Software | `AdminApp` skills tab in `src/App.tsx` | Edit skills list; save; show updated skills on public site |
| M08 | Admin — Social & Contact Links | `AdminApp` social tab in `src/App.tsx` | Manage WhatsApp, Instagram, Facebook, Telegram, LinkedIn, YouTube and email; hide empty links; open configured destinations |
| M09 | Admin — Workspace Resource Library | `WorkspaceLibrary` in `src/App.tsx`; content resources persisted via Worker | Add/edit resource metadata where supported; classify audio/video/image/template/font; preview/open source; delete resources; retain licence notes |
| M10 | Admin — Client Enquiries | `AdminApp` enquiries tab in `src/App.tsx`; `/api/enquiries` and `/api/admin/enquiries` in Worker | Receive public enquiry; validate fields; store in KV; protected admin can view and delete enquiry |
| M11 | Cinematic Logo / Motion Studio | `TitleMotionStudio` in `src/App.tsx` | Preview logo intro styles; choose aspect ratio/resolution; render a local WebM with synthesized sound; download result |
| M12 | Festival / Seasonal Atmosphere | `src/modules/seasonal/IndianFestivalAtmosphere.tsx`; mounted by `PublicSite` in `src/App.tsx` | Show time-windowed seasonal effect/greeting; generate greeting poster; optional share flow |
| M13 | Workspace SFX Catalogue | SFX markup and script in `workspace.html` (mirrored in `public/workspace.html`); proxy endpoints in `worker/index.ts` | Search sound effects; filter allowed licences; preview; download only eligible source files; handle provider/key errors |
| M14 | Cinematic Fonts Catalogue | Font data, preview and script in `workspace.html` (mirrored in `public/workspace.html`) | Browse English/Telugu font categories; live sample preview; search; save favourites locally; download font files |
| M15 | API / Data Persistence / Media Storage | `src/api.ts`, `worker/index.ts`, `wrangler.toml` | Read public portfolio; persist admin content; store enquiries in KV; upload/serve media through R2 when configured; expose health endpoint; validate inputs |
| M16 | Shared Design System & Assets | `src/index.css`, `src/HomeSlider.css`, `public/resources/*`, shared fonts/icons | Preserve MAP132 brand identity, typography, colours, spacing, responsive rules, logo and reusable UI patterns |
| M17 | Routing / Application Bootstrap | `src/main.tsx`, `src/App.tsx`, `index.html`, hash routes `#admin` / `#workspace` | Load app; route between public site, protected admin and workspace; maintain route synchronisation |
| M18 | QA / Build / Deployment | `tests/*`, `playwright.config.ts`, `package.json`, `.github/workflows/*`, `wrangler.toml` | Run unit/E2E tests; build; deploy Worker/assets; verify health and route behaviour; preserve release checkpoints |
| M19 | Google Drive → Selected Work video sync | `src/modules/drive-portfolio/*`, existing My Drive OAuth/client, `worker/index.ts`, `src/HomeSlider.tsx` | Select one Drive folder; recursively sync supported videos; map categories; publish folder-owned records; sync on Admin Portfolio Manager open or on demand (no additional Cron); stream only published files with Range support |

## 2. Current route map

- `/` — public Home experience; `App()` currently renders `HomeSlider` for the normal route.
- `/#workspace` — React `WorkspaceStandalone` route. It uses `WorkspaceLibrary` and local browser storage for its standalone resource entries.
- `/#admin` — existing protected `AdminApp` route. Do not bypass or weaken its Worker-backed session check.
- `/workspace.html` — separate static Editor Workspace resource page. `workspace.html` and `public/workspace.html` are an exact mirror pair and must remain byte-identical when changed.

Note: `PublicSite` is present in `src/App.tsx`, but the current normal route returns `HomeSlider`; do not assume `PublicSite` is the active home implementation without checking route usage.

## 3. Shared services and cross-module dependencies

These are shared foundations, not safe-to-change-in-isolation modules:

- **Content contract:** profile, skills, portfolio items and workspace resources are represented by shared TypeScript data shapes/defaults in `src/App.tsx` and normalised by the Worker.
- **API client:** `src/api.ts` is used by public/admin flows. API contract changes can affect multiple modules.
- **Worker and storage:** `worker/index.ts` handles auth, content, enquiries, sound catalogue proxy and media routes. Changes here require API-level regression tests.
- **Brand styles/assets:** global CSS, slider CSS, logo and font imports affect multiple screens.
- **Route/auth contract:** `#admin` and `#workspace` routing is shared. Dashboard access must continue to pass through the existing authenticated AdminApp.
- **Static workspace mirror:** edit one canonical copy, synchronise the mirror, then verify both files have the same SHA/content.

## 4. Change-isolation rules

1. Every task must name one primary Module ID (M01–M19) and the user story being changed.
2. Make the smallest possible change. Do not reformat or redesign unrelated modules.
3. Before editing, create a checkpoint branch from the last verified production commit and a separate feature branch.
4. Keep module-specific UI, styles, logic and tests together when extracting code. Use explicit props/interfaces rather than importing another module's internal state.
5. Shared contracts (API types, auth, global CSS/tokens, route shell, storage schema) require an impact review and regression tests for every dependent module.
6. For `workspace.html`, update both mirror files and assert byte-for-byte equality.
7. Add/adjust a focused test for the changed story, then run the existing unit tests, E2E suite and production build.
8. Review the diff to confirm only intended module files and required shared contracts changed.
9. Merge/deploy only after checks pass. Verify the production workflow and live health/route where possible; never equate a merged PR with a successful live deployment.
10. If deploy or smoke test fails, restore the last verified checkpoint and verify recovery.
11. Do not store passwords, API keys, tokens, or private customer data in this documentation or source control.

## 5. Future target folder layout (proposed, not yet implemented)

This is the destination for gradual extraction. Do not move everything in one risky refactor.

```text
src/
  app/                 # bootstrap, route selection, shared shell
  modules/
    seasonal/          # M12 festival atmosphere (first extracted module)
    drive-portfolio/   # M19 Google Drive → Selected Work video sync
    home/              # M01 public Home / slider
    portfolio/         # M02 public media presentation
    workspace/         # M03 React workspace library
    admin/
      auth/            # M04 protected dashboard shell
      portfolio/       # M05
      profile/         # M06
      skills/          # M07
      social/          # M08
      resources/       # M09
      enquiries/       # M10
    motion-studio/     # M11
    seasonal/          # M12
    sfx-catalogue/     # M13 static workspace feature
    font-catalogue/    # M14 static workspace feature
  shared/
    api/               # M15 API contracts/client
    design-system/     # M16 tokens, primitives and shared assets
    routing/           # M17 route contracts
worker/
  modules/             # future server route handlers, extracted gradually
tests/
  unit/
  e2e/
  modules/             # module-focused regression coverage
docs/
  architecture/
    MODULE_MAP.md
```

## 6. Module acceptance checklist

For each user story, record:
- Module ID and story ID
- User-visible behaviour before change
- Files allowed to change
- Shared dependencies touched (if any) and why
- Focused unit/component/E2E test
- Regression modules tested
- Checkpoint SHA, feature branch and PR
- Build/test result
- Deployment run and live smoke-test result
- Rollback checkpoint if needed

## 7. Known implementation facts at this baseline

- `src/App.tsx` is a large combined file containing public/admin/workspace components and multiple features. The register above describes logical modules, not yet separate build bundles.
- The static workspace HTML is about 41 KB and includes the SFX and font catalogues in one document. They are logical modules but not separate source files yet.
- `src/HomeSlider.tsx` and `src/HomeSlider.css` are already separate from `App.tsx`.
- M12 Festival / Seasonal Atmosphere has now been extracted into `src/modules/seasonal/IndianFestivalAtmosphere.tsx`; the existing mount point and visual behaviour are preserved.
- M19 Drive Portfolio Sync is implemented as an isolated module under `src/modules/drive-portfolio/`; it reuses the existing read-only Drive folder scanner, persists the chosen folder and portfolio metadata in the existing KV namespace, and syncs only when the Admin Portfolio Manager opens, when a folder is selected, or when the admin presses Sync now. No additional background Cron is used; the existing daily festival Cron is unchanged. The Worker streams only published Drive video IDs and forwards byte-range requests. Keep its publication allowlist, incomplete-scan protection and byte-range playback tests in place.
- Existing tests include swipe navigation, responsive layout and swipe gesture unit coverage. Expand them with module-specific tests before extracting/refactoring.
- The Worker uses the existing Cloudflare KV namespace for content/enquiries and Drive portfolio metadata; optionally configured R2 is used for media. Secrets/bindings are configured outside this document in Cloudflare.
