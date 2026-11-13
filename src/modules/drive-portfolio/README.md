# Drive Portfolio Sync (M19)

## Purpose
Publish videos from one dedicated Google Drive folder into MAP132 DIGITALS Selected Work without requiring a separate upload for each video.

## User flow
1. Sign in to the existing MAP132 Admin Dashboard.
2. Connect Google Drive using the existing OAuth flow.
3. In Portfolio Manager, choose one dedicated Selected Work folder with Google Picker.
4. The module recursively scans that folder and nested folders, filters supported video files, maps folder/file names to the existing portfolio categories, and publishes the resulting records.
5. The selected folder ID is stored in browser local storage (it is not an OAuth credential). The module re-syncs when the portfolio manager opens, when the tab regains focus, and every five minutes while the portfolio manager remains open.
6. Use Sync now to request an immediate refresh.

## Playback and access boundary
- The public Worker playback endpoint serves only Drive file IDs present in the published portfolio content and tagged as Drive video items with a selected folder ID.
- The endpoint verifies the actual Drive MIME type is video, uses the encrypted OAuth refresh token server-side, and forwards HTTP Range headers so browser seeking can work.
- OAuth tokens are never returned to the public browser.
- Drive source files are read-only and are not moved, renamed, shared, or deleted by this feature.
- Every supported video in the selected folder is intentionally public on MAP132. Keep private/client-confidential files outside that folder.
- Removing a video from the selected folder removes its synced portfolio record on the next successful sync. Unrelated/manual portfolio entries and other folders remain untouched.

## Category mapping
The current portfolio categories are retained for compatibility:
- Cinematic / trailer / teaser → Cinematic Films
- Wedding / marriage / pelli → Wedding & Events
- Birthday / bday → Birthday Films
- Ads / promotion / brand → Brand Promotions
- AI / generative → AI Video Creation
- Reels / Instagram / Shorts → Reels & Shorts
- YouTube / podcast / interview → YouTube Videos
- Other names → Other Projects

## Dependencies and rollout gates
- Reuses the existing Drive client, Google OAuth, Google Picker configuration, Admin session, KV-backed portfolio content, and HomeSlider Selected Work media renderer.
- Google OAuth must have a stored refresh token and read access to the chosen folder. If the stored refresh token is absent/revoked, reconnect Google Drive from the Admin Dashboard.
- GOOGLE_PICKER_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MY_DRIVE_SESSION_SECRET, and MAP132_KV must be configured as already required by My Drive.
- Run focused unit tests, all existing unit tests, Playwright mobile tests, production build, and Worker dry-run before merging. PR runs must not deploy.
- No production deployment is included in this feature branch.
