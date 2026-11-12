# My Drive Resource Manager

Status: integrated in the feature branch; pending CI and release verification.

## Product boundary

The Workspace will expose two independent source choices:

- **Free Sources** — existing Google Fonts, Freesound and other online catalogues remain unchanged.
- **My Drive** — a personal library available only while the MAP132 Admin Dashboard session is active, with Google Drive connected separately through OAuth.

This module must not change the existing Free Sources implementation or the current Workspace layout outside its own mount point.

## Confirmed requirements

- Connect Google Drive through Google OAuth; never ask for or store the Google Account password.
- Reuse the existing MAP132 Admin Dashboard login/logout. Do not create a second My Drive password or PIN.
- Keep Google Drive OAuth authorization separate from MAP132 Admin authentication; connecting Google Drive is a one-time provider permission step.
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
- The Google OAuth client secret and My Drive session encryption secret are Cloudflare Worker secrets, never committed to Git.
- Every `/api/my-drive/*` operation must validate the signed `map132_admin` session server-side; hiding the UI is not an authorization boundary.
- Admin logout clears the current browser's My Drive access cookie/session. Google refresh-token records and imported assets are not destructively removed by ordinary MAP132 logout.
- ZIP processing must reject absolute paths, traversal, symlinks, encrypted entries and unsupported compression methods. Enforce entry-count, per-file, total-uncompressed-size and compression-ratio limits before extraction.
- Use MIME sniffing / file signature checks where practical; do not trust file extensions alone.
- Do not persist imported binary assets until a storage destination and retention policy are explicitly selected. Initial preview can use temporary browser object URLs and revoke them when the library closes.
- Preserve licence/source metadata. Unknown licence means “licence not verified”, not “free for commercial use”.

## Planned module structure

- types.ts — source, asset and import contracts.
- archivePolicy.ts — safe path, supported-format and archive-entry policy.
- driveClient.ts — read-only Drive API adapter with recursive folder traversal; the workspace UI opens Google Picker when a restricted Picker API key is configured.
- zipImporter.ts — bounded ZIP reader/extractor with stored/deflate support, CRC verification and duplicate SHA-256 detection.
- fontPreview.ts — temporary FontFace preview and cleanup.
- public/my-drive-resource-manager.js — isolated workspace UI for Admin-session gate, Login/Logout, Picker, Drive folder scan and local/Drive ZIP import.
- tests/ — unit, import-security and UI regression coverage.

## Integration gates

1. Keep all implementation on this feature branch only.
2. My Drive is mounted as a third independent workspace tab; Free Sources remain unchanged.
3. Verify Free Sources behaviour and all current font/audio workflows remain unchanged.
4. Run build, unit tests, Playwright desktop/mobile and import-security tests; fix every failure.
5. Complete Cloudflare configuration and real Google OAuth/Picker tests before treating the feature as ready.
6. Keep the PR draft. No merge or production deployment without a separate verified release step.

## External setup needed before live Drive connection

A Google Cloud OAuth Web application, Google Picker API enabled, and Cloudflare Worker variables/secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, a long random `MY_DRIVE_SESSION_SECRET` (used to encrypt short-lived access tokens at rest in KV), and optional `GOOGLE_PICKER_API_KEY` (restrict it to the workspace origin and Google Picker API). Bind `MAP132_KV`. The production redirect URI is `https://map132-digitals.anji-gongadi.workers.dev/api/my-drive/oauth/callback`; the authorized JavaScript origin is `https://map132-digitals.anji-gongadi.workers.dev`. Configure these only after verifying the intended production hostname. Never commit credentials. The OAuth adapter currently requests the read-only `drive.readonly` scope and uses online access only; it does not request a refresh token.
