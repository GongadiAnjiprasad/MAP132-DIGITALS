export function formatFeedbackTimestamp(value?: string | null): string {
  if (typeof value !== 'string' || !value.trim()) return 'Date/time unavailable';
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) return 'Date/time unavailable';

  const date = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(timestamp);
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(timestamp);

  return `Date: ${date} · Time: ${time}`;
}
