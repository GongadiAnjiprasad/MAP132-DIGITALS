import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { FESTIVAL_CALENDAR, getFestivalCampaign, getIndiaDateKey } from './festivalCalendar';
import './festival-frames.css';

type GreetingResponse = {
  active: boolean;
  ready?: boolean;
  image?: string | null;
  festival?: { name: string; message: string; emoji: string; theme: string };
};

function IndianFestivalAtmosphere() {
  const [todayKey, setTodayKey] = useState(() => getIndiaDateKey());
  const [greeting, setGreeting] = useState<GreetingResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refresh = () => setTodayKey(getIndiaDateKey());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const campaign = useMemo(() => getFestivalCampaign(todayKey, FESTIVAL_CALENDAR), [todayKey]);

  // Keep the festival greeting brief; the visitor can still dismiss it immediately.
  useEffect(() => {
    if (!campaign?.isFestivalDay || dismissed) return;
    const autoCloseTimer = window.setTimeout(() => setDismissed(true), 8_000);
    return () => window.clearTimeout(autoCloseTimer);
  }, [campaign?.festival.date, campaign?.isFestivalDay, dismissed]);

  useEffect(() => {
    if (!campaign?.isFestivalDay) {
      setGreeting(null);
      setDismissed(false);
      return;
    }
    let active = true;
    let timer: number | undefined;
    const loadGreeting = async () => {
      try {
        const response = await fetch('/api/festival-greeting', { headers: { Accept: 'application/json' } });
        if (!response.ok) return;
        const data = await response.json() as GreetingResponse;
        if (active && data.active) setGreeting(data);
      } catch {
        // The greeting card keeps its lightweight CSS fallback if image generation is unavailable.
      }
    };
    void loadGreeting();
    timer = window.setInterval(() => void loadGreeting(), 30_000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [campaign?.festival.date, campaign?.isFestivalDay]);

  if (!campaign) return null;

  const { festival, isFestivalDay } = campaign;
  const particles = festival.theme === 'snow'
    ? ['❄', '✧', '❅']
    : festival.theme === 'sun'
      ? ['☀', '✦', '✨']
      : festival.theme === 'diwali'
        ? ['🪔', '✧', '✨']
        : ['✨', '✦', '🙏'];

  return (
    <>
      <div className={'festival-atmosphere festival-' + festival.theme} aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            style={{
              left: (5 + index * 10) + '%',
              animationDuration: (18 + (index % 4) * 4) + 's',
              animationDelay: (-index * 2.1) + 's'
            }}
          >
            {particles[index % particles.length]}
          </span>
        ))}
      </div>

      {isFestivalDay && !dismissed && (
        <aside className="ff-greeting" aria-label={'Festival wishes from MAP132 DIGITALS: ' + festival.name}>
          {greeting?.image && (
            <img
              className="ff-greeting-background"
              src={'data:image/jpeg;base64,' + greeting.image}
              alt=""
              aria-hidden="true"
            />
          )}
          <div className="ff-greeting-shade" />
          <button
            className="ff-greeting-close"
            type="button"
            aria-label="Skip or close festival wishes"
            onClick={() => setDismissed(true)}
          >
            <span>Skip</span><X size={16} />
          </button>
          <div className="ff-greeting-content">
            <p className="ff-greeting-kicker">WARM WISHES FROM</p>
            <img className="ff-greeting-logo" src="/resources/Firefly%20remove%20background.png" alt="MAP132 DIGITALS" />
            <p className="ff-greeting-brand">MAP132 DIGITALS</p>
            <h2>Happy {festival.name}!</h2>
            <p className="ff-greeting-message">{festival.message}</p>
            <span className="ff-greeting-signoff">VIDEO EDITING · EVERY FRAME HAS A STORY</span>
          </div>
        </aside>
      )}
    </>
  );
}

export default IndianFestivalAtmosphere;
