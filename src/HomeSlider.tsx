import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, Film, Instagram, Mail, MessageCircle,
  Play, Sparkles, Youtube, Facebook, Linkedin, Send
} from 'lucide-react';
import DemoShowcase from './DemoShowcase';
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
const serviceCards = [
  { title: 'Cinematic Films', note: 'Trailers · Teasers · Story edits', image: DEMO_SHOWCASE[0].image, number: '01' },
  { title: 'Wedding & Events', note: 'Highlights · Emotional films', image: DEMO_SHOWCASE[1].image, number: '02' },
  { title: 'Birthday Films', note: 'Celebrations · Memories', image: DEMO_SHOWCASE[2].image, number: '03' },
  { title: 'Reels & Shorts', note: 'Hooks · Vertical edits · Social', image: DEMO_SHOWCASE[3].image, number: '04' },
  { title: 'YouTube Videos', note: 'Creator edits · Long-form stories', image: DEMO_SHOWCASE[4].image, number: '05' },
  { title: 'Brand Promotions', note: 'Products · Ads · Business films', image: DEMO_SHOWCASE[5].image, number: '06' },
  { title: 'AI Video Creation', note: 'AI visuals · Concepts · Motion', image: DEMO_SHOWCASE[6].image, number: '07' },
  { title: 'News & Podcasts', note: 'Interviews · Studio edits · Clips', image: DEMO_SHOWCASE[7].image, number: '08' }
];

function safeLink(value: string) {
  if (!value) return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
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
  const p = content.profile;
  const whatsapp = p.whatsapp.replace(/[^\d]/g, '');
  const whatsappUrl = whatsapp ? 'https://wa.me/' + whatsapp : '';
  const goTo = (index: number) => setActive(Math.max(0, Math.min(pages.length - 1, index)));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goTo(active + 1);
      if (event.key === 'ArrowLeft') goTo(active - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const contactLinks = [
    { label: 'WhatsApp', href: whatsappUrl, icon: <MessageCircle size={16}/> },
    { label: 'Instagram', href: safeLink(p.instagram), icon: <Instagram size={16}/> },
    { label: 'YouTube', href: safeLink(p.youtube), icon: <Youtube size={16}/> },
    { label: 'Facebook', href: safeLink(p.facebook), icon: <Facebook size={16}/> },
    { label: 'Telegram', href: safeLink(p.telegram), icon: <Send size={16}/> },
    { label: 'LinkedIn', href: safeLink(p.linkedin), icon: <Linkedin size={16}/> },
    { label: 'Email', href: p.email ? 'mailto:' + p.email : '', icon: <Mail size={16}/> }
  ].filter(link => link.href);

  return <div className="map132-slider-site">
    <header className="ms-header">
      <a className="ms-brand" href="#top" onClick={e => { e.preventDefault(); goTo(0); }}>
        <img src="/resources/logo-removebg-preview.png" alt="MAP132 DIGITALS"/>
        <span><b>MAP132</b><small>DIGITALS · VIDEO EDITING</small></span>
      </a>
      <nav className="ms-nav" aria-label="Main navigation">
        {pages.map((page, index) => <button key={page} type="button" className={active === index ? 'active' : ''} onClick={() => goTo(index)}>{page}</button>)}
        <a href="#workspace" className="ms-workspace"><Film size={14}/> Editor Workspace</a>
      </nav>
    </header>

    <main className="ms-stage" aria-label="MAP132 DIGITALS portfolio slider">
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
            <div className="ms-showcase-top"><span>WHAT WE CAN CREATE</span><span>MAP132 / 01—08</span></div>
            <div className="ms-service-bento">
              {serviceCards.map((card, index) => <button type="button" key={card.title} className={index === 0 ? 'ms-service-tile ms-service-featured' : 'ms-service-tile'} onClick={() => goTo(index === 0 ? 1 : 2)} style={{ backgroundImage: `linear-gradient(180deg, #090b0e08 5%, #090b0edb 100%), url("${card.image}")` }}>
                <span>{card.number}</span><b>{card.title}</b><small>{card.note}</small><i><ArrowRight size={14}/></i>
              </button>)}
            </div>
            <p className="ms-showcase-foot">A clear look at our creative range. Select a tile or use the arrows to explore.</p>
          </div>
        </section>

        <section className="ms-page ms-work-page" aria-label="Selected work">
          <div className="ms-page-heading"><div><p className="ms-kicker">PORTFOLIO / VISUAL STUDIES</p><h2>Selected <em>work.</em></h2></div><p>Explore sample edits and original projects published through the Admin Dashboard.</p></div>
          {content.items.length > 0 && <div className="ms-project-grid">{content.items.map(item => <article className="ms-project-card" key={item.id}><div className="ms-project-frame"><ProjectPreview item={item}/><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>}
          <DemoShowcase/>
        </section>

        <section className="ms-page ms-services-page" aria-label="Services">
          <div className="ms-page-heading"><div><p className="ms-kicker">SERVICES / MADE FOR YOUR STORY</p><h2>One studio.<br/><em>Many ways to tell it.</em></h2></div><p>Choose the format that fits your idea. Every project starts with a clear purpose and a simple conversation.</p></div>
          <div className="ms-services-grid">
            {serviceCards.map((card, index) => <article className="ms-service-detail" key={card.title}><span>{card.number} / SERVICE</span><div className="ms-service-detail-image" style={{backgroundImage:`linear-gradient(180deg,transparent,#080a0de8),url("${card.image}")`}}/><h3>{card.title}</h3><p>{card.note}. Thoughtful editing, clean pacing and sound shaped around your audience.</p></article>)}
          </div>
          <div className="ms-services-note"><Sparkles size={17}/> Also available: motion titles, logo reveals, lyric videos and custom editing support.</div>
        </section>

        <section className="ms-page ms-studio-page" aria-label="Studio">
          <div className="ms-page-heading"><div><p className="ms-kicker">THE MAP132 APPROACH</p><h2>Story first.<br/><em>Details matter.</em></h2></div><p>{p.about || 'We shape raw footage into purposeful visual stories through editing, rhythm, colour, motion and sound.'}</p></div>
          <div className="ms-process-grid">
            {['Discover the story','Shape the rhythm','Design the visuals','Finish with sound'].map((step,index)=><article key={step}><span>0{index+1}</span><h3>{step}</h3><p>{['Understand the message, audience and feeling behind the footage.','Build a clear edit with intentional cuts, pacing and flow.','Use typography, motion and colour to support the story.','Balance music, ambience and effects for a polished finish.'][index]}</p></article>)}
          </div>
          <div className="ms-skills"><div><p className="ms-kicker">TOOLS & CREATIVE CRAFT</p><h3>Made frame by frame.</h3></div><div className="ms-skill-list">{content.skills.map((skill,index)=><span key={skill}>{String(index+1).padStart(2,'0')} · {skill}</span>)}</div></div>
          <div className="ms-studio-foot"><span><Camera size={15}/> {p.location || 'India'}</span><span>MAP132 DIGITALS · VIDEO EDITING</span></div>
        </section>

        <section className="ms-page ms-contact-page" aria-label="Contact">
          <div className="ms-contact-copy"><p className="ms-kicker">LET'S CREATE SOMETHING MEMORABLE</p><h2>Your idea.<br/><em>Our next frame.</em></h2><p>Tell us what you want to create. Share a few details and continue through WhatsApp or email.</p>
            <div className="ms-contact-links">{contactLinks.map(link => <a key={link.label} href={link.href} target={link.label === 'Email' ? undefined : '_blank'} rel="noreferrer">{link.icon}{link.label}</a>)}</div>
          </div>
          <div className="ms-contact-panel"><span>PROJECT ENQUIRY</span>
            <form onSubmit={event => {event.preventDefault();const data=new FormData(event.currentTarget);const message='MAP132 DIGITALS — PROJECT ENQUIRY\nName: '+data.get('name')+'\nEmail: '+data.get('email')+'\nPhone: '+data.get('phone')+'\nService: '+data.get('service')+'\nProject: '+data.get('details');if(whatsappUrl)window.open(whatsappUrl+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');else if(p.email)window.location.href='mailto:'+p.email+'?subject=MAP132%20DIGITALS%20Enquiry&body='+encodeURIComponent(message);else window.alert('Please add WhatsApp or business email in Admin → Social & contact first.');}}>
              <label>Your name<input name="name" required placeholder="Your name"/></label>
              <div className="ms-form-row"><label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Phone<input name="phone" required placeholder="+91…"/></label></div>
              <label>Service needed<select name="service">{serviceCards.map(card=><option key={card.title}>{card.title}</option>)}<option>Motion titles / Logo reveal</option><option>Other project</option></select></label>
              <label>Project details<textarea name="details" rows={3} placeholder="Tell us about the video, style and deadline…"/></label>
              <button className="ms-primary" type="submit">Continue enquiry <ArrowRight size={16}/></button>
            </form>
            <small>Your details are prepared for WhatsApp or email; this form does not store submissions.</small>
          </div>
        </section>
      </div>
    </main>

    <div className="ms-controls">
      <button type="button" className="ms-arrow" aria-label="Previous page" onClick={() => goTo(active - 1)} disabled={active === 0}><ArrowLeft size={19}/></button>
      <div className="ms-pagination">{pages.map((page,index)=><button type="button" key={page} className={active===index?'active':''} aria-label={page} aria-current={active===index?'page':undefined} onClick={() => goTo(index)}><span>{String(index+1).padStart(2,'0')}</span></button>)}</div>
      <span className="ms-current-label">{String(active+1).padStart(2,'0')} <i>/</i> {String(pages.length).padStart(2,'0')} · {pages[active]}</span>
      <button type="button" className="ms-arrow ms-next" aria-label="Next page" onClick={() => goTo(active + 1)} disabled={active === pages.length - 1}><ArrowRight size={19}/></button>
    </div>
    <footer className="ms-footer"><span>© {new Date().getFullYear()} {p.name || 'MAP132 DIGITALS'}</span><span>EVERY FRAME HAS A STORY.</span><a href="#workspace">OPEN EDITOR WORKSPACE <ArrowRight size={12}/></a></footer>
  </div>;
}
