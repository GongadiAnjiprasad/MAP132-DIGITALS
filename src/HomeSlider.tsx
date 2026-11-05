import { useEffect, useRef, useState, type PointerEvent, type WheelEvent, type MouseEvent } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, Check, Film, Instagram, Mail, MessageCircle,
  Play, Sparkles, Youtube, Facebook, Linkedin, Send, X
} from 'lucide-react';
import DemoShowcase from './DemoShowcase';
import { api } from './api';
import { getHorizontalSwipeDirection } from './swipeGesture';
import { DEMO_SHOWCASE } from './demoShowcase';

type PortfolioItem = {
  id: string; title: string; category: string; description: string;
  kind: 'video' | 'image' | 'link'; url?: string; mediaUrl?: string;
  source?: 'upload' | 'youtube' | 'drive' | 'other';
};
type HomeContent = {
  profile: {
    name: string; headline: string; intro: string; about: string; location: string;
    whatsapp: string; instagram: string; youtube: string; email: string;
    facebook: string; telegram: string; linkedin: string;
  };
  skills: string[];
  items: PortfolioItem[];
};

const pages = ['Home', 'Selected Work', 'Services', 'Studio', 'Contact'];
const previewVideos = [
 {src:'https://videos.pexels.com/video-files/27099636/12071805_1920_1080_60fps.mp4',note:'Stock-footage visual study · cinematic atmosphere'},
 {src:'https://videos.pexels.com/video-files/31245302/13345103_1920_1080_50fps.mp4',note:'Stock-footage visual study · wedding and celebration'},
 {src:'https://videos.pexels.com/video-files/7424531/7424531-uhd_3840_2160_30fps.mp4',note:'Stock-footage visual study · short-form social content'},
 {src:'https://videos.pexels.com/video-files/8100337/8100337-uhd_4096_2160_25fps.mp4',note:'Stock-footage visual study · creator and podcast workflow'},
 {src:'https://videos.pexels.com/video-files/27099636/12071805_1920_1080_60fps.mp4',note:'Stock-footage visual study · commercial mood reference'},
 {src:'https://videos.pexels.com/video-files/8100337/8100337-uhd_4096_2160_25fps.mp4',note:'Stock-footage visual study · AI and motion workflow'}
];
const serviceCards = [
  { title: 'Cinematic Films', note: 'Trailers · Teasers · Story edits', image: DEMO_SHOWCASE[0].image, number: '01' },
  { title: 'Wedding & Celebrations', note: 'Weddings · Birthdays · Event highlights', image: DEMO_SHOWCASE[1].image, number: '02' },
  { title: 'Reels & Shorts', note: 'Hooks · Vertical edits · Social content', image: DEMO_SHOWCASE[3].image, number: '03' },
  { title: 'YouTube & Podcasts', note: 'Videos · Podcasts · Interviews · News edits', image: DEMO_SHOWCASE[4].image, number: '04' },
  { title: 'Brand Promotions', note: 'Products · Ads · Business films', image: DEMO_SHOWCASE[5].image, number: '05' },
  { title: 'AI Video Creation', note: 'AI visuals · Concepts · Motion', image: DEMO_SHOWCASE[6].image, number: '06' }
];

const sampleProjects: PortfolioItem[] = DEMO_SHOWCASE.map((item, index) => ({
  id: 'sample-' + item.id,
  title: item.title,
  category: item.category,
  description: item.description + ' Sample visual direction only; replace with an original MAP132 edit.',
  kind: 'image',
  url: item.image,
  source: 'other'
}));

function safeLink(value: string) {
  const raw = value.trim();
  if (!raw) return '';
  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw.replace(/^\/+/, '');
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function socialLink(value: string, platform: 'instagram' | 'youtube' | 'facebook' | 'telegram' | 'linkedin') {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || /^(www\.)?(instagram|youtube|facebook|t\.me|linkedin)\.com\//i.test(raw)) return safeLink(raw);
  const handle = raw.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  if (!handle || /\s/.test(handle)) return '';
  const bases = {
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/@',
    facebook: 'https://www.facebook.com/',
    telegram: 'https://t.me/',
    linkedin: 'https://www.linkedin.com/in/'
  };
  return bases[platform] + handle;
}
function mediaEmbed(item: PortfolioItem) {
  const url = item.url || item.mediaUrl || '';
  if (item.source === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    return match ? 'https://www.youtube-nocookie.com/embed/' + match[1] : '';
  }
  if (item.source === 'drive') {
    const match = url.match(/\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
    return match ? 'https://drive.google.com/file/d/' + match[1] + '/preview' : '';
  }
  return '';
}
function ProjectPreview({ item }: { item: PortfolioItem }) {
  const src = item.mediaUrl || safeLink(item.url || '');
  const embed = mediaEmbed(item);
  if (embed) return <iframe className="ms-project-media" src={embed} title={item.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  if (item.kind === 'video' && src) return <video className="ms-project-media" src={src} controls playsInline preload="metadata" />;
  if (item.kind === 'image' && src) return <img className="ms-project-media" src={src} alt={item.title} loading="lazy" />;
  return <div className="ms-project-empty"><Play size={24}/><span>PROJECT PREVIEW</span></div>;
}

export default function HomeSlider({ content }: { content: HomeContent }) {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || window.innerWidth > 760) return;
    const activeButton = nav.querySelector<HTMLElement>('.ms-nav button.active');
    if (!activeButton) return;
    const targetLeft = activeButton.offsetLeft + activeButton.offsetWidth / 2 - nav.clientWidth / 2;
    const maxScroll = nav.scrollWidth - nav.clientWidth;
    nav.scrollTo({ left: Math.max(0, Math.min(targetLeft, maxScroll)), behavior: 'smooth' });
  }, [active]);
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let observer: ResizeObserver | null = null;
    const update = () => {
      observer?.disconnect();
      observer = null;
      if (window.innerWidth <= 760) {
        setStageHeight(null);
        return;
      }
      const page = stage.querySelectorAll<HTMLElement>('.ms-page')[active];
      if (!page) return;
      const measure = () => setStageHeight(Math.ceil(page.scrollHeight));
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(page);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [active, content.items, content.skills]);
  const [activePreview, setActivePreview] = useState<number | null>(null);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryBusy, setEnquiryBusy] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const previewGesture = useRef<{ x: number; y: number; pointerId?: number } | null>(null);
  const changePreview = (direction: number) => setActivePreview(current => current === null ? null : (current + direction + previewVideos.length) % previewVideos.length);
  const pointerStart = useRef<{ x: number; y: number; pointerId: number; atHomeTop: boolean } | null>(null);
  const suppressSwipeClick = useRef(false);
  const wheelTotal = useRef(0);
  const wheelLocked = useRef(false);
  const p = content.profile;
  const whatsappDigits = p.whatsapp.replace(/\D/g, '');
  const whatsapp = whatsappDigits.length === 10 ? '91' + whatsappDigits : whatsappDigits;
  const whatsappUrl = whatsapp ? 'https://wa.me/' + whatsapp : '';
  const goTo = (index: number) => setActive(Math.max(0, Math.min(pages.length - 1, index)));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activePreview !== null) {
        if (event.key === 'ArrowRight') { event.preventDefault(); changePreview(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); changePreview(-1); }
        if (event.key === 'Escape') setActivePreview(null);
        return;
      }
      if (event.key === 'ArrowRight') goTo(active + 1);
      if (event.key === 'ArrowLeft') goTo(active - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, activePreview]);

  // Pointer Events unify real finger and stylus gestures; pan-y keeps native vertical scrolling.
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const target = event.target as HTMLElement;
    // Keep native interaction/vertical scrolling for controls, but allow horizontal page swipes
    // from the Contact page's non-interactive areas (page 5 must swipe back to page 4).
    if (target.closest('input, textarea, select, video, iframe, button:not(.ms-service-tile), a')) return;
    const page = target.closest('.ms-page') as HTMLElement | null;
    // Do not capture touch pointers: native vertical scrolling must remain available inside each page.
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      atHomeTop: active === 0 && !!page && page.scrollTop <= 2,
    };
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.atHomeTop && dy > 110 && dy > Math.abs(dx) * 1.3) {
      window.location.reload();
      return;
    }
    const direction = getHorizontalSwipeDirection(dx, dy, 38, 1.2);
    if (direction !== 0) {
      suppressSwipeClick.current = true;
      goTo(active + direction);
      window.setTimeout(() => { suppressSwipeClick.current = false; }, 450);
    }
  };
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressSwipeClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressSwipeClick.current = false;
  };
  const onWheel = (event: WheelEvent<HTMLElement>) => {
    // Trackpads report horizontal gestures as deltaX; ordinary vertical scrolling is untouched.
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15 || Math.abs(event.deltaX) < 2) return;
    event.preventDefault();
    if (wheelLocked.current) return;
    wheelTotal.current += event.deltaX;
    if (Math.abs(wheelTotal.current) >= 58) {
      goTo(active + (wheelTotal.current > 0 ? 1 : -1));
      wheelTotal.current = 0;
      wheelLocked.current = true;
      window.setTimeout(() => { wheelLocked.current = false; }, 520);
    }
  };

  const contactLinks = [
    { label: 'WhatsApp', href: whatsappUrl, icon: <MessageCircle size={16}/> },
    { label: 'Instagram', href: socialLink(p.instagram, 'instagram'), icon: <Instagram size={16}/> },
    { label: 'YouTube', href: socialLink(p.youtube, 'youtube'), icon: <Youtube size={16}/> },
    { label: 'Facebook', href: socialLink(p.facebook, 'facebook'), icon: <Facebook size={16}/> },
    { label: 'Telegram', href: socialLink(p.telegram, 'telegram'), icon: <Send size={16}/> },
    { label: 'LinkedIn', href: socialLink(p.linkedin, 'linkedin'), icon: <Linkedin size={16}/> },
    { label: 'Email', href: p.email ? 'mailto:' + p.email : '', icon: <Mail size={16}/> }
  ].filter(link => link.href);

  return <div className="map132-slider-site">
    <header className="ms-header">
      <a className="ms-brand" href="#top" onClick={e => { e.preventDefault(); goTo(0); }}>
        <img src="/resources/logo-removebg-preview.png" alt="MAP132 DIGITALS"/>
        <span><b>MAP132</b><small>DIGITALS · VIDEO EDITING</small></span>
      </a>
      <nav ref={navRef} className="ms-nav" aria-label="Main navigation">
        {pages.map((page, index) => <button key={page} type="button" className={active === index ? 'active' : ''} aria-current={active === index ? 'page' : undefined} onClick={() => goTo(index)}>{page}</button>)}
      </nav>
    </header>

    <main ref={stageRef} style={stageHeight ? { height: stageHeight + "px" } : undefined} className="ms-stage" aria-label="MAP132 DIGITALS portfolio slider" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }} onClickCapture={onClickCapture} onWheel={onWheel}>
      <div className="ms-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        <section className="ms-page ms-home-page" aria-label="Home">
          <div className="ms-home-copy">
            <p className="ms-kicker"><i/> INDEPENDENT VIDEO EDITING STUDIO</p>
            <h1>{p.headline || 'Every frame has a story.'}</h1>
            <p className="ms-intro">{p.intro || 'Cinematic edits. Powerful stories. Visuals that stay with you.'}</p>
            <div className="ms-home-actions">
              <button type="button" className="ms-primary" onClick={() => goTo(1)}>Explore our work <ArrowRight size={16}/></button>
              <button type="button" className="ms-text-button" onClick={() => goTo(4)}>Start a project <ArrowRight size={15}/></button>
            </div>
            <div className="ms-home-proof"><span>01 / STORY</span><span>02 / VISUAL RHYTHM</span><span>03 / SOUND DESIGN</span></div>

          </div>
          <div className="ms-home-showcase">
            <div className="ms-showcase-top"><span>WHAT WE CAN CREATE</span><span>MAP132 / 01—06</span></div>
            <div className="ms-service-bento">
              {serviceCards.map((card, index) => <button type="button" key={card.title} aria-label={`Play ${card.title} sample video`} title={`Play ${card.title} sample video`} className={index === 0 ? 'ms-service-tile ms-service-featured' : 'ms-service-tile'} onClick={() => setActivePreview(index)} style={{ backgroundImage: `linear-gradient(180deg, #090b0e08 5%, #090b0edb 100%), url("${card.image}")` }}>
                <span>{card.number}</span><b>{card.title}</b><small>{card.note}</small>
              </button>)}
            </div>
            <p className="ms-showcase-foot">Tap any showcase tile to play its sample video here — no page navigation.</p>
          </div>
            <section className="ms-home-review-feed" aria-label="Client feedback demo feed">
              <div className="ms-review-feed-heading"><div><span>CLIENT LOVE / FEEDBACK FEED</span><b>Kind words. Creative stories.</b></div><span className="ms-demo-label">DEMO REVIEWS</span></div>
              <div className="ms-review-feed-grid">
                <article className="ms-review-card"><div className="ms-review-stars" aria-label="Five stars">★★★★★</div><p>“The teaser felt cinematic and captured the mood we wanted. Every shot flowed beautifully.”</p><div className="ms-review-by"><span>W</span><div><b>Wedding Teaser</b><small>Sample review · Demo content</small></div></div></article>
                <article className="ms-review-card"><div className="ms-review-stars" aria-label="Five stars">★★★★★</div><p>“The reel was crisp, engaging and perfectly paced for social media. Loved the final look.”</p><div className="ms-review-by"><span>B</span><div><b>Brand Reel</b><small>Sample review · Demo content</small></div></div></article>
                <article className="ms-review-card"><div className="ms-review-stars" aria-label="Five stars">★★★★★</div><p>“The storytelling and sound design gave our video a polished, professional finish.”</p><div className="ms-review-by"><span>Y</span><div><b>YouTube Edit</b><small>Sample review · Demo content</small></div></div></article>
              </div>
              <div className="ms-review-feed-foot"><span>Illustrative sample feedback — replace with verified client reviews before public promotion.</span><button type="button" onClick={() => goTo(4)}>Share your project <ArrowRight size={15}/></button></div>
            </section>
        </section>

        <section className="ms-page ms-work-page" aria-label="Selected work">
          <div className="ms-page-heading"><div><p className="ms-kicker">PORTFOLIO / VISUAL STUDIES</p><h2>Selected <em>work.</em></h2></div><p>Explore sample edits and original projects published through the Admin Dashboard.</p></div>
          <div className="ms-project-grid">{(content.items.length > 0 ? content.items : sampleProjects).map(item => <article className="ms-project-card" key={item.id}><div className="ms-project-frame"><ProjectPreview item={item}/><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
          {content.items.length === 0 && <div className="ms-sample-banner"><Sparkles size={18}/><p><b>Sample portfolio content</b><span>These are reference concepts and moodboard images—not completed client projects. Upload your own edited videos or photos in the Admin Dashboard to replace these examples.</span></p></div>}
          <DemoShowcase/>
        </section>

        <section className="ms-page ms-services-page" aria-label="Services">
          <div className="ms-page-heading"><div><p className="ms-kicker">SERVICES / MADE FOR YOUR STORY</p><h2>One studio.<br/><em>Many ways to tell it.</em></h2></div><p>Choose the format that fits your idea. Every project starts with a clear purpose and a simple conversation.</p></div>
          <div className="ms-services-grid">
            {serviceCards.map((card, index) => <article className="ms-service-detail" key={card.title}><span>{card.number} / SERVICE</span><div className="ms-service-detail-image" style={{backgroundImage:`linear-gradient(180deg,transparent,#080a0de8),url("${card.image}")`}}/><h3>{card.title}</h3><p>{['Story-led teaser cuts, cinematic trailers and mood-driven short films.','Wedding films, birthday invitations, event highlights, couple entries and celebration montages.','Fast hooks, captions, beat cuts and vertical edits for Instagram, YouTube Shorts and social platforms.','YouTube videos, vlogs, tutorials, podcast episodes, interviews, explainers and news packages.','Product showcases, launch promos, service ads and social campaign videos.','AI-assisted concepts, generated visual sequences and creative motion treatments.'][index]}</p></article>)}
          </div>
          <div className="ms-services-note"><Sparkles size={17}/> Also available: motion titles, logo reveals, lyric videos and custom editing support.</div>
          <div className="ms-service-includes"><div><span>EDITING DETAILS</span><b>Story-led cuts</b><p>Structure, pacing and a clear beginning-to-end flow.</p></div><div><span>VISUAL FINISH</span><b>Titles & colour</b><p>Readable typography, colour treatment and clean transitions.</p></div><div><span>SOUND FINISH</span><b>Music & audio</b><p>Dialogue balance, music placement and sound effects where suitable.</p></div><div><span>FINAL FILES</span><b>Platform formats</b><p>Export format and resolution agreed for your intended platform.</p></div></div>
          <div className="ms-service-bottom"><div><b>Have a specific brief?</b><span>Share your footage, reference style and delivery format.</span></div><button type="button" className="ms-primary" onClick={() => goTo(4)}>Discuss your project <ArrowRight size={16}/></button></div>
        </section>

        <section className="ms-page ms-studio-page" aria-label="Studio">
          <div className="ms-page-heading"><div><p className="ms-kicker">THE MAP132 APPROACH</p><h2>Story first.<br/><em>Details matter.</em></h2></div><p>{p.about || 'We shape raw footage into purposeful visual stories through editing, rhythm, colour, motion and sound.'}</p></div>
          <div className="ms-process-grid">
            {['Brief & references','Rough cut','Visual polish','Final delivery'].map((step,index)=><article key={step}><span>0{index+1}</span><h3>{step}</h3><p>{['Share your footage, target platform, sample style and delivery date.','Select the strongest moments and shape the story before effects.','Add titles, transitions, colour treatment, captions and motion where useful.','Balance dialogue, music and effects, then export in the agreed format.'][index]}</p></article>)}
          </div>
          <div className="ms-skills"><div><p className="ms-kicker">TOOLS & CREATIVE CRAFT</p><h3>Made frame by frame.</h3></div><div className="ms-skill-list">{content.skills.map((skill,index)=><span key={skill}>{String(index+1).padStart(2,'0')} · {skill}</span>)}</div></div>
          <div className="ms-studio-extra">
            <article><span>DELIVERY / 01</span><h3>Platform-ready exports.</h3><p>Vertical 9:16 reels, square 1:1 posts and widescreen 16:9 videos, prepared for the destination platform.</p></article>
            <article><span>CRAFT / 02</span><h3>More than transitions.</h3><p>Clean cuts, typography, motion accents, colour finishing, captions and sound design chosen to serve the story.</p></article>
            <article><span>COLLABORATION / 03</span><h3>Clear review rounds.</h3><p>Start with a brief and references, review a draft, share focused feedback and approve the final export.</p></article>
          </div>
          <div className="ms-studio-brief">
            <div><p className="ms-kicker">A GOOD PROJECT STARTS WITH A CLEAR BRIEF</p><h3>What to share with the editor.</h3></div>
            <div className="ms-brief-points"><span><b>01</b> Your raw footage, photos or script</span><span><b>02</b> One or two style references</span><span><b>03</b> Platform, aspect ratio and deadline</span><span><b>04</b> Any names, logos or text to include</span></div>
          </div>
          <div className="ms-studio-foot"><span><Camera size={15}/> {p.location || 'India'}</span><span>MAP132 DIGITALS · VIDEO EDITING</span></div>
        </section>

        <section className="ms-page ms-contact-page" aria-label="Contact">
          <div className="ms-contact-copy"><p className="ms-kicker">LET'S CREATE SOMETHING MEMORABLE</p><h2>Your idea.<br/><em>Our next frame.</em></h2><p>Tell us what you want to create. Share a few details and continue through WhatsApp or email.</p>
            <div className="ms-contact-links">{contactLinks.length > 0 ? contactLinks.map(link => <a key={link.label} href={link.href} target={link.label === 'Email' ? undefined : '_blank'} rel="noreferrer">{link.icon}{link.label}</a>) : <p className="ms-contact-empty">Social and business contact links will appear here after you add them in Admin Dashboard.</p>}</div>
            <div className="ms-contact-steps"><span><b>01</b> Tell us your idea</span><span><b>02</b> Share footage and references</span><span><b>03</b> Confirm scope and timeline</span></div>
          </div>
          <div className="ms-contact-panel ms-film-enquiry">
            <div className="ms-film-enquiry-heading"><span>PROJECT ENQUIRY / FRAME 01</span><Film size={19}/></div>
            {enquirySubmitted ? <div className="ms-enquiry-success" role="status"><div className="ms-enquiry-success-icon"><Check size={27}/></div><h3>Enquiry received.</h3><p>Your project brief has been saved to the MAP132 DIGITALS enquiry inbox. We’ll review the details and follow up using the contact information you provided.</p><button type="button" className="ms-primary" onClick={() => {setEnquirySubmitted(false);setEnquiryError('');}}>Send another enquiry <ArrowRight size={16}/></button></div> :
            <form onSubmit={async event => {event.preventDefault();setEnquiryBusy(true);setEnquiryError('');const form=event.currentTarget;const data=new FormData(form);try{await api.post('/api/enquiries',{name:data.get('name'),email:data.get('email'),phone:data.get('phone'),service:data.get('service'),details:data.get('details')});setEnquirySubmitted(true);form.reset();}catch(error){setEnquiryError(error instanceof Error?error.message:'Could not submit enquiry. Please try again.');}finally{setEnquiryBusy(false);}}}>
              <label>Your name<input name="name" required maxLength={120} placeholder="Your name"/></label>
              <div className="ms-form-row"><label>Email<input name="email" type="email" required maxLength={254} placeholder="you@example.com"/></label><label>Phone<input name="phone" required maxLength={40} placeholder="+91…"/></label></div>
              <label>Service needed<select name="service" required defaultValue=""><option value="" disabled>Choose a service</option>{serviceCards.map(card=><option key={card.title}>{card.title}</option>)}<option>Motion titles / Logo reveal</option><option>Other project</option></select></label>
              <label>Project details<textarea name="details" rows={3} required maxLength={4000} placeholder="Tell us about the video, style and deadline…"/></label>
              {enquiryError&&<p className="ms-enquiry-error" role="alert">{enquiryError}</p>}
              <button className="ms-primary ms-enquiry-submit" type="submit" disabled={enquiryBusy}>{enquiryBusy?'Submitting…':'Submit Enquiry'} <Send size={16}/></button>
            </form>}
            <small>Submitted directly on this website. Your enquiry is saved in the protected Admin Dashboard inbox.</small>
          </div>
        </section>
      </div>
    </main>

    {activePreview !== null && <div className="ms-preview-modal" role="dialog" aria-modal="true" aria-label={serviceCards[activePreview].title + ' video preview'} onClick={() => setActivePreview(null)}>
      <div className="ms-preview-dialog" onClick={event => event.stopPropagation()} onPointerDown={event => { if (event.pointerType !== 'touch' && event.pointerType !== 'pen' && event.pointerType !== 'mouse') return; if ((event.target as HTMLElement).closest('button, input')) return; event.currentTarget.setPointerCapture(event.pointerId); previewGesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; }} onPointerUp={event => { const start = previewGesture.current; previewGesture.current = null; if (!start || start.pointerId !== event.pointerId) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; const direction = getHorizontalSwipeDirection(dx, dy, event.pointerType === 'mouse' ? 55 : 42, 1.15); if (direction !== 0) changePreview(direction); }} onPointerCancel={() => { previewGesture.current = null; }} onWheel={event => { if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15 || Math.abs(event.deltaX) < 2) return; event.preventDefault(); if (wheelLocked.current) return; wheelTotal.current += event.deltaX; if (Math.abs(wheelTotal.current) >= 58) { changePreview(wheelTotal.current > 0 ? 1 : -1); wheelTotal.current = 0; wheelLocked.current = true; window.setTimeout(() => { wheelLocked.current = false; }, 520); } }}>
        <div className="ms-preview-dialog-head"><div><span>MAP132 DIGITALS / SHOWCASE PREVIEW</span><h2>{serviceCards[activePreview].title}</h2></div><button type="button" className="ms-preview-close" aria-label="Close video" onClick={() => setActivePreview(null)}><X size={22}/></button></div>
        <div className="ms-preview-stage">
          <video key={activePreview} className="ms-preview-player" src={previewVideos[activePreview].src} controls autoPlay playsInline preload="metadata">Your browser does not support video playback.</video>
          <span className="ms-preview-swipe-hint ms-preview-swipe-left" aria-hidden="true"><ArrowLeft size={25}/></span>
          <span className="ms-preview-swipe-hint ms-preview-swipe-right" aria-hidden="true"><ArrowRight size={25}/></span>
        </div>
        <div className="ms-preview-count">{String(activePreview + 1).padStart(2, '0')} / {String(previewVideos.length).padStart(2, '0')}</div>
        <p className="ms-preview-disclaimer">{previewVideos[activePreview].note}. Swipe left/right for more videos · Reference footage only — not a commissioned MAP132 client project.</p>
      </div>
    </div>}
    <div className="ms-controls">
      <button type="button" className="ms-arrow" aria-label="Previous page" onClick={() => goTo(active - 1)} disabled={active === 0}><ArrowLeft size={19}/></button>
      <div className="ms-pagination">{pages.map((page,index)=><button type="button" key={page} className={active===index?'active':''} aria-label={page} aria-current={active===index?'page':undefined} onClick={() => goTo(index)}><span>{String(index+1).padStart(2,'0')}</span></button>)}</div>
      <span className="ms-current-label">{String(active+1).padStart(2,'0')} <i>/</i> {String(pages.length).padStart(2,'0')} · {pages[active]}</span>
      <button type="button" className="ms-arrow ms-next" aria-label="Next page" onClick={() => goTo(active + 1)} disabled={active === pages.length - 1}><ArrowRight size={19}/></button>
    </div>
    <footer className="ms-footer"><span>© {new Date().getFullYear()} MAP132 DIGITALS</span><a className="ms-studio-link" href="/workspace.html" aria-label="Open Editor Workspace" title="Editor Workspace">EDITOR WORKSPACE <span aria-hidden="true">↗</span></a></footer>
  </div>;
}
