# MAP132 FESTIVE FRAMES (M12)

This module is mounted by the existing `PublicSite` in `src/App.tsx`. Keep it self-contained: UI, styles and calendar logic live in this folder. Do not edit the public-site shell just to change festival content.

## Automatic behaviour

- Uses `Asia/Kolkata` for the campaign date, independent of the visitor's device timezone.
- Activates when the next configured festival is 10 days away or less.
- Selects one festival at a time (the nearest eligible date) if campaign windows overlap.
- Advances the featured creative beat once per calendar day.
- Shows a separate festival-day grand reveal, then returns to the normal site automatically.
- Never autoplays sound, opens a modal, or blocks page navigation.
- If no configured festival is within the 10-day window, the module renders nothing.

## Updating the festival calendar

Edit `FESTIVAL_CALENDAR` in `festivalCalendar.ts`. Add one entry per festival using an ISO date (`YYYY-MM-DD`), display name, emoji, greeting, and one of the existing themes (`diwali`, `sun`, `gold`, `snow`). For lunar-calendar festivals, verify the date for the relevant year before adding it; do not assume the date repeats annually.

The ten creative beats are in `FESTIVAL_CAMPAIGN_DAYS` in the same file. Edit these labels/descriptions to refresh the campaign without changing the component or homepage.

## Safe release

Run `npm test`, `npm run test:e2e` and `npm run build` before merging. The seasonal component is already mounted; avoid editing `src/App.tsx`, global CSS, workspace files, Worker routes, or deployment configuration for ordinary campaign-content updates.
