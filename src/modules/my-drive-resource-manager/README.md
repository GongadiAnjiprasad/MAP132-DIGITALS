# My Drive Resource Manager

Status: isolated foundation only — not connected to the live Workspace and not deployed.

## Product boundary

The Workspace will expose two independent source choices:

- **Free Sources** — existing Google Fonts, Freesound and other online catalogues remain unchanged.
- **My Drive** — a separate, password-gated personal library connected through Google OAuth.

This module must not change the existing Free Sources implementation or the current Workspace layout outside its own mount point.

## Confirmed requirements

- Connect Google Drive through Google OAuth; never ask for or store the Google Account password.
- Use a simple, separate My Drive unlock password, verified server-side with a dedicated secret. Never reuse the portfolio admin password.
- Use read-only Drive access. Never rename, move, edit, or delete source files.
- Import selected ZIP files or selected Drive folders.
- Recursively traverse nested folders and ZIP directory entries.
- Recognize TTF, OTF, WOFF and WOFF2 fonts and render a real preview using imported font bytes.
- Keep online Free Sources and My Drive as independent source views; combined search is an explicit user action.
- Identify other collected creative assets (audio, video, image, template/overlay, texture) without treating unknown or unlicensed assets as free.
- Skip unsupported files, report unreadable/corrupt/encrypted archives, and detect duplicates by content hash.
- Keep original ZIPs and Drive folders untouched.

## Security and reliability rules

- OAuth authorization uses a least-privilege read-only scope and a state/PKCE-protected flow. Access tokens must not be placed in URLs, localStorage, or committed source.
- The dedicated My Drive password secret and Google OAuth client secret are Cloudflare Worker secrets, never committed to Git.
- Apply rate limiting to password verification and short-lived sessions. Clear in-memory Drive tokens on lock/logout.
- ZIP processing must reject absolute paths, traversal, symlinks, encrypted entries and unsupported compression methods. Enforce entry-count, per-file, total-uncompressed-size and compression-ratio limits before extraction.
- Use MIME sniffing / file signature checks where practical; do not trust file extensions alone.
- Do not persist imported binary assets until a storage destination and retention policy are explicitly selected. Initial preview can use temporary browser object URLs and revoke them when the library closes.
- Preserve licence/source metadata. Unknown licence means “licence not verified”, not “free for commercial use”.

## Planned module structure

- types.ts — source, asset and import contracts.
- archivePolicy.ts — safe path, supported-format and archive-entry policy.
- driveClient.ts — read-only Drive Picker/API adapter (next phase; requires Google Cloud OAuth/Picker configuration).
- zipImporter.ts — bounded ZIP reader/extractor (next phase).
- fontPreview.ts — temporary FontFace preview and cleanup (next phase).
- MyDriveResourceManager.tsx — isolated UI (next phase).
- tests/ — unit, import-security and UI regression coverage.

## Integration gates

1. Complete module implementation on this feature branch only.
2. Add a dedicated mount point to the existing workspace only after module tests pass.
3. Verify Free Sources behaviour and all current font/audio workflows remain unchanged.
4. Run build, unit tests, Playwright desktop/mobile and import-security tests.
5. Open a draft PR for review. No merge or production deployment without a separate verified release step.

## External setup needed before live Drive connection

A Google Cloud OAuth Web application with the authorized origin and redirect URI, Google Picker API enabled, and a Cloudflare Worker secret for the OAuth client secret. These values must be supplied/configured by the account owner; never commit credentials.
