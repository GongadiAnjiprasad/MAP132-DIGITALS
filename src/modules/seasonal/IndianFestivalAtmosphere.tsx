import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Clock3, Sparkles, X } from 'lucide-react';
import {
  FESTIVAL_CALENDAR,
  FESTIVAL_CAMPAIGN_DAYS,
  getFestivalCampaign,
  getIndiaDateKey
} from './festivalCalendar';
import './festival-frames.css';

function IndianFestivalAtmosphere() {
  const [todayKey, setTodayKey] = useState(() => getIndiaDateKey());
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [posterStatus, setPosterStatus] = useState('');

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
  if (!campaign) return null;

  const { festival, daysUntil, dayNumber, progress, isFestivalDay, currentDay } = campaign;
  const particles = festival.theme === 'snow'
    ? ['❄', '✧', '❅']
    : festival.theme === 'sun'
      ? ['☀', '✦', '✨']
      : festival.theme === 'diwali'
        ? ['🪔', '✧', '✨', '🌟']
        : ['✨', '✦', '🙏'];

  async function createGreetingPoster() {
    setPosterStatus('Creating your festival greeting…');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Poster canvas is not available in this browser.');

      const palettes: Record<string, [string, string, string]> = {
        diwali: ['#100D12', '#3A2118', '#F4C477'],
        sun: ['#091923', '#174B50', '#F6C66C'],
        gold: ['#11131A', '#29221B', '#E8C77A'],
        snow: ['#101827', '#203A50', '#F4E9D4']
      };
      const [dark, mid, accent] = palettes[festival.theme];
      const background = context.createLinearGradient(0, 0, 1080, 1350);
      background.addColorStop(0, dark);
      background.addColorStop(.55, mid);
      background.addColorStop(1, '#090B10');
      context.fillStyle = background;
      context.fillRect(0, 0, 1080, 1350);
      const glow = context.createRadialGradient(540, 450, 20, 540, 450, 700);
      glow.addColorStop(0, accent + '42');
      glow.addColorStop(1, accent + '00');
      context.fillStyle = glow;
      context.fillRect(0, 0, 1080, 1350);
      context.strokeStyle = accent + '88';
      context.lineWidth = 2;
      context.strokeRect(48, 48, 984, 1254);
      context.textAlign = 'center';
      context.fillStyle = accent;
      context.font = '700 24px Arial';
      context.fillText('A FESTIVE GREETING FROM', 540, 180);

      const logo = new Image();
      logo.src = '/resources/logo-removebg-preview.png';
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject(new Error('MAP132 logo could not be loaded.'));
      });
      const scale = Math.min(510 / logo.width, 270 / logo.height);
      context.shadowColor = accent;
      context.shadowBlur = 32;
      context.drawImage(logo, 540 - logo.width * scale / 2, 235 - logo.height * scale / 2, logo.width * scale, logo.height * scale);
      context.shadowBlur = 0;
      context.fillStyle = '#FFFFFF';
      context.font = '700 64px Arial';
      context.fillText(festival.name, 540, 650);
      context.font = '54px Arial';
      context.fillText(festival.emoji, 540, 745);
      context.fillStyle = '#F3E9D2';
      context.font = '30px Arial';
      const words = festival.message.split(' ');
      const lines: string[] = [];
      let line = '';
      words.forEach(word => {
        const candidate = line ? line + ' ' + word : word;
        if (context.measureText(candidate).width > 820 && line) {
          lines.push(line);
          line = word;
        } else line = candidate;
      });
      if (line) lines.push(line);
      lines.slice(0, 4).forEach((value, index) => context.fillText(value, 540, 850 + index * 48));
      context.fillStyle = accent;
      context.font = '700 25px Arial';
      context.fillText('MAP132 DIGITALS', 540, 1125);
      context.fillStyle = '#D7D0C4';
      context.font = '20px Arial';
      context.fillText('VIDEO EDITING · EVERY FRAME HAS A STORY', 540, 1170);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('Poster export failed.')), 'image/png');
      });
      const filename = `MAP132-${festival.name.replace(/[^a-z0-9]+/gi, '-')}-Greeting.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `MAP132 DIGITALS - ${festival.name}`, text: 'Warm wishes from MAP132 DIGITALS!', files: [file] });
        setPosterStatus('Your greeting is ready to share.');
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        setPosterStatus('Your MAP132 greeting poster has been downloaded.');
      }
    } catch (error) {
      setPosterStatus(error instanceof Error ? error.message : 'Could not create the greeting poster.');
    }
  }

  return (
    <>
      <div className={`festival-atmosphere festival-${festival.theme} ${isFestivalDay ? 'festival-live' : 'festival-build-up'}`} aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            style={{
              left: `${4 + index * 7}%`,
              animationDuration: `${15 + (index % 5) * 4}s`,
              animationDelay: `${-index * 2.4}s`
            }}
          >
            {particles[index % particles.length]}
          </span>
        ))}
      </div>

      {!dismissed && (
        <aside className="ff-launcher" aria-label={`MAP132 ${festival.name} festive experience`}>
          <div className="ff-launcher-top">
            <span><Sparkles size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} /> MAP132 FESTIVE FRAMES</span>
            <button className="ff-launcher-close" type="button" aria-label="Dismiss festive experience" onClick={() => { setDismissed(true); setExpanded(false); }}>
              <X size={14} />
            </button>
          </div>
          <h2>{festival.name}</h2>
          <div className="ff-launcher-count">
            <strong>{isFestivalDay ? 'TODAY' : String(daysUntil).padStart(2, '0')}</strong>
            <span>{isFestivalDay ? 'FESTIVAL DAY' : 'DAYS TO GO'}</span>
          </div>
          <p className="ff-launcher-copy">
            {isFestivalDay ? 'Our festive creative reveal is here. Celebrate with MAP132 DIGITALS.' : currentDay?.description}
          </p>
          <div className="ff-progress" role="progressbar" aria-label="Festival campaign progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="ff-launcher-actions">
            <button className="ff-button" type="button" onClick={() => setExpanded(value => !value)}>
              {expanded ? 'Close journey' : 'Explore the journey'} <ArrowUpRight size={13} />
            </button>
            <a className="ff-button ff-button-quiet" href="#contact">Create a festival video</a>
          </div>
        </aside>
      )}

      {expanded && !dismissed && (
        <section className="ff-panel" aria-label={`${festival.name} ten-day creative journey`}>
          <div className="ff-panel-head">
            <div>
              <p className="ff-panel-kicker">MAP132 DIGITALS · SEASONAL CAMPAIGN</p>
              <h3>{festival.name} journey</h3>
            </div>
            <button className="ff-launcher-close" type="button" aria-label="Close festive journey" onClick={() => setExpanded(false)}><X size={15} /></button>
          </div>
          <p className="ff-panel-subtitle">Ten days of creative ideas, followed by one signature festival-day reveal.</p>
          <div className="ff-current">
            <span className="ff-current-label">{isFestivalDay ? 'THE GRAND REVEAL' : `DAY ${String(dayNumber).padStart(2, '0')} / 10 · ${currentDay?.focus}`}</span>
            <strong>{isFestivalDay ? `Happy ${festival.name}!` : currentDay?.title}</strong>
            <p>{isFestivalDay ? festival.message : currentDay?.description}</p>
          </div>
          <div className="ff-days">
            {FESTIVAL_CAMPAIGN_DAYS.map((day, index) => {
              const isCurrent = !isFestivalDay && index === dayNumber - 1;
              const isComplete = isFestivalDay || index < dayNumber - 1;
              return (
                <div className={`ff-day ${isCurrent ? 'is-current' : ''} ${isComplete ? 'is-complete' : ''}`} key={day.focus}>
                  <span className="ff-day-number">{isComplete ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
                  <span className="ff-day-copy"><b>{day.title}</b><span>{day.focus}</span></span>
                  <span className="ff-day-status">{isCurrent ? 'TODAY' : isComplete ? 'DONE' : 'UP NEXT'}</span>
                </div>
              );
            })}
          </div>
          <div className="ff-panel-footer">
            <button className="ff-button" type="button" onClick={createGreetingPoster}><Sparkles size={13} /> Create greeting poster</button>
            <a className="ff-button ff-button-quiet" href="#contact">Promote my brand <ArrowUpRight size={13} /></a>
          </div>
          <p className="ff-status" role="status" aria-live="polite">{posterStatus}</p>
          <p className="ff-panel-note"><Clock3 size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Campaign dates follow the India calendar. Festival dates can vary by region; the calendar is maintained in this module.</p>
        </section>
      )}
    </>
  );
}

export default IndianFestivalAtmosphere;
