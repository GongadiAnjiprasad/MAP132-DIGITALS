export type FestivalTheme = 'diwali' | 'sun' | 'gold' | 'snow';

export interface FestivalDefinition {
  date: string;
  name: string;
  emoji: string;
  message: string;
  theme: FestivalTheme;
}

export interface CampaignDay {
  title: string;
  focus: string;
  description: string;
}

export interface FestivalCampaign {
  festival: FestivalDefinition;
  daysUntil: number;
  dayNumber: number;
  progress: number;
  isFestivalDay: boolean;
  currentDay: CampaignDay | null;
}

export const FESTIVAL_CALENDAR: readonly FestivalDefinition[] = [
  { date: '2026-11-08', name: 'Diwali', emoji: '🪔 ✨ 🎆', message: 'May the light of Diwali bring happiness, peace and new beginnings to you and your family.', theme: 'diwali' },
  { date: '2026-11-15', name: 'Chhath Puja', emoji: '☀️ 🙏 🌅', message: 'Wishing you and your family health, harmony and prosperity. May the blessings of the Sun bring brighter days.', theme: 'sun' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', emoji: '🙏 ✨', message: 'May the teachings of kindness, equality and compassion guide us all. Warm wishes to you and your family.', theme: 'gold' },
  { date: '2026-12-25', name: 'Christmas', emoji: '🎄 ✨ 🎁', message: 'Wishing you a season filled with peace, joy and beautiful moments. Merry Christmas!', theme: 'snow' }
] as const;

/** Ten editable creative beats, followed by a separate festival-day reveal. */
export const FESTIVAL_CAMPAIGN_DAYS: readonly CampaignDay[] = [
  { title: 'The first spark', focus: 'TEASER', description: 'A subtle visual hint that the festive experience is on its way.' },
  { title: 'Set the mood', focus: 'ART DIRECTION', description: 'Reveal the festival palette, textures and visual identity.' },
  { title: 'Words with impact', focus: 'KINETIC TYPE', description: 'Showcase expressive typography and a signature title treatment.' },
  { title: 'Sound tells the story', focus: 'SOUND DESIGN', description: 'Pair original, licensed or royalty-cleared sound with the visuals.' },
  { title: 'A moment in motion', focus: 'MOTION GRAPHICS', description: 'Feature a short animation built around the festival.' },
  { title: 'The transition edit', focus: 'EDITING', description: 'Show a polished transition and a before-to-after editing moment.' },
  { title: 'Made for the feed', focus: 'SOCIAL REEL', description: 'Present a vertical short-form festival concept.' },
  { title: 'A brand in the celebration', focus: 'BRAND PROMO', description: 'Demonstrate how a business can use a festive promotional video.' },
  { title: 'The cinematic build-up', focus: 'FESTIVAL TRAILER', description: 'Release a short trailer that builds anticipation.' },
  { title: 'One day to go', focus: 'FINAL COUNTDOWN', description: 'Bring the campaign together with a polished countdown visual.' }
] as const;

function parseDateKey(key: string): number | null {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(key)) return null;
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
  return `${values.year}-${values.month}-${values.day}`;
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
  const isFestivalDay = next.daysUntil === 0;
  const dayNumber = isFestivalDay ? 10 : 10 - next.daysUntil;
  return {
    festival: next.festival,
    daysUntil: next.daysUntil,
    dayNumber,
    progress: isFestivalDay ? 100 : Math.max(0, Math.min(100, dayNumber * 10)),
    isFestivalDay,
    currentDay: isFestivalDay ? null : FESTIVAL_CAMPAIGN_DAYS[dayNumber - 1]
  };
}
