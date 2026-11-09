const IST_TIME_ZONE = 'Asia/Kolkata';

function istCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function formatCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export function formatFeedbackTimestamp(value?: string | null, now: Date = new Date()): string {
  if (typeof value !== 'string' || !value.trim()) return 'Date/time unavailable';
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime()) || !Number.isFinite(now.getTime())) {
    return 'Date/time unavailable';
  }

  // Relative labels are used only on the same IST calendar day.
  if (istCalendarDate(timestamp) !== istCalendarDate(now)) {
    return formatCalendarDate(timestamp);
  }

  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - timestamp.getTime()) / 60_000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes === 1) return '1 minute ago';
  if (elapsedMinutes < 60) return `${elapsedMinutes} minutes ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours === 1) return '1 hour ago';
  return `${elapsedHours} hours ago`;
}
