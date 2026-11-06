export type FestivalTheme = 'diwali' | 'sun' | 'gold' | 'snow';

export interface FestivalDefinition {
  date: string;
  name: string;
  emoji: string;
  message: string;
  theme: FestivalTheme;
}

export interface FestivalCampaign {
  festival: FestivalDefinition;
  daysUntil: number;
  isFestivalDay: boolean;
}

export const FESTIVAL_CALENDAR: readonly FestivalDefinition[] = [
  { date: '2026-11-08', name: 'Diwali', emoji: '🪔 ✨ 🎆', message: 'May the light of Diwali bring happiness, peace and new beginnings to you and your family.', theme: 'diwali' },
  { date: '2026-11-15', name: 'Chhath Puja', emoji: '☀️ 🙏 🌅', message: 'Wishing you and your family health, harmony and prosperity. May the blessings of the Sun bring brighter days.', theme: 'sun' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', emoji: '🙏 ✨', message: 'May the teachings of kindness, equality and compassion guide us all. Warm wishes to you and your family.', theme: 'gold' },
  { date: '2026-12-25', name: 'Christmas', emoji: '🎄 ✨ 🎁', message: 'Wishing you a season filled with peace, joy and beautiful moments. Merry Christmas!', theme: 'snow' }
] as const;

function parseDateKey(key: string): number | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const check = new Date(timestamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return timestamp;
}

export function getIndiaDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

export function daysBetweenDateKeys(from: string, to: string): number | null {
  const fromTime = parseDateKey(from);
  const toTime = parseDateKey(to);
  if (fromTime === null || toTime === null) return null;
  return Math.round((toTime - fromTime) / 86_400_000);
}

export function getFestivalCampaign(
  todayKey: string,
  calendar: readonly FestivalDefinition[] = FESTIVAL_CALENDAR
): FestivalCampaign | null {
  if (parseDateKey(todayKey) === null) return null;
  const upcoming = calendar
    .map(festival => ({ festival, daysUntil: daysBetweenDateKeys(todayKey, festival.date) }))
    .filter((item): item is { festival: FestivalDefinition; daysUntil: number } =>
      item.daysUntil !== null && item.daysUntil >= 0 && item.daysUntil <= 10
    )
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const next = upcoming[0];
  if (!next) return null;
  return { festival: next.festival, daysUntil: next.daysUntil, isFestivalDay: next.daysUntil === 0 };
}
