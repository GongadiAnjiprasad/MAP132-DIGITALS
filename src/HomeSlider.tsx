import { useEffect, useRef, useState, type PointerEvent, type WheelEvent, type MouseEvent, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, Check, Film, Instagram, Mail, MessageCircle,
  Play, Sparkles, Youtube, Facebook, Linkedin, Send, X, Sun, Moon
} from 'lucide-react';
import { api } from './api';
import { getHorizontalSwipeDirection } from './swipeGesture';
import { DEMO_SHOWCASE } from './demoShowcase';
import { useAmbientServiceTheme, type ServiceThemeKey } from './modules/ambient-service-themes/useAmbientServiceTheme';
import { getFeedbackHighlights } from './modules/feedback/feedbackHighlights';
import { formatFeedbackTimestamp } from './modules/feedback/feedbackTimestamp';

type PortfolioItem = {
  id: string; title: string; category: string; description: string;
  kind: 'video' | 'image' | 'link'; url?: string; mediaUrl?: string;
  source?: 'upload' | 'youtube' | 'drive' | 'other';
};
type PublicReview = {id:string;kind:'Website Experience'|'Work feedback';service:string;rating:number;message:string;response?:string;responseType?:string;createdAt:string};
type HomeContent = {
  profile: {
    name: string; headline: string; intro: string; about: string; location: string;
    whatsapp: string; instagram: string; youtube: string; email: string;
    facebook: string; telegram: string; linkedin: string;
  };
  skills: string[];
  items: PortfolioItem[];
  logoUrl?: string;
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
  { title: 'Cinematic Films', note: 'Trailers · Teasers · Story edits', image: DEMO_SHOWCASE[0].image, number: '01', theme: 'cinematic' },
  { title: 'Wedding & Celebrations', note: 'Weddings · Birthdays · Event highlights', image: DEMO_SHOWCASE[1].image, number: '02', theme: 'celebrations' },
  { title: 'Reels & Shorts', note: 'Hooks · Vertical edits · Social content', image: DEMO_SHOWCASE[3].image, number: '03', theme: 'reels' },
  { title: 'YouTube & Podcasts', note: 'Videos · Podcasts · Interviews · News edits', image: DEMO_SHOWCASE[4].image, number: '04', theme: 'youtube' },
  { title: 'Brand Promotions', note: 'Products · Ads · Business films', image: DEMO_SHOWCASE[5].image, number: '05', theme: 'advertising' },
  { title: 'AI Video Creation', note: 'AI visuals · Concepts · Motion', image: DEMO_SHOWCASE[6].image, number: '06', theme: 'ai' }
];

const workCategoryCards = [
  { id: 'Cinematic Trailers', description: 'Movie-style edits, teasers and dramatic visual stories.', pattern: /cinematic|film|trailer/i },
  { id: 'Wedding / B’Day', description: 'Wedding highlights, birthday films and special moments.', pattern: /wedding|birthday|celebration|event/i },
  { id: 'Advertisements', description: 'Brand promotions, product showcases and ad films.', pattern: /brand|advert|commercial|product/i },
  { id: 'AI Services', description: 'AI-powered visuals, generated scenes and creative edits.', pattern: /\bai\b|artificial|futur/i },
  { id: 'Insta Reels', description: 'Vertical reels, short-form edits and social-first videos.', pattern: /reel|short|instagram/i },
  { id: 'YouTube Related', description: 'YouTube videos, creator edits and channel content.', pattern: /youtube|podcast|interview|creator|news/i }
];

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

export default function HomeSlider({ content, feedbackWidget }: { content: HomeContent; feedbackWidget?: ReactNode }) {
  const logoUrl = content.logoUrl === '/resources/Logo.png' ? '/resources/Logo.webp' : content.logoUrl || '/resources/Logo.webp';
  const [active, setActive] = useState(0);
  const [activeProjectCategory, setActiveProjectCategory] = useState<string | null>(null);
  const [activeProjectPage, setActiveProjectPage] = useState(1);
  const [publicReviews,setPublicReviews] = useState<PublicReview[]>([]);
  const [reviewCategory,setReviewCategory] = useState<'Website Experience'|'Video Editing Service'>('Video Editing Service');
  useEffect(()=>{
    let active=true;
    const refresh=()=>{if(document.visibilityState==='hidden')return;api.get('/api/reviews').then(r=>{if(active)setPublicReviews(Array.isArray(r.data.reviews)?r.data.reviews:[]);}).catch(()=>{});};
    refresh();
    const timer=window.setInterval(refresh,30000);
    const onFocus=()=>refresh();
    document.addEventListener('visibilitychange',onFocus);
    window.addEventListener('focus',onFocus);
    return()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',onFocus);window.removeEventListener('focus',onFocus);};
  },[]);
  const hasVideoReviews=publicReviews.some(review=>review.kind!=='Website Experience');
  const hasWebsiteReviews=publicReviews.some(review=>review.kind==='Website Experience');
  const visibleHomeReviews=publicReviews.filter(review=>review.kind==='Website Experience'?reviewCategory==='Website Experience':reviewCategory==='Video Editing Service');
  const reviewSwipeStart=useRef<{x:number;y:number;pointerId:number}|null>(null);
  const onReviewPointerDown=(event:PointerEvent<HTMLElement>)=>{
    if((event.pointerType!=='touch'&&event.pointerType!=='pen')||!hasVideoReviews||!hasWebsiteReviews)return;
    const target=event.target as HTMLElement;
    if(target.closest('button,a,input,textarea,select'))return;
    reviewSwipeStart.current={x:event.clientX,y:event.clientY,pointerId:event.pointerId};
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* pointer capture may be unavailable */}
  };
  const onReviewPointerUp=(event:PointerEvent<HTMLElement>)=>{
    const start=reviewSwipeStart.current;reviewSwipeStart.current=null;
    if(!start||start.pointerId!==event.pointerId)return;
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* capture may already be released */}
    const direction=getHorizontalSwipeDirection(event.clientX-start.x,event.clientY-start.y,44,1.15);
    if(direction!==0)setReviewCategory(direction>0?'Website Experience':'Video Editing Service');
  };
  const ambientTheme = useAmbientServiceTheme();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return window.localStorage.getItem('map132-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('map132-theme', theme);
    } catch {
      // The theme still works for this visit when browser storage is unavailable.
    }
  }, [theme]);
  const [desktopArrowsVisible, setDesktopArrowsVisible] = useState(true);
  const arrowHideTimer = useRef<number | null>(null);
  useEffect(() => {
    if (window.innerWidth <= 760) return;
    const scheduleHide = () => {
      if (arrowHideTimer.current !== null) window.clearTimeout(arrowHideTimer.current);
      arrowHideTimer.current = window.setTimeout(() => setDesktopArrowsVisible(false), 2600);
    };
    const revealAndReschedule = () => {
      setDesktopArrowsVisible(true);
      scheduleHide();
    };
    scheduleHide();
    window.addEventListener('pointermove', revealAndReschedule, { passive: true });
    window.addEventListener('pointerdown', revealAndReschedule, { passive: true });
    window.addEventListener('keydown', revealAndReschedule);
    return () => {
      if (arrowHideTimer.current !== null) window.clearTimeout(arrowHideTimer.current);
      window.removeEventListener('pointermove', revealAndReschedule);
      window.removeEventListener('pointerdown', revealAndReschedule);
      window.removeEventListener('keydown', revealAndReschedule);
    };
  }, []);
  const stageRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const workPageRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || window.innerWidth > 760) return;
    const activeButton = nav.querySelector<HTMLElement>('.ms-nav button.active');
    if (!activeButton) return;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const targetLeft = nav.scrollLeft + buttonRect.left - navRect.left + buttonRect.width / 2 - nav.clientWidth / 2;
    const maxScroll = nav.scrollWidth - nav.clientWidth;
    nav.scrollTo({ left: Math.max(0, Math.min(targetLeft, maxScroll)), behavior: 'smooth' });
  }, [active]);
  const [activePreview, setActivePreview] = useState<number | null>(null);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryBusy, setEnquiryBusy] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const previewGesture = useRef<{ x: number; y: number; pointerId?: number } | null>(null);
  const changePreview = (direction: number) => { ambientTheme.clearPlayback('preview-modal'); setActivePreview(current => current === null ? null : (current + direction + previewVideos.length) % previewVideos.length); };
  const closePreview = () => { ambientTheme.clearPlayback('preview-modal'); setActivePreview(null); };
  // Modal unmount can race the media element's pause event; clear playback accent on close too.
  useEffect(() => {
    if (activePreview === null) ambientTheme.clearPlayback('preview-modal');
  }, [activePreview, ambientTheme.clearPlayback]);
  const pointerStart = useRef<{ x: number; y: number; pointerId: number; atHomeTop: boolean; target: HTMLElement } | null>(null);
  const suppressSwipeClick = useRef(false);
  const swipeClickTarget = useRef<HTMLElement | null>(null);
  const wheelTotal = useRef(0);
  const wheelLocked = useRef(false);
  const selectedWorkItems = activeProjectCategory === null ? [] : content.items.filter(item => activeProjectCategory === 'All Projects' || Boolean(workCategoryCards.find(category => category.id === activeProjectCategory)?.pattern.test(item.category)));
  const projectsPerPage = 6;
  const selectedWorkPageCount = Math.max(1, Math.ceil(selectedWorkItems.length / projectsPerPage));
  const paginatedWorkItems = selectedWorkItems.slice((activeProjectPage - 1) * projectsPerPage, activeProjectPage * projectsPerPage);
  const selectWorkCategory = (category: string) => { setActiveProjectCategory(category); setActiveProjectPage(1); };
  useEffect(() => { if (activeProjectPage > selectedWorkPageCount) setActiveProjectPage(selectedWorkPageCount); }, [activeProjectPage, selectedWorkPageCount]);
  const p = content.profile;
  const whatsappDigits = p.whatsapp.replace(/\D/g, '');
  const whatsapp = whatsappDigits.length === 10 ? '91' + whatsappDigits : whatsappDigits;
  const whatsappUrl = whatsapp ? 'https://wa.me/' + whatsapp : '';
  const goTo = (index: number) => { window.dispatchEvent(new Event('map132-page-change')); setActive(Math.max(0, Math.min(pages.length - 1, index))); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activePreview !== null) {
        if (event.key === 'ArrowRight') { event.preventDefault(); changePreview(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); changePreview(-1); }
        if (event.key === 'Escape') closePreview();
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
    if (target.closest('.ms-home-review-feed')) return;
    if (target.closest('input, textarea, select, video, iframe, button:not(.ms-service-tile):not(.work-category-tab):not(.all-work-filter), a')) return;
    const page = target.closest('.ms-page') as HTMLElement | null;
    // Do not capture touch pointers: native vertical scrolling must remain available inside each page.
    // Capture the touch sequence on the stage so pointerup is still received
    // when the finger drifts beyond the original child/page boundary. CSS keeps
    // vertical pan native, while horizontal movement remains available to the slider.
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* browser may already own the pointer */ }
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      atHomeTop: active === 0 && !!page && page.scrollTop <= 2,
      target,
    };
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch { /* pointer capture may have been released by the browser */ }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.atHomeTop && dy > 110 && dy > Math.abs(dx) * 1.3) {
      window.location.reload();
      return;
    }
    const direction = getHorizontalSwipeDirection(dx, dy, 44, 1.15);
    if (direction !== 0) {
      // Suppress only the synthetic click generated on the element that received
      // the swipe. Do not swallow the visitor's next navigation/category tap.
      suppressSwipeClick.current = true;
      swipeClickTarget.current = start.target;
      goTo(active + direction);
      window.setTimeout(() => {
        suppressSwipeClick.current = false;
        swipeClickTarget.current = null;
      }, 250);
    }
  };
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressSwipeClick.current) return;
    const swipeTarget = swipeClickTarget.current;
    const clickTarget = event.target as Node;
    if (!swipeTarget || (clickTarget !== swipeTarget && !swipeTarget.contains(clickTarget))) return;
    event.preventDefault();
    event.stopPropagation();
    suppressSwipeClick.current = false;
    swipeClickTarget.current = null;
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
    { label: 'YouTube', href: socialLink(p.youtube || 'https://youtube.com/@map132digitals?si=4tSF4nERwaC-mf7k', 'youtube'), icon: <Youtube size={16}/> },
    { label: 'Facebook', href: socialLink(p.facebook, 'facebook'), icon: <Facebook size={16}/> },
    { label: 'Telegram', href: socialLink(p.telegram, 'telegram'), icon: <Send size={16}/> },
    { label: 'LinkedIn', href: socialLink(p.linkedin, 'linkedin'), icon: <Linkedin size={16}/> },
    { label: 'Email', href: p.email ? 'mailto:' + p.email : '', icon: <Mail size={16}/> }
  ].filter(link => link.href);

  return <div data-theme={theme} data-ambient-playback={ambientTheme.isPlaying ? "true" : "false"} style={ambientTheme.style} className={`map132-slider-site ${desktopArrowsVisible ? "" : "ms-nav-arrows-hidden"}`}>
    <header className="ms-header">
      <a className="ms-brand" href="#top" onClick={e => { e.preventDefault(); goTo(0); }}>
        <img src={logoUrl} alt="MAP132 DIGITALS" onError={event => { if (logoUrl === '/resources/Logo.webp') event.currentTarget.src = '/resources/Logo.png'; }}/>
        <span><b>MAP132</b><small>DIGITALS · VIDEO EDITING</small></span>
      </a>
      <nav ref={navRef} className="ms-nav" aria-label="Main navigation">
        {pages.map((page, index) => <button key={page} type="button" className={active === index ? (index === 0 ? 'active ms-home-active' : 'active') : ''} aria-current={active === index ? 'page' : undefined} onClick={() => goTo(index)}>{page}</button>)}
      </nav>
      <button
        type="button"
        className="ms-theme-toggle"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-pressed={theme === 'light'}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
        <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>
    </header>

    <main ref={stageRef} className="ms-stage" aria-label="MAP132 DIGITALS portfolio slider" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }} onClickCapture={onClickCapture} onWheel={onWheel}>
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
              {serviceCards.map((card, index) => <button type="button" key={card.title} data-service-theme={card.theme} aria-label={`Play ${card.title} sample video`} title={`Play ${card.title} sample video`} className={index === 0 ? 'ms-service-tile ms-service-featured' : 'ms-service-tile'} onPointerEnter={() => ambientTheme.preview(card.theme)} onPointerLeave={ambientTheme.clearPreview} onFocus={() => ambientTheme.preview(card.theme)} onBlur={ambientTheme.clearPreview} onClick={() => { ambientTheme.pin(card.theme); setActivePreview(index); }} ><img src={card.image} alt="" aria-hidden="true" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" />
                <span>{card.number}</span><b>{card.title}</b><small>{card.note}</small>
              </button>)}
            </div>
            <p className="ms-showcase-foot">Tap any showcase tile to play its sample video here — no page navigation.</p>
          </div>
            <section className="ms-home-review-feed ms-live-feedback-feed" aria-label="Client feedback feed" onPointerDown={onReviewPointerDown} onPointerUp={onReviewPointerUp} onPointerCancel={()=>{reviewSwipeStart.current=null;}}>
              <div className="ms-review-feed-heading"><div><span>CLIENT LOVE / FEEDBACK FEED</span><b>Kind words. Creative stories.</b></div><span className="ms-live-label"><i/> LIVE REVIEWS</span></div>
              <div className="ms-review-tabs" role="group" aria-label="Feedback category">
                <button type="button" className={reviewCategory==='Video Editing Service'?'active':''} aria-pressed={reviewCategory==='Video Editing Service'} onClick={()=>setReviewCategory('Video Editing Service')}>Video Editing Service</button>
                <button type="button" className={reviewCategory==='Website Experience'?'active':''} aria-pressed={reviewCategory==='Website Experience'} onClick={()=>setReviewCategory('Website Experience')}>Website Experience</button>
              </div>
              {visibleHomeReviews.length>0?<div className="ms-review-feed-grid" aria-live="polite">
                {visibleHomeReviews.slice(0,3).map(review=><article className="ms-review-card ms-live-review-card" key={review.id}>
                  <div className="ms-review-stars" aria-label={review.rating+' out of 5 stars'}>{'★'.repeat(Math.max(0,Math.min(5,review.rating)))}</div>
                  <p>“{review.message}”</p>
                  {getFeedbackHighlights(review.message,review.kind).length>0&&<div className="feedback-keyword-tags" aria-label="Feedback highlights">{getFeedbackHighlights(review.message,review.kind).map(tag=><span key={tag}>{tag}</span>)}</div>}
                  <div className="ms-review-by"><span>{review.kind==='Website Experience'?'W':'M'}</span><div><b>{review.service || (review.kind==='Website Experience'?'Website Experience':'Video Editing Service')}</b><small>{review.kind==='Website Experience'?'Website Experience':'Video Editing Service'} · {formatFeedbackTimestamp(review.createdAt)}</small></div></div>
                  {review.response&&<div className="ms-brand-reply"><span>MAP132 DIGITALS REPLY</span><p>{review.response}</p></div>}
                </article>)}
              </div>:<div className="ms-review-empty" aria-live="polite"><b>No published feedback in this category yet.</b><span>Share your genuine experience and help us improve.</span></div>}
              <div className="ms-review-feed-foot"><span>{visibleHomeReviews.length} published {visibleHomeReviews.length===1?'review':'reviews'} · refreshes automatically</span></div>
            </section>
        </section>

        <section ref={workPageRef} className="ms-page ms-work-page" aria-label="Selected work">
          <div className="ms-page-heading"><div><p className="ms-kicker">PORTFOLIO / VISUAL STUDIES</p><h2>Choose your <em>work.</em></h2></div><p>Select the type of video you want to explore. Each category opens its matching projects and creative samples.</p></div>
          <div className="work-category-toolbar">
            <span>EXPLORE BY CATEGORY</span>
            <button type="button" className={activeProjectCategory === 'All Projects' ? 'all-work-filter active' : 'all-work-filter'} aria-pressed={activeProjectCategory === 'All Projects'} onClick={() => selectWorkCategory('All Projects')}>View all projects <ArrowRight size={14}/></button>
          </div>
          <div className="work-category-tabs" role="group" aria-label="Choose a project category">
            {workCategoryCards.map(category => {
              const count = content.items.filter(item => category.pattern.test(item.category)).length;
              return <button type="button" key={category.id} className={activeProjectCategory === category.id ? 'work-category-tab active' : 'work-category-tab'} aria-pressed={activeProjectCategory === category.id} onClick={() => selectWorkCategory(category.id)}>
                <span>{category.id}</span><small>{count} {count === 1 ? 'PROJECT' : 'PROJECTS'}</small>
              </button>;
            })}
          </div>
          {activeProjectCategory === null && <div className="ms-work-prompt"><Sparkles size={17}/><span>Select a category to display all matching videos here. Switch categories anytime using the tabs above.</span></div>}
          {activeProjectCategory !== null && <div className="ms-work-results-heading">
            <div><p className="ms-category-showcase-kicker">{activeProjectCategory === 'All Projects' ? 'COMPLETE PORTFOLIO' : 'CATEGORY GALLERY'}</p><h3>{activeProjectCategory}</h3></div>
            <span>{selectedWorkItems.length} {selectedWorkItems.length === 1 ? 'PROJECT' : 'PROJECTS'}</span>
          </div>}
          {activeProjectCategory !== null && paginatedWorkItems.length > 0 && <div className="ms-project-grid">{paginatedWorkItems.map(item => <article className="ms-project-card" key={item.id}><div className="ms-project-frame"><ProjectPreview item={item}/><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>}
          {activeProjectCategory !== null && selectedWorkItems.length === 0 && <div className="ms-sample-banner"><Sparkles size={18}/><p><b>{activeProjectCategory}</b><span>{activeProjectCategory === 'All Projects' ? 'No published projects yet. Add projects through the workspace to populate this gallery.' : 'No published projects in this category yet. Add matching projects through the workspace to populate this gallery.'}</span></p></div>}
          {activeProjectCategory !== null && selectedWorkItems.length > projectsPerPage && <nav className="ms-work-pagination" aria-label="Project gallery pages">
            <button type="button" onClick={() => setActiveProjectPage(page => Math.max(1, page - 1))} disabled={activeProjectPage === 1}><ArrowLeft size={14}/> Previous</button>
            <span>Page {activeProjectPage} of {selectedWorkPageCount}</span>
            <button type="button" onClick={() => setActiveProjectPage(page => Math.min(selectedWorkPageCount, page + 1))} disabled={activeProjectPage === selectedWorkPageCount}>Next <ArrowRight size={14}/></button>
          </nav>}
        </section>

        <section className="ms-page ms-services-page" aria-label="Services">
          <div className="ms-page-heading"><div><p className="ms-kicker">SERVICES / MADE FOR YOUR STORY</p><h2>One studio.<br/><em>Many ways to tell it.</em></h2></div><p>Choose the format that fits your idea. Every project starts with a clear purpose and a simple conversation.</p></div>
          <div className="ms-services-grid">
            {serviceCards.map((card, index) => <article className="ms-service-detail" key={card.title} data-service-theme={card.theme} tabIndex={0} onPointerEnter={() => ambientTheme.preview(card.theme)} onPointerLeave={ambientTheme.clearPreview} onFocus={() => ambientTheme.preview(card.theme)} onBlur={ambientTheme.clearPreview} onClick={() => ambientTheme.pin(card.theme)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ambientTheme.pin(card.theme); } }}><span>{card.number} / SERVICE</span><div className="ms-service-detail-image" style={{backgroundImage:`linear-gradient(180deg,transparent,#080a0de8),url("${card.image}")`}}/><h3>{card.title}</h3><p>{['Story-led teaser cuts, cinematic trailers and mood-driven short films.','Wedding films, birthday invitations, event highlights, couple entries and celebration montages.','Fast hooks, captions, beat cuts and vertical edits for Instagram, YouTube Shorts and social platforms.','YouTube videos, vlogs, tutorials, podcast episodes, interviews, explainers and news packages.','Product showcases, launch promos, service ads and social campaign videos.','AI-assisted concepts, generated visual sequences and creative motion treatments.'][index]}</p></article>)}
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
          {publicReviews.length>0&&<section className="ms-public-reviews" aria-label="Client reviews"><div className="ms-review-heading"><div><p className="ms-kicker">CLIENT VOICE</p><h3>Words that <em>stay with us.</em></h3></div><span>{publicReviews.length} PUBLISHED REVIEWS</span></div><div className="ms-review-grid">{publicReviews.map(review=><article className="ms-review-card" key={review.id}><div className="ms-review-stars" aria-label={review.rating+' out of 5 stars'}>{'★'.repeat(Math.max(0,Math.min(5,review.rating)))}</div><p>“{review.message}”</p>{getFeedbackHighlights(review.message,review.kind).length>0&&<div className="feedback-keyword-tags" aria-label="Feedback highlights">{getFeedbackHighlights(review.message,review.kind).map(tag=><span key={tag}>{tag}</span>)}</div>}<span>{review.service}</span></article>)}</div></section>}
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

    {activePreview !== null && <div className="ms-preview-modal" role="dialog" aria-modal="true" aria-label={serviceCards[activePreview].title + ' video preview'} onClick={closePreview}>
      <div className="ms-preview-dialog" onClick={event => event.stopPropagation()} onPointerDown={event => { if (event.pointerType !== 'touch' && event.pointerType !== 'pen' && event.pointerType !== 'mouse') return; if ((event.target as HTMLElement).closest('button, input')) return; event.currentTarget.setPointerCapture(event.pointerId); previewGesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; }} onPointerUp={event => { const start = previewGesture.current; previewGesture.current = null; if (!start || start.pointerId !== event.pointerId) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; const direction = getHorizontalSwipeDirection(dx, dy, event.pointerType === 'mouse' ? 55 : 42, 1.15); if (direction !== 0) changePreview(direction); }} onPointerCancel={() => { previewGesture.current = null; }} onWheel={event => { if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15 || Math.abs(event.deltaX) < 2) return; event.preventDefault(); if (wheelLocked.current) return; wheelTotal.current += event.deltaX; if (Math.abs(wheelTotal.current) >= 58) { changePreview(wheelTotal.current > 0 ? 1 : -1); wheelTotal.current = 0; wheelLocked.current = true; window.setTimeout(() => { wheelLocked.current = false; }, 520); } }}>
        <div className="ms-preview-dialog-head"><div><span>MAP132 DIGITALS / SHOWCASE PREVIEW</span><h2>{serviceCards[activePreview].title}</h2></div><button type="button" className="ms-preview-close" aria-label="Close video" onClick={closePreview}><X size={22}/></button></div>
        <div className="ms-preview-stage">
          <video key={activePreview} className="ms-preview-player" src={previewVideos[activePreview].src} controls autoPlay playsInline preload="metadata" onPlay={() => ambientTheme.setPlayback(serviceCards[activePreview].theme as ServiceThemeKey, 'preview-modal')} onPause={() => ambientTheme.clearPlayback('preview-modal')} onEnded={() => ambientTheme.clearPlayback('preview-modal')}>Your browser does not support video playback.</video>
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
    {feedbackWidget}
  </div>;
}
