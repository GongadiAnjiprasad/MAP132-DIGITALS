import { useEffect, useState } from 'react';
import { api } from './api';
import {
  ArrowDownRight, ArrowRight, Check, ChevronRight, Film,
  Instagram, MessageCircle, Play, Plus, Save, ShieldCheck, Sparkles,
  Trash2, Upload, Video, X, Youtube, Camera, WandSparkles, ExternalLink
} from 'lucide-react';
import { MonitorPlay } from 'lucide-react';

type Item = {
  id: string; title: string; category: string; description: string;
  kind: 'video' | 'image' | 'link'; url?: string; path?: string;
  mediaUrl?: string; source?: 'upload' | 'youtube' | 'drive' | 'other';
};
type Content = {
  profile: {
    name: string; headline: string; intro: string; about: string; location: string;
    seasonalEffect: 'gold' | 'snow' | 'petals' | 'diya' | 'none';
    whatsapp: string; instagram: string; youtube: string; email: string; facebook: string; telegram: string; linkedin: string;
  };
  skills: string[];
  items: Item[];
};
const defaults: Content = {
  profile: {
    name: 'MAP132 DIGITALS', headline: 'Every frame has a story.',
    intro: 'Cinematic edits. Powerful stories. Visuals that stay with you.',
    about: 'I turn raw footage into purposeful visual stories through thoughtful editing, rhythm, colour, motion and sound.',
    location: 'India', seasonalEffect: 'none', whatsapp: '', instagram: '', youtube: '', email: '', facebook: '', telegram: '', linkedin: ''
  },
  skills: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Cinematic Editing', 'Colour Grading', 'Motion Graphics', 'Sound Design', 'Storytelling'],
  items: []
};
const categories = ['Cinematic Films','Wedding & Events','Birthday Films','Reels & Shorts','YouTube Videos','Brand Promotions','AI Video Creation','Other Projects'];
function safeLink(value: string) {
  if (!value) return '';
  try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function embedUrl(item: Item) {
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
function PortfolioMedia({ item }: { item: Item }) {
  const src = item.mediaUrl || safeLink(item.url || '');
  const embed = embedUrl(item);
  if (embed) return <iframe className="work-media" src={embed} title={item.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  if (item.kind === 'video' && src) return <video className="work-media" src={src} controls preload="metadata" />;
  if (item.kind === 'image' && src) return <img className="work-media" src={src} alt={item.title} loading="lazy" />;
  return <div className="work-placeholder"><Play size={25} /><span>PROJECT PREVIEW</span></div>;
}
function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? 'brand-logo compact' : 'brand-logo'} aria-label='MAP132 Video Editing'>
    <img src='/resources/MAP%20logo.png' alt='MAP132 DIGITALS logo' />
  </span>;
}
function downloadBrandLogo() {
  const link = document.createElement('a');
  link.href = '/resources/MAP%20logo.png';
  link.download = 'MAP132-DIGITALS-logo.png';
  link.click();
}
function TitleMotionStudio(){
 const [style,setStyle]=useState('Premium Golden'),[ratio,setRatio]=useState('16:9'),[quality,setQuality]=useState('1080p'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const styles=['Premium Golden','Epic Cinematic','Dark / Mysterious','Futuristic','Elegant / Emotional','Minimal / Modern'];
 async function render(){
  if(busy)return;if(!('MediaRecorder' in window)||!HTMLCanvasElement.prototype.captureStream){setMessage('Use current Chrome or Edge to render.');return;}
  setBusy(true);setMessage('Rendering 5.5-second MAP132 intro…');let audio:AudioContext|null=null,raf=0;
  try{
   const h=quality==='720p'?720:quality==='1080p'?1080:2160,dims:Record<string,[number,number]>={'16:9':[Math.round(h*16/9),h],'9:16':[h,Math.round(h*16/9)],'1:1':[h,h]},[w,hh]=dims[ratio];
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=hh;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable.');
   const logo=new Image();logo.src='/resources/MAP%20logo.png';await new Promise<void>((ok,no)=>{logo.onload=()=>ok();logo.onerror=()=>no(new Error('Transparent logo upload is still pending.'));});
   audio=new AudioContext();await audio.resume();const out=audio.createMediaStreamDestination(),stream=new MediaStream([...canvas.captureStream(30).getVideoTracks(),...out.stream.getAudioTracks()]);
   const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm',rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:quality==='4K'?18000000:9000000}),chunks:BlobPart[]=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   const palettes=[['#D7A45F','#FFE8B7','#17100A'],['#D45A39','#FFD18C','#090D16'],['#66517E','#D7C5F2','#08070D'],['#397DB0','#C7ECFF','#071522'],['#B78090','#FFE3D5','#21161D'],['#A7A7A7','#FFFFFF','#111318']],pal=palettes[styles.indexOf(style)],start=performance.now(),duration=5500;
   function draw(now:number){const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3),bg=ctx!.createLinearGradient(0,0,w,hh);bg.addColorStop(0,pal[2]);bg.addColorStop(.5,pal[0]+'33');bg.addColorStop(1,pal[2]);ctx!.fillStyle=bg;ctx!.fillRect(0,0,w,hh);ctx!.save();ctx!.globalAlpha=Math.min(1,ease*1.3);ctx!.translate(w/2,hh/2);ctx!.scale(.8+.2*ease,.8+.2*ease);const sc=Math.min(w*.76/logo.width,hh*.66/logo.height),lw=logo.width*sc,lh=logo.height*sc;ctx!.shadowColor=pal[0];ctx!.shadowBlur=w*.018;ctx!.drawImage(logo,-lw/2,-lh/2,lw,lh);ctx!.restore();ctx!.globalAlpha=.5;ctx!.strokeStyle=pal[1];ctx!.lineWidth=Math.max(1,w*.001);ctx!.beginPath();ctx!.moveTo(w*.12,hh*.82);ctx!.lineTo(w*(.12+.76*ease),hh*.82);ctx!.stroke();ctx!.globalAlpha=1;if(t<1)raf=requestAnimationFrame(draw)}
   draw(start);const buf=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.4;
   const noise=audio.createBufferSource();noise.buffer=buf;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(160,audio.currentTime);filter.frequency.exponentialRampToValueAtTime(style==='Futuristic'?4800:2800,audio.currentTime+1);
   const gain=audio.createGain();gain.gain.setValueAtTime(.001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.18,audio.currentTime+.3);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1.8);noise.connect(filter);filter.connect(gain);gain.connect(out);noise.start();
   const osc=audio.createOscillator(),boom=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(90,audio.currentTime+.3);osc.frequency.exponentialRampToValueAtTime(35,audio.currentTime+1.7);boom.gain.setValueAtTime(.001,audio.currentTime);boom.gain.setValueAtTime(.25,audio.currentTime+.3);boom.gain.exponentialRampToValueAtTime(.001,audio.currentTime+2);osc.connect(boom);boom.connect(out);osc.start();osc.stop(audio.currentTime+2.1);
   rec.start();await new Promise<void>((ok,no)=>{rec.onerror=()=>no(new Error('Render failed. Try 720p.'));rec.onstop=()=>ok();window.setTimeout(()=>{if(rec.state!=='inactive')rec.stop()},duration)});
   cancelAnimationFrame(raf);const blob=new Blob(chunks,{type:rec.mimeType||'video/webm'});if(!blob.size)throw new Error('No video data.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MAP132-'+style.replace(/[^a-z0-9]+/gi,'-')+'-'+ratio.replace(':','x')+'-'+quality+'.webm';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),4000);setMessage('Downloaded 5.5-second WebM logo intro with original synthesized sound.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not render intro.')}finally{cancelAnimationFrame(raf);if(audio)await audio.close().catch(()=>{});setBusy(false)}
 }
 return <section className="motion-lab logo-intro-builder"><div className="motion-lab-head"><div><p className="kicker">PRIVATE STUDIO TOOL · 5.5 SECOND EXPORT</p><h2>Logo <em>intro builder.</em></h2><p>Choose a visual treatment and export the original MAP132 logo with original synthesized sound. Rendering happens on this device.</p></div><span className="lab-stamp">MAP132<br/>INTRO / 01</span></div>
 <div className="motion-lab-grid"><div className="title-preview"><small>LIVE LOGO PREVIEW</small><img src="/resources/MAP%20logo.png" alt="MAP132 logo preview"/><i>MAP132 / VIDEO EDITING</i><span className="preview-time">00:00:05:15</span></div>
 <div className="motion-controls"><span className="control-label">INTRO STYLE</span><div className="style-choices intro-style-choices">{styles.map((x,i)=><button type="button" key={x} className={style===x?'chosen':''} onClick={()=>setStyle(x)}><b>0{i+1}</b><span>{x}</span></button>)}</div>
 <div className="intro-export-options"><label>ASPECT RATIO<select value={ratio} onChange={e=>setRatio(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label>RESOLUTION<select value={quality} onChange={e=>setQuality(e.target.value)}><option>720p</option><option>1080p</option><option>4K</option></select></label></div>
 <button className="gold-button render-title" onClick={render} disabled={busy}><Film size={17}/>{busy?'Rendering…':'Render & download logo intro'} <ArrowDownRight size={17}/></button><p className="render-note">{message||'5.5 seconds · 16:9 / 9:16 / 1:1 · 720p / 1080p / 4K · WebM + original sound'}</p></div></div></section>;
}
function WebsiteIntro(){
  return null;
}
function IndianFestivalAtmosphere(){
  return null;
}
function PublicSite({ content }: { content: Content }) {
  const [activeSkill,setActiveSkill] = useState(0);
  const p = content.profile;
  const wa = p.whatsapp.replace(/[^\d]/g, '');
  const whatsappUrl = wa ? 'https://wa.me/' + wa : '';
  return <div className="site">
    <IndianFestivalAtmosphere />
    <WebsiteIntro />
    <header className="nav">
      <a className="wordmark" href="#top"><BrandLogo/></a>
      <nav><a href="#work">Work</a><a href="#services">Services</a><a href="#skills">Toolkit</a><a href="#about">About</a><a className="nav-workspace" href="#workspace"><Film size={14}/> Private Editor Workspace</a><a className="nav-hire" href="#contact">Let’s talk <ArrowRight size={15}/></a></nav>
    </header>
    <main>
      <section className="hero" id="top">
        <div className="hero-noise"></div><div className="hero-copy">
          <p className="kicker"><i/> MAP132 DIGITALS · VIDEO EDITING STUDIO</p>
          <h1>{p.headline.split(' ').slice(0,-2).join(' ')} <em>{p.headline.split(' ').slice(-2).join(' ')}</em></h1>
          <p className="hero-intro">{p.intro}</p>
          <div className="hero-actions"><a className="gold-button" href="#work">View selected work <ArrowRight size={16}/></a><a className="quiet-link" href="#contact">Start a project <ArrowDownRight size={16}/></a></div>
          <div className="hero-meta"><span>EDIT WITH PURPOSE</span><span>CRAFTED FRAME BY FRAME</span></div>
        </div>
        <div className="hero-visual" aria-label="Cinematic video editing visual">
          <div className="visual-orbit orbit-a"></div><div className="visual-orbit orbit-b"></div>
          <div className="monitor"><div className="monitor-bar"><span>MAP DIGITALS / POST PRODUCTION</span><span className="rec">● CREATIVE STUDIO</span></div><div className="monitor-screen emblem-screen"><div className="emblem-light"></div><div className="hero-emblem" role="img" aria-label="MAP132 DIGITALS official logo"><img src="/resources/MAP%20logo.png" alt="MAP132 DIGITALS logo" /></div><span className="screen-timecode">EST. CREATIVE / FRAME BY FRAME</span></div><div className="timeline-editor"><div className="timeline-ruler"><span>00:00</span><span>00:08</span><span>00:16</span><span>00:24</span><span>00:32</span></div><div className="timeline-lane"><i/><i/><i/><i/></div><div className="timeline-lane audio"><i/></div></div><div className="monitor-foot"><span>4K · 24 FPS</span><span>STORY / CUT / SOUND</span></div></div>
          <span className="float-note note-one">STORY FIRST</span><span className="float-note note-two"><Sparkles size={13}/> DETAIL MATTERS</span>
        </div>
        <div className="hero-index">01 <span>—</span> 04</div>
      </section>
      
      <section className="work-section" id="work"><div className="section-head"><div><p className="kicker">SELECTED PROJECTS</p><h2>Work that <em>speaks.</em></h2></div><p>A selection of edits, experiments and visual stories.</p></div>
        {content.items.length ? <div className="work-grid">{content.items.map((item) => <article className="work-card" key={item.id}><div className="media-frame"><PortfolioMedia item={item}/><span className="media-category">{item.category}</span></div><div className="work-caption"><div><h3>{item.title}</h3><p>{item.description}</p></div><ArrowDownRight size={20}/></div></article>)}</div> : <div className="visual-concepts"><div className="concept-intro"><span className="concept-kicker">VISUAL DIRECTION / 01</span><h3>Stories deserve<br/><em>to be seen.</em></h3><p>These are visual style concepts, not completed client projects. Your own edits will replace them as you add work to the portfolio.</p></div><article className="concept-card concept-trailer"><div className="concept-art"><span className="concept-orbit"></span><span className="concept-number">01</span><strong>THE<br/>FINAL<br/><em>FRAME</em></strong><small>CINEMATIC TRAILER / STYLE STUDY</small></div><div className="concept-caption"><b>Trailer & teaser</b><span>DRAMA · RHYTHM · SOUND</span></div></article><article className="concept-card concept-reel"><div className="concept-art"><span className="concept-number">02</span><div className="reel-sun"></div><strong>MAKE<br/>IT <em>MOVE.</em></strong><small>SHORT-FORM / STYLE STUDY</small></div><div className="concept-caption"><b>Reels & Shorts</b><span>PACE · ENERGY · IMPACT</span></div></article><article className="concept-card concept-wedding"><div className="concept-art"><span className="concept-number">03</span><div className="wedding-glow"></div><strong>FOREVER<br/><em>IN FRAME.</em></strong><small>CELEBRATION FILM / STYLE STUDY</small></div><div className="concept-caption"><b>Wedding & event film</b><span>EMOTION · LIGHT · STORY</span></div></article></div>}
      </section>
      <section className="services-section" id="services">
        <div className="section-head">
          <div><p className="kicker">WHAT I DO · VIDEO EDITING SERVICES</p><h2>From raw footage<br/><em>to a visual story.</em></h2></div>
          <p>I edit videos for creators, brands and special moments — with the right pacing, transitions, colour and sound for every story.</p>
        </div>
        <div className="services-grid">
          <article className="service-card service-card-featured"><span className="service-number">01 / SOCIAL</span><div className="service-icon"><Play size={25}/></div><h3>Social Media Content</h3><p>Reels, Shorts, YouTube edits and platform-ready videos with strong hooks, captions and pacing.</p><span className="service-tags">REELS · SHORTS · YOUTUBE</span></article>
          <article className="service-card"><span className="service-number">02 / AI CREATION</span><div className="service-icon"><Sparkles size={25}/></div><h3>AI Video Production</h3><p>AI-assisted concepts, generated scenes and visual storytelling shaped into polished videos.</p><span className="service-tags">AI VISUALS · CONCEPTS · EDITING</span></article>
          <article className="service-card"><span className="service-number">03 / CINEMATIC</span><div className="service-icon"><Film size={25}/></div><h3>Cinematic Video Editing</h3><p>Trailers, teasers and story-led edits with motion, colour, transitions and layered sound design.</p><span className="service-tags">TRAILERS · TEASERS · FILMS</span></article>
          <article className="service-card"><span className="service-number">04 / CELEBRATIONS</span><div className="service-icon"><Camera size={25}/></div><h3>Wedding & Event Films</h3><p>Emotional highlights, wedding stories, birthdays and event recaps built around memorable moments.</p><span className="service-tags">WEDDINGS · BIRTHDAYS · EVENTS</span></article>
          <article className="service-card"><span className="service-number">05 / BUSINESS</span><div className="service-icon"><MonitorPlay size={25}/></div><h3>Commercial & Brand Videos</h3><p>Product showcases, business promotions and ad-style films that make a message clear and memorable.</p><span className="service-tags">BRANDS · ADS · PRODUCTS</span></article>
          <article className="service-card"><span className="service-number">06 / MUSIC & DESIGN</span><div className="service-icon"><WandSparkles size={25}/></div><h3>Music & Graphic Design</h3><p>Lyric videos, audio visualisers, motion posters, title cards and animated graphic treatments.</p><span className="service-tags">LYRICS · VISUALISERS · GRAPHICS</span></article>
        </div>
        
        <div className="edit-process"><span>MY EDITING WORKFLOW</span><div><b>01</b> Footage <i>→</i> <b>02</b> Story & cuts <i>→</i> <b>03</b> Motion & colour <i>→</i> <b>04</b> Sound & delivery</div></div>
        <a className="services-cta" href="#contact">Have a video idea? Let’s discuss it <ArrowRight size={16}/></a>
      </section>

      <section className="skills-section" id="skills"><div className="section-head"><div><p className="kicker">TOOLS · TECHNIQUE · TASTE</p><h2>Creative <em>toolkit.</em></h2></div><p>Explore the tools and craft behind every frame. Select a layer to see how it contributes to the final film.</p></div><div className="toolkit-stage"><div className="toolkit-stack">{content.skills.map((skill,i)=><button type="button" className={activeSkill===i?'tool-layer active':'tool-layer'} key={skill} onClick={()=>setActiveSkill(i)}><span>{String(i+1).padStart(2,'0')}</span><b>{skill}</b><ChevronRight size={17}/></button>)}</div><div className="toolkit-detail"><p className="kicker">SELECTED CREATIVE LAYER / {String(activeSkill+1).padStart(2,'0')}</p><h3>{content.skills[activeSkill]||'Creative craft'}</h3><p>{['Build a clean edit with intentional pacing, precise cuts and a story-first timeline.','Create titles, transitions, compositing and visual effects that add depth to a scene.','Shape contrast, skin tones and atmosphere so every shot feels part of the same world.','Use movement, typography and visual rhythm to make information feel cinematic.','Design layered sound, impacts and transitions that give every cut a stronger feeling.','Make every edit feel connected through timing, emotion and a clear visual point of view.'][activeSkill%6]}</p><div className="detail-tags"><span>CRAFT</span><span>PRECISION</span><span>STORY</span></div><div className="detail-footer"><span>MAP132 / POST PRODUCTION</span><span>3D LAYER ACTIVE</span></div></div></div><div className="skill-foot"><WandSparkles size={17}/> CONCEPT · EDIT · REFINE · DELIVER</div></section>
      <section className="about-section" id="about"><div className="about-label"><p className="kicker">BEHIND THE FRAMES</p><span>MAP / 2026</span></div><div><h2>Made with intent.<br/><em>Finished with feeling.</em></h2><p>{p.about}</p><span className="location-tag"><Camera size={15}/> {p.location}</span></div></section>
      <section className="contact-section" id="contact"><div className="contact-copy"><p className="kicker">MAP DIGITALS / LET'S WORK TOGETHER</p><h2>Let’s create<br/><em>something memorable.</em></h2><p>Share your video idea and project details. I’ll get back to you through the contact details you provide.</p><div className="contact-links">{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp</a>}{safeLink(p.instagram) && <a href={safeLink(p.instagram)} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a>}{safeLink(p.facebook) && <a href={safeLink(p.facebook)} target="_blank" rel="noreferrer">Facebook</a>}{safeLink(p.telegram) && <a href={safeLink(p.telegram)} target="_blank" rel="noreferrer">Telegram</a>}{safeLink(p.linkedin) && <a href={safeLink(p.linkedin)} target="_blank" rel="noreferrer">LinkedIn</a>}{safeLink(p.youtube) && <a href={safeLink(p.youtube)} target="_blank" rel="noreferrer"><Youtube size={17}/> YouTube</a>}{p.email && <a href={'mailto:'+p.email}>Email</a>}</div></div><div className="contact-panel"><span>PROJECT ENQUIRY FORM</span><form className="lead-form" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);const msg='MAP132 DIGITALS — PROJECT ENQUIRY\nName: '+d.get('name')+'\nEmail: '+d.get('email')+'\nPhone: '+d.get('phone')+'\nService: '+d.get('service')+'\nProject: '+d.get('details');if(whatsappUrl)window.open(whatsappUrl+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');else if(p.email)window.location.href='mailto:'+p.email+'?subject=MAP132%20DIGITALS%20Enquiry&body='+encodeURIComponent(msg);else alert('Add WhatsApp or business email in Admin → Social & contact first.')}}><label>Your name<input name="name" required placeholder="Your name"/></label><div className="lead-row"><label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Phone<input name="phone" required placeholder="+91…"/></label></div><label>Service needed<select name="service"><option>YouTube video editing</option><option>Reels & Shorts</option><option>Trailer / Teaser</option><option>Wedding / Event film</option><option>Brand / Promo video</option><option>AI Video Creation</option><option>Motion graphics / Logo reveal</option><option>Other Project</option></select></label><label>Project details<textarea name="details" rows={3} placeholder="Video length, deadline, preferred style…"/></label><button className="gold-button" type="submit">Send project enquiry <ArrowRight size={16}/></button></form><small>Opens WhatsApp or email with your details prefilled. The website does not store form submissions.</small></div></section>
    </main>
<footer className="site-footer"><a className="wordmark" href="#top"><BrandLogo/></a><p>Stories crafted frame by frame.</p><div><a href="#services">Services</a><a href="#work">Selected work</a><a href="#contact">Contact</a><a href="#workspace">Editor Workspace <ExternalLink size={12}/></a><span>© {new Date().getFullYear()} MAP132 DIGITALS</span></div></footer>
  </div>;
}
const workspaceResources = [
{section:'Brand Kit',title:'MAP132 logo assets',description:'The official MAP132 VIDEO EDITING identity. Use the transparent PNG on dark or light backgrounds; keep its proportions intact.',cards:[{id:'logo-transparent',title:'Official transparent logo',detail:'PNG · Transparent background · High resolution',tags:['Brand','Logo','PNG'],href:'/resources/MAP%20logo.png',action:'Download PNG',download:true}]},
{section:'Intro Library',title:'MAP132 logo intro videos',description:'Six agreed intro directions. Final exports are planned in 16:9, 9:16 and 1:1, at 720p, 1080p and 4K where supported. Only uploaded files will show a download action.',cards:[
{id:'intro-golden',title:'Premium Golden',detail:'Commercials · Brand identity · Luxury reveal',tags:['Commercial','Logo intro','Golden'],status:'Intro export not uploaded yet'},
{id:'intro-epic',title:'Epic Cinematic',detail:'Trailers · Teasers · Action edits',tags:['Trailer','Teaser','Cinematic'],status:'Intro export not uploaded yet'},
{id:'intro-dark',title:'Dark / Mysterious',detail:'Horror · Thriller · Suspense',tags:['Horror','Thriller','Dark'],status:'Intro export not uploaded yet'},
{id:'intro-future',title:'Futuristic',detail:'Sci-fi · AI visuals · Technology',tags:['Sci-Fi','AI','Futuristic'],status:'Intro export not uploaded yet'},
{id:'intro-elegant',title:'Elegant / Emotional',detail:'Wedding · Birthday · Events',tags:['Wedding','Birthday','Emotional'],status:'Intro export not uploaded yet'},
{id:'intro-minimal',title:'Minimal / Modern',detail:'Reels · Social · Clean brand graphics',tags:['Reels','Social','Minimal'],status:'Intro export not uploaded yet'}]},
{section:'Audio Library',title:'Music, Telugu BGM & cinematic SFX',description:'A separate audio workspace for trailer and teaser beds, emotional wedding music, suspense, sci-fi textures, commercial tracks and sound effects. Preview and download each item at its original provider; this workspace does not redistribute stock audio.',cards:[
{id:'youtube-audio',title:'YouTube Audio Library',provider:'YouTube Studio',detail:'Music + sound effects · Filter by genre, mood, duration and attribution · Preview and download in Studio',tags:['Trailer','Teaser','Horror','Sci-Fi','Wedding','Commercial','Telugu / Regional','SFX'],licence:'YouTube identifies its own Audio Library tracks as copyright-safe for YouTube; Creative Commons tracks require attribution. Check the track licence and platform scope.',href:'https://www.youtube.com/audiolibrary'},
{id:'mixkit-music',title:'Mixkit Music',provider:'Mixkit',detail:'Free stock music for edits, promos, social videos and creative projects',tags:['Trailer','Teaser','Wedding','Commercial','Cinematic'],licence:'Mixkit music has its own Free Licence and restrictions; it is not interchangeable with the SFX licence. Check the item type and terms.',href:'https://mixkit.co/free-stock-music/'},
{id:'mixkit-sfx',title:'Mixkit Sound Effects',provider:'Mixkit',detail:'Impacts, risers, whooshes, ambience, transitions and cinematic effects',tags:['Trailer','Teaser','Horror','Sci-Fi','SFX'],licence:'Mixkit SFX has a separate Free Licence. Commercial use is allowed within its terms; standalone redistribution is not.',href:'https://mixkit.co/free-sound-effects/'},
{id:'pixabay-music',title:'Pixabay Music',provider:'Pixabay',detail:'Search music by mood, genre and use case; preview and download on the source page',tags:['Trailer','Teaser','Wedding','Commercial','Telugu / Regional'],licence:'Pixabay permits many commercial uses under its Content License, subject to prohibited uses and third-party rights. Check each asset page.',href:'https://pixabay.com/music/'},
{id:'pixabay-sfx',title:'Pixabay Sound Effects',provider:'Pixabay',detail:'Browse ambience, cinematic hits, foley and transition sounds',tags:['Horror','Sci-Fi','Trailer','SFX'],licence:'Pixabay Content License applies; do not redistribute assets as standalone files and check third-party rights.',href:'https://pixabay.com/sound-effects/'}]},
{section:'Editing Assets',title:'LUTs, transitions, overlays & fonts',description:'A focused source shelf for post-production assets. Confirm file format, editor version, commercial terms and attribution before paid client use.',cards:[
{id:'adobe-stock-free',title:'Adobe Stock Free collection',provider:'Adobe',detail:'Free videos, templates, motion graphics templates, 3D assets and design resources',tags:['Video','Templates','Motion','3D'],licence:'Adobe states its free assets meet its Stock licensing standards; exclude editorial-only assets and review applicable terms.',href:'https://stock.adobe.com/free'},
{id:'mixkit-templates',title:'Mixkit Video Templates',provider:'Mixkit',detail:'Premiere Pro, After Effects and other video template collections',tags:['Premiere Pro','After Effects','Templates'],licence:'Check the licence for the exact item type and whether the template is Free or Restricted.',href:'https://mixkit.co/free-video-templates/'},
{id:'google-fonts',title:'Google Fonts',provider:'Google',detail:'Typography for titles, captions, posters and brand graphics',tags:['Fonts','Typography','Design'],licence:'Review the individual font licence; many Google Fonts use open-source licences.',href:'https://fonts.google.com/'}]},
{section:'My Collections',title:'Saved resources',description:'Your favourites from the private workspace appear here on this device.',cards:[]}];
function WorkspaceLibrary(){
const [section,setSection]=useState('Brand Kit'),[query,setQuery]=useState(''),[filter,setFilter]=useState('All');
const [favorites,setFavorites]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('map132-workspace-favorites')||'[]')}catch{return[]}});
useEffect(()=>{try{localStorage.setItem('map132-workspace-favorites',JSON.stringify(favorites))}catch{}},[favorites]);
const selected=workspaceResources.find(item=>item.section===section)||workspaceResources[0];
const sourceCards=section==='My Collections'?workspaceResources.flatMap(item=>item.cards).filter(card=>favorites.includes(card.id)):selected.cards;
const filters=section==='Audio Library'?['All','Trailer','Teaser','Horror','Sci-Fi','Wedding','Commercial','Telugu / Regional','SFX']:['All'];
const visible=sourceCards.filter(card=>(card.title+' '+(card.detail||'')+' '+(card.tags||[]).join(' ')+' '+(card.provider||'')).toLowerCase().includes(query.toLowerCase())&&(filter==='All'||(card.tags||[]).includes(filter)));
const toggleFavorite=(id:string)=>setFavorites(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
return <section className='admin-card workspace-card'><div className='workspace-heading'><div><p className='kicker'>PRIVATE · ADMIN ONLY</p><h2>Editor Workspace</h2><p className='admin-hint'>Your private post-production hub. Keep private assets here; the public client homepage stays focused on your work and services.</p></div><span className='workspace-secure'><ShieldCheck size={15}/> PRIVATE STUDIO</span></div>
<div className='workspace-tabs'>{workspaceResources.map(item=><button type='button' key={item.section} className={section===item.section?'active':''} onClick={()=>{setSection(item.section);setQuery('');setFilter('All')}}>{item.section}</button>)}</div>
<div className='workspace-library-panel'><div className='workspace-panel-top'><span className='workspace-index'>MAP132 / WORKSPACE</span><span>{section==='My Collections'?favorites.length+' SAVED':sourceCards.length+' RESOURCES'}</span></div><h3>{selected.title}</h3><p>{selected.description}</p>
{section==='Intro Library'&&<><div className='intro-format-note'><b>EXPORT TARGETS</b><span>16:9 · 9:16 · 1:1</span><span>720p · 1080p · 4K</span></div><TitleMotionStudio/></>}
<div className='workspace-tools'><label className='workspace-search'>SEARCH THIS LIBRARY<input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Search styles, assets or providers…'/></label>{filters.length>1&&<label className='workspace-filter'>FILTER BY MOOD / USE<select value={filter} onChange={e=>setFilter(e.target.value)}>{filters.map(x=><option key={x}>{x}</option>)}</select></label>}</div>
<div className='workspace-resource-grid'>{visible.map(card=><article className='workspace-resource-card' key={card.id}><div className='resource-card-top'><span>{card.provider||card.tags?.[0]||'MAP132'}</span><button type='button' className={favorites.includes(card.id)?'favorite-button saved':'favorite-button'} aria-label={favorites.includes(card.id)?'Remove from favourites':'Save to favourites'} onClick={()=>toggleFavorite(card.id)}>{favorites.includes(card.id)?'★':'☆'}</button></div><h4>{card.title}</h4><p>{card.detail}</p>{card.tags&&<div className='resource-tags'>{card.tags.slice(0,4).map(tag=><span key={tag}>{tag}</span>)}</div>}{card.licence&&<details className='resource-licence'><summary>Licence & usage notes</summary><p>{card.licence}</p></details>}{card.status&&<span className='resource-status'>{card.status}</span>}{card.href&&<a className='resource-open' href={card.href} target={card.href.startsWith('/')?'_self':'_blank'} rel='noreferrer' download={card.download||undefined}>{card.action||'Open & preview at source'} <ExternalLink size={13}/></a>}</article>)}{!visible.length&&<div className='workspace-empty'>{section==='My Collections'?'No saved resources yet. Tap ☆ on a resource to add it here.':'No matching resources. Try another search or filter.'}</div>}</div></div>
<div className='workspace-legal'><ShieldCheck size={17}/><p><b>Client-use licence check.</b> Save the original asset URL, item-specific licence, commercial/client-use rights, permitted platforms, attribution, expiry and dated proof of terms. A provider-wide statement is not proof for every individual asset.</p></div></section>;
}

function AdminApp() {
  const [loggedIn,setLoggedIn] = useState(false);
  const [checking,setChecking] = useState(true);
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  const [content,setContent] = useState<Content>(defaults);
  const [tab,setTab] = useState<'profile'|'skills'|'portfolio'|'social'|'workspace'>(window.location.hash === '#workspace' ? 'workspace' : 'portfolio');
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [title,setTitle] = useState('');
  const [category,setCategory] = useState(categories[0]);
  const [description,setDescription] = useState('');
  const [mediaUrl,setMediaUrl] = useState('');
  const [file,setFile] = useState<File|null>(null);
  const [source,setSource] = useState<'youtube'|'drive'|'other'>('youtube');
  const [uploading,setUploading] = useState(false);
  useEffect(()=>{ api.get('/api/admin/session').then(()=>setLoggedIn(true)).catch(()=>setLoggedIn(false)).finally(()=>setChecking(false)); },[]);
  useEffect(()=>{ if(loggedIn) api.get('/api/portfolio').then(r=>setContent(r.data.content || defaults)).catch(()=>setError('Could not load portfolio content.')); },[loggedIn]);
  async function login(e:React.FormEvent){e.preventDefault();setError('');try{await api.post('/api/admin/login',{password});setLoggedIn(true);setPassword('');}catch{setError('Password incorrect. Please try again.');}}
  async function save(next=content){setSaving(true);setError('');try{await api.put('/api/admin/content',next);setContent(next);setNotice('Changes saved and published.');setTimeout(()=>setNotice(''),3500);}catch{setError('Could not save changes. Please retry.');}finally{setSaving(false);}}
  async function addProject(e:React.FormEvent){e.preventDefault();setError('');let path='';let url=mediaUrl;let kind:Item['kind']=file?(file.type.startsWith('image/')?'image':'video'):(source==='other'?'video': 'link');
    if(file){if(file.size>3500000){setError('For direct upload, choose a file under 3.5 MB. Use a YouTube or Google Drive link for larger videos.');return;}setUploading(true);try{const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=reject;reader.readAsDataURL(file);});const result=await api.post('/api/admin/upload',{filename:file.name,contentType:file.type,base64:data});path=result.data.path;url='';}catch{setError('Upload failed. Try a smaller file or use an external link.');setUploading(false);return;}setUploading(false);}
    if(!file && !safeLink(mediaUrl)){setError('Enter a valid http or https media link.');return;}
    const item:Item={id:crypto.randomUUID(),title,category,description,kind,url,path,source:file?'upload':source};
    await save({...content,items:[item,...content.items]});setTitle('');setDescription('');setMediaUrl('');setFile(null);
  }
  async function removeItem(item:Item){if(!confirm('Delete this portfolio item?'))return;const next={...content,items:content.items.filter(x=>x.id!==item.id)};await save(next);if(item.path)api.post('/api/admin/delete-media',{path:item.path}).catch(()=>{});}
  async function logout(){try{await api.post('/api/admin/logout',{});}finally{setLoggedIn(false);window.location.hash='#top';}}
  if(checking)return <div className="admin-loading">Checking secure admin session…</div>;
  if(!loggedIn)return <div className="login-screen"><div className="login-card"><a className="wordmark" href="#top"><BrandLogo/></a><div className="login-icon"><ShieldCheck size={25}/></div><p className="kicker">PRIVATE STUDIO ACCESS</p><h1>Admin <em>Dashboard.</em></h1><p>Sign in to manage your portfolio, skills and contact links.</p><form onSubmit={login}><label>Admin password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password"/></label><button className="gold-button" type="submit">Secure sign in <ArrowRight size={16}/></button></form>{error&&<p className="error-text">{error}</p>}<a className="back-link" href="#top">← Back to website</a></div></div>;
  const updateProfile=(key:keyof Content['profile'],value:string)=>setContent(c=>({...c,profile:{...c.profile,[key]:value}}));
  return <div className="admin-shell"><aside className="admin-side"><a className="wordmark" href="#top"><BrandLogo/></a><p className="admin-eyebrow">STUDIO CONTROL</p>{(['portfolio','profile','skills','social','workspace'] as const).map(t=><button key={t} className={tab===t?'admin-nav active':'admin-nav'} onClick={()=>setTab(t)}>{t==='portfolio'?'Portfolio manager':t==='profile'?'Profile & about':t==='skills'?'Skills & tools':t==='social'?'Social & contact':'Editor Workspace'}<ChevronRight size={15}/></button>)}<div className="side-bottom"><a href="#top" target="_blank">View live website <ExternalLink size={13}/></a><button onClick={logout}>Sign out <X size={14}/></button></div></aside>
    <main className="admin-main"><div className="admin-top"><div><p className="kicker">MAP DIGITALS / CONTROL ROOM</p><h1>{tab==='portfolio'?'Portfolio manager':tab==='profile'?'Profile & about':tab==='skills'?'Skills & tools':tab==='social'?'Social & contact':'Editor Workspace'}</h1><p>Manage what visitors see on your public portfolio.</p></div><button className="save-button" onClick={()=>save()} disabled={saving}><Save size={16}/>{saving?'Saving…':'Save changes'}</button></div>
      {notice&&<div className="notice"><Check size={16}/>{notice}</div>}{error&&<div className="error-banner">{error}</div>}
      {tab==='portfolio'&&<div className="admin-content"><section className="admin-card"><div className="card-heading"><div><p className="kicker">ADD A NEW PROJECT</p><h2>Show your latest work.</h2></div><span className="count-pill">{content.items.length} PROJECTS</span></div><form className="admin-form" onSubmit={addProject}><div className="form-row"><label>Project title<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Cinematic wedding teaser"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div><label>Short description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What makes this edit special?"/></label><div className="source-switch"><button type="button" className={!file?'selected':''} onClick={()=>setFile(null)}>YouTube / Drive link</button><button type="button" className={file?'selected':''} onClick={()=>setMediaUrl('')}>Direct upload</button></div>{!file?<><div className="form-row"><label>Link type<select value={source} onChange={e=>setSource(e.target.value as typeof source)}><option value="youtube">YouTube</option><option value="drive">Google Drive</option><option value="other">Other video / image URL</option></select></label><label>Media URL<input required type="url" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} placeholder="https://…"/></label></div></>:<div className="upload-field"><Upload size={20}/><label>Selected file: {file.name}<input type="file" accept="video/mp4,image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><small>MP4, JPG, PNG, WebP · up to 3.5 MB per file</small></div>}<button className="gold-button" disabled={uploading||saving} type="submit"><Plus size={16}/>{uploading?'Uploading…':'Add to portfolio'}</button></form></section>
      <section className="admin-card"><div className="card-heading"><div><p className="kicker">PUBLISHED PROJECTS</p><h2>Portfolio library</h2></div></div>{content.items.length===0?<p className="empty-admin">No projects yet. Add your first edit above.</p>:content.items.map(item=><div className="admin-item" key={item.id}><div className="admin-thumb">{item.path?<Video size={19}/>:item.kind==='image'?<Camera size={19}/>:<Play size={19}/>}</div><div className="admin-item-info"><b>{item.title}</b><span>{item.category} · {item.source||'link'}</span></div><button className="delete-button" onClick={()=>removeItem(item)} aria-label={'Delete '+item.title}><Trash2 size={16}/></button></div>)}</section></div>}
      {tab==='profile'&&<section className="admin-card"><p className="kicker">YOUR CREATIVE IDENTITY</p><h2>Profile & about</h2><div className="admin-form"><label>Brand / display name<input value={content.profile.name} onChange={e=>updateProfile('name',e.target.value)}/></label><label>Hero headline<input value={content.profile.headline} onChange={e=>updateProfile('headline',e.target.value)}/></label><label>Short introduction<textarea rows={3} value={content.profile.intro} onChange={e=>updateProfile('intro',e.target.value)}/></label><label>About your editing approach<textarea rows={5} value={content.profile.about} onChange={e=>updateProfile('about',e.target.value)}/></label><label>Location<input value={content.profile.location} onChange={e=>updateProfile('location',e.target.value)}/></label></div><button className="gold-button" onClick={()=>save()}>Save profile <Save size={15}/></button></section>}
      {tab==='skills'&&<section className="admin-card"><p className="kicker">TOOLS · TECHNIQUE · TASTE</p><h2>Skills & software</h2><p className="admin-hint">One skill per line. These appear on your public website.</p><textarea className="skills-editor" rows={12} value={content.skills.join('\n')} onChange={e=>setContent(c=>({...c,skills:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}))}/><button className="gold-button" onClick={()=>save()}>Save skills <Save size={15}/></button></section>}
      {tab==='social'&&<section className="admin-card"><p className="kicker">CLIENT CONNECTIONS</p><h2>Social & contact links</h2><p className="admin-hint">Only configured links appear on the public website.</p><div className="admin-form"><label>WhatsApp number (with country code)<input value={content.profile.whatsapp} onChange={e=>updateProfile('whatsapp',e.target.value)} placeholder="91XXXXXXXXXX"/></label><label>Instagram profile URL<input type="url" value={content.profile.instagram} onChange={e=>updateProfile('instagram',e.target.value)} placeholder="https://instagram.com/…"/></label><label>Facebook page URL<input type="url" value={content.profile.facebook || ''} onChange={e=>updateProfile('facebook',e.target.value)} placeholder="https://facebook.com/…"/></label><label>Telegram link<input type="url" value={content.profile.telegram || ''} onChange={e=>updateProfile('telegram',e.target.value)} placeholder="https://t.me/…"/></label><label>LinkedIn profile URL<input type="url" value={content.profile.linkedin || ''} onChange={e=>updateProfile('linkedin',e.target.value)} placeholder="https://linkedin.com/in/…"/></label><label>YouTube channel URL<input type="url" value={content.profile.youtube} onChange={e=>updateProfile('youtube',e.target.value)} placeholder="https://youtube.com/@…"/></label><label>Business email<input type="email" value={content.profile.email} onChange={e=>updateProfile('email',e.target.value)} placeholder="hello@example.com"/></label></div><button className="gold-button" onClick={()=>save()}>Save contact links <Save size={15}/></button></section>}
      {tab==='workspace'&&<WorkspaceLibrary/>}
      <p className="admin-footnote"><ShieldCheck size={15}/> Admin changes are saved to the website content store. Keep your password private.</p>
    </main></div>;
}
export default function App() {
  const [isAdmin,setIsAdmin] = useState(window.location.hash === '#admin' || window.location.hash === '#workspace');
  const [content,setContent] = useState<Content>(defaults);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    const syncRoute = () => setIsAdmin(window.location.hash === '#admin' || window.location.hash === '#workspace');
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  },[]);
  useEffect(()=>{if(!isAdmin)api.get('/api/portfolio').then(r=>setContent(r.data.content||defaults)).catch(()=>{}).finally(()=>setLoading(false));},[isAdmin]);
  if(isAdmin)return <AdminApp/>;
  return loading?<div className="site-loading">Preparing the next frame…</div>:<PublicSite content={content}/>;
}