import { useEffect, useRef, useState } from 'react';
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
  resources?: WorkspaceEntry[];
};
type WorkspaceEntry = { id:string; title:string; category:string; detail:string; href:string; provider?:string; licence:string; tags:string[]; compatibility?:string; kind:'audio'|'video'|'image'|'template'|'font'|'other'; previewUrl?:string; downloadUrl?:string; };
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
  return <span className={compact ? 'brand-logo compact' : 'brand-logo'} aria-label='MAP132 DIGITALS'>
    <img src='/resources/logo-removebg-preview.png' alt='MAP132 DIGITALS logo' />
  </span>;
}
function downloadBrandLogo() {
  const link = document.createElement('a');
  link.href = '/resources/logo-removebg-preview.png';
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
   const logo=new Image();logo.src='/resources/logo-removebg-preview.png';await new Promise<void>((ok,no)=>{logo.onload=()=>ok();logo.onerror=()=>no(new Error('Transparent logo upload is still pending.'));});
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
 <div className="motion-lab-grid"><div className="title-preview"><small>LIVE LOGO PREVIEW</small><img src="/resources/logo-removebg-preview.png" alt="MAP132 logo preview"/><i>MAP132 / VIDEO EDITING</i><span className="preview-time">00:00:05:15</span></div>
 <div className="motion-controls"><span className="control-label">INTRO STYLE</span><div className="style-choices intro-style-choices">{styles.map((x,i)=><button type="button" key={x} className={style===x?'chosen':''} onClick={()=>setStyle(x)}><b>0{i+1}</b><span>{x}</span></button>)}</div>
 <div className="intro-export-options"><label>ASPECT RATIO<select value={ratio} onChange={e=>setRatio(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label>RESOLUTION<select value={quality} onChange={e=>setQuality(e.target.value)}><option>720p</option><option>1080p</option><option>4K</option></select></label></div>
 <button className="gold-button render-title" onClick={render} disabled={busy}><Film size={17}/>{busy?'Rendering…':'Render & download logo intro'} <ArrowDownRight size={17}/></button><p className="render-note">{message||'5.5 seconds · 16:9 / 9:16 / 1:1 · 720p / 1080p / 4K · WebM + original sound'}</p></div></div></section>;
}
function WebsiteIntro(){
  return null;
}
type Festival = { date: string; name: string; emoji: string; message: string; theme: 'diwali' | 'sun' | 'gold' | 'snow' };

// Verified India 2026 dates. Festival observances can vary by region/Panchang;
// keep this curated list explicit rather than silently guessing future lunar dates.
const MAP132_FESTIVALS: Festival[] = [
  { date: '2026-11-08', name: 'Diwali', emoji: '🪔 ✨ 🎆', message: 'May the light of Diwali bring happiness, peace and new beginnings to you and your family.', theme: 'diwali' },
  { date: '2026-11-15', name: 'Chhath Puja', emoji: '☀️ 🙏 🌅', message: 'Wishing you and your family health, harmony and prosperity. May the blessings of the Sun bring brighter days.', theme: 'sun' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', emoji: '🙏 ✨', message: 'May the teachings of kindness, equality and compassion guide us all. Warm wishes to you and your family.', theme: 'gold' },
  { date: '2026-12-25', name: 'Christmas', emoji: '🎄 ✨ 🎁', message: 'Wishing you a season filled with peace, joy and beautiful moments. Merry Christmas!', theme: 'snow' }
];

function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
function festivalDateLabel(key: string) {
  return new Date(key + 'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
}
function IndianFestivalAtmosphere(){
  const today = localDateKey();
  const todayFestival = MAP132_FESTIVALS.find(item => item.date === today);
  const nextFestival = MAP132_FESTIVALS.find(item => item.date > today);
  const festival = todayFestival || nextFestival;
  const [status,setStatus] = useState('');
  if (!festival) return null;
  const daysUntil = Math.round((new Date(festival.date+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000);
  const inFestivalWindow = daysUntil >= 0 && daysUntil <= 10;
  const advanceWishWindow = daysUntil >= 0 && daysUntil <= 2;
  if (!inFestivalWindow) return null;

  async function createPoster(share: boolean) {
    if (!festival) return;
    setStatus('Preparing your MAP132 greeting…');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Poster canvas is not available in this browser.');
      const palettes: Record<Festival['theme'],[string,string,string]> = {
        diwali: ['#100D12','#3A2118','#F4C477'],
        sun: ['#091923','#174B50','#F6C66C'],
        gold: ['#11131A','#29221B','#E8C77A'],
        snow: ['#101827','#203A50','#F4E9D4']
      };
      const [dark,mid,accent] = palettes[festival.theme];
      const bg = ctx.createLinearGradient(0,0,1080,1350);
      bg.addColorStop(0,dark); bg.addColorStop(.55,mid); bg.addColorStop(1,'#090B10');
      ctx.fillStyle=bg; ctx.fillRect(0,0,1080,1350);
      const glow=ctx.createRadialGradient(540,450,20,540,450,700);
      glow.addColorStop(0,accent+'42'); glow.addColorStop(1,accent+'00');
      ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1350);
      ctx.strokeStyle=accent+'88';ctx.lineWidth=2;ctx.strokeRect(48,48,984,1254);
      ctx.strokeStyle=accent+'35';ctx.lineWidth=1;ctx.strokeRect(68,68,944,1214);
      ctx.textAlign='center';
      ctx.fillStyle=accent;ctx.font='700 24px Arial';ctx.letterSpacing='8px';
      ctx.fillText('A FESTIVE GREETING FROM',540,180);
      const logo = new Image(); logo.src='/resources/logo-removebg-preview.png';
      await new Promise<void>((resolve,reject)=>{logo.onload=()=>resolve();logo.onerror=()=>reject(new Error('MAP132 logo could not be loaded.'));});
      const scale=Math.min(510/logo.width,270/logo.height);
      ctx.shadowColor=accent;ctx.shadowBlur=32;
      ctx.drawImage(logo,540-logo.width*scale/2,235-logo.height*scale/2,logo.width*scale,logo.height*scale);
      ctx.shadowBlur=0;
      ctx.fillStyle='#FFFFFF';ctx.font='700 64px Arial';
      ctx.fillText(festival.name,540,650);
      ctx.font='54px Arial';ctx.fillText(festival.emoji,540,745);
      ctx.fillStyle='#F3E9D2';ctx.font='30px Arial';
      const words=festival.message.split(' ');let line='',lines:string[]=[];
      words.forEach(word=>{const test=line?line+' '+word:word;if(ctx.measureText(test).width>820&&line){lines.push(line);line=word;}else line=test;});
      if(line)lines.push(line);
      lines.slice(0,4).forEach((value,index)=>ctx.fillText(value,540,850+index*48));
      ctx.fillStyle=accent;ctx.font='700 25px Arial';ctx.fillText('MAP132 DIGITALS',540,1125);
      ctx.fillStyle='#D7D0C4';ctx.font='20px Arial';ctx.fillText('VIDEO EDITING  ·  EVERY FRAME HAS A STORY',540,1170);
      ctx.fillStyle=accent+'AA';ctx.font='18px Arial';ctx.fillText(festivalDateLabel(festival.date).toUpperCase(),540,1230);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Poster export failed.')),'image/png'));
      const file=new File([blob],`MAP132-${festival.name.replace(/[^a-z0-9]+/gi,'-')}-Greeting.png`,{type:'image/png'});
      if(share && navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
        await navigator.share({title:`MAP132 DIGITALS - ${festival.name}`,text:`Warm wishes from MAP132 DIGITALS!`,files:[file]});
      } else {
        const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=file.name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),3000);      }
      setStatus('Your MAP132 greeting poster is ready.');
    } catch(error) { setStatus(error instanceof Error?error.message:'Could not create the poster.'); }
  }

  return <>
    <div className={`festival-atmosphere festival-${festival.theme} ${todayFestival?'festival-live':'festival-build-up'}`} aria-hidden="true">
      {Array.from({length:14},(_,i)=><span key={i} style={{left:`${4+i*7}%`,animationDuration:`${15+(i%5)*4}s`,animationDelay:`${-i*2.4}s`}}>{festival.theme==='snow'?['❄','✧','❅'][i%3]:festival.theme==='sun'?['☀','✦','✨'][i%3]:festival.theme==='diwali'?['🪔','✧','✨','🌟'][i%4]:festival.theme==='gold'?['✨','✦','🙏'][i%3]:['✦','✨','🎉'][i%3]}</span>)}
    </div>
  </>;
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
      <nav aria-label="Main navigation"><a href="#top">Home</a><a href="#work">Portfolio</a><a href="#services">Services</a><a href="#approach">Our Approach</a><a href="#skills">Creative Lab</a><a href="#about">About</a><a className="nav-workspace" href="#workspace"><Film size={14}/> Editor Workspace</a><a className="nav-hire" href="#contact">Start a project <ArrowRight size={15}/></a></nav>
    </header>
    <nav className="mobile-dock" aria-label="Quick navigation"><a href="#top"><span>⌂</span>Home</a><a href="#work"><span>▧</span>Work</a><a href="#services"><span>✳</span>Services</a><a href="#approach"><span>◈</span>Approach</a><a href="#contact"><span>↗</span>Contact</a></nav>
    <main>
      <section className="hero" id="top">
        <div className="hero-noise"></div><div className="hero-copy">
          <p className="kicker"><i/> MAP132 DIGITALS · VIDEO EDITING STUDIO</p>
          <h1>{p.headline.split(' ').slice(0,-2).join(' ')} <em>{p.headline.split(' ').slice(-2).join(' ')}</em></h1>
          <p className="hero-intro">{p.intro}</p><p className="hero-positioning">Independent creative studio · Video editing · Motion · Sound</p>
          <div className="hero-manifesto"><span className="manifesto-mark">M / 132</span><p>We don’t edit just to make footage look different.<br/><b>We shape what the viewer should feel.</b></p><div className="manifesto-pillars"><span>01 STORY</span><span>02 VISUAL RHYTHM</span><span>03 SOUND</span></div></div>
          <div className="hero-actions"><a className="gold-button" href="#work">View selected work <ArrowRight size={16}/></a><a className="quiet-link" href="#contact">Start a project <ArrowDownRight size={16}/></a></div>
          <div className="hero-meta"><span>EDIT WITH PURPOSE</span><span>CRAFTED FRAME BY FRAME</span></div><div className="home-discover"><a href="#work">Explore the work <ArrowRight size={14}/></a><span>SCROLL LESS · DISCOVER MORE</span></div>
        </div>
        <div className="hero-visual" aria-label="Cinematic video editing visual">
          <div className="visual-orbit orbit-a"></div><div className="visual-orbit orbit-b"></div>
          <div className="monitor"><div className="monitor-bar"><span>MAP132 DIGITALS / POST PRODUCTION</span><span className="rec">● CREATIVE STUDIO</span></div><div className="monitor-screen emblem-screen"><div className="emblem-light"></div><div className="hero-emblem" role="img" aria-label="MAP132 DIGITALS official logo"><img src="/resources/logo-removebg-preview.png" alt="MAP132 DIGITALS logo" /></div><span className="screen-timecode">EST. CREATIVE / FRAME BY FRAME</span></div><div className="timeline-editor"><div className="timeline-ruler"><span>00:00</span><span>00:08</span><span>00:16</span><span>00:24</span><span>00:32</span></div><div className="timeline-lane"><i/><i/><i/><i/></div><div className="timeline-lane audio"><i/></div></div><div className="monitor-foot"><span>4K · 24 FPS</span><span>STORY / CUT / SOUND</span></div></div>
          <span className="float-note note-one">STORY FIRST</span><span className="float-note note-two"><Sparkles size={13}/> DETAIL MATTERS</span>
        </div>
        <div className="hero-index">01 <span>—</span> 04</div>
      </section>
      <section className="approach-section" id="approach">
        <div className="approach-top"><p className="kicker">THE THINKING BEHIND THE EDIT</p><span>MAP132 / CREATIVE METHOD</span></div>
        <div className="approach-heading"><h2>Not just an edit.<br/><em>A point of view.</em></h2><p>Every frame has a job. Every sound has a reason. We shape the feeling first — then build the visuals around it.</p></div>
        <div className="approach-grid">
          <article><span>01 / STORY</span><h3>Find the feeling.</h3><p>We look for the moment, message or emotion that should stay with the viewer — and build the cut around it.</p><b>INTENT BEFORE EFFECT</b></article>
          <article><span>02 / VISUAL RHYTHM</span><h3>Make every frame count.</h3><p>Composition, typography, motion and colour work together. Nothing is added just because it looks flashy.</p><b>DESIGN WITH PURPOSE</b></article>
          <article><span>03 / SOUND</span><h3>Let them feel it.</h3><p>Music, ambience, silence and precise sound details give each transition its weight and each story its pulse.</p><b>DETAIL YOU CAN FEEL</b></article>
        </div>
        <div className="approach-footer"><span>01 — DISCOVER</span><i></i><span>02 — DESIGN</span><i></i><span>03 — EDIT</span><i></i><span>04 — REFINE</span><a href="#contact">BUILD SOMETHING WITH US <ArrowRight size={14}/></a></div>
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

      <section className="skills-section" id="skills"><div className="section-head"><div><p className="kicker">TOOLS · TECHNIQUE · TASTE</p><h2>Creative <em>craft.</em></h2></div><p>A look at the creative craft behind MAP132 projects — from story pacing and motion design to colour, typography and sound.</p></div><div className="toolkit-stage"><div className="toolkit-stack">{content.skills.map((skill,i)=><button type="button" className={activeSkill===i?'tool-layer active':'tool-layer'} key={skill} onClick={()=>setActiveSkill(i)}><span>{String(i+1).padStart(2,'0')}</span><b>{skill}</b><ChevronRight size={17}/></button>)}</div><div className="toolkit-detail"><p className="kicker">SELECTED CREATIVE LAYER / {String(activeSkill+1).padStart(2,'0')}</p><h3>{content.skills[activeSkill]||'Creative craft'}</h3><p>{['Build a clean edit with intentional pacing, precise cuts and a story-first timeline.','Create titles, transitions, compositing and visual effects that add depth to a scene.','Shape contrast, skin tones and atmosphere so every shot feels part of the same world.','Use movement, typography and visual rhythm to make information feel cinematic.','Design layered sound, impacts and transitions that give every cut a stronger feeling.','Make every edit feel connected through timing, emotion and a clear visual point of view.'][activeSkill%6]}</p><div className="detail-tags"><span>CRAFT</span><span>PRECISION</span><span>STORY</span></div><div className="detail-footer"><span>MAP132 / POST PRODUCTION</span><span>3D LAYER ACTIVE</span></div></div></div><div className="skill-foot"><WandSparkles size={17}/> CONCEPT · EDIT · REFINE · DELIVER</div></section>
      <section className="about-section" id="about"><div className="about-label"><p className="kicker">BEHIND THE FRAMES</p><span>MAP / 2026</span></div><div><h2>Made with intent.<br/><em>Finished with feeling.</em></h2><p>{p.about}</p><span className="location-tag"><Camera size={15}/> {p.location}</span></div></section>
      <section className="contact-section" id="contact"><div className="contact-copy"><p className="kicker">MAP132 DIGITALS / LET'S WORK TOGETHER</p><h2>Let’s create<br/><em>something memorable.</em></h2><p>Share your video idea and project details. I’ll get back to you through the contact details you provide.</p><div className="contact-links">{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp</a>}{safeLink(p.instagram) && <a href={safeLink(p.instagram)} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a>}{safeLink(p.facebook) && <a href={safeLink(p.facebook)} target="_blank" rel="noreferrer">Facebook</a>}{safeLink(p.telegram) && <a href={safeLink(p.telegram)} target="_blank" rel="noreferrer">Telegram</a>}{safeLink(p.linkedin) && <a href={safeLink(p.linkedin)} target="_blank" rel="noreferrer">LinkedIn</a>}{safeLink(p.youtube) && <a href={safeLink(p.youtube)} target="_blank" rel="noreferrer"><Youtube size={17}/> YouTube</a>}{p.email && <a href={'mailto:'+p.email}>Email</a>}</div></div><div className="contact-panel"><span>PROJECT ENQUIRY FORM</span><form className="lead-form" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);const msg='MAP132 DIGITALS — PROJECT ENQUIRY\nName: '+d.get('name')+'\nEmail: '+d.get('email')+'\nPhone: '+d.get('phone')+'\nService: '+d.get('service')+'\nProject: '+d.get('details');if(whatsappUrl)window.open(whatsappUrl+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');else if(p.email)window.location.href='mailto:'+p.email+'?subject=MAP132%20DIGITALS%20Enquiry&body='+encodeURIComponent(msg);else alert('Add WhatsApp or business email in Admin → Social & contact first.')}}><label>Your name<input name="name" required placeholder="Your name"/></label><div className="lead-row"><label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Phone<input name="phone" required placeholder="+91…"/></label></div><label>Service needed<select name="service"><option>YouTube video editing</option><option>Reels & Shorts</option><option>Trailer / Teaser</option><option>Wedding / Event film</option><option>Brand / Promo video</option><option>AI Video Creation</option><option>Motion graphics / Logo reveal</option><option>Other Project</option></select></label><label>Project details<textarea name="details" rows={3} placeholder="Video length, deadline, preferred style…"/></label><button className="gold-button" type="submit">Send project enquiry <ArrowRight size={16}/></button></form><small>Opens WhatsApp or email with your details prefilled. The website does not store form submissions.</small></div></section>
    </main>
<footer className="site-footer"><a className="wordmark" href="#top"><BrandLogo/></a><p>Stories crafted frame by frame.</p><div><a href="#services">Services</a><a href="#work">Selected work</a><a href="#contact">Contact</a><a href="#workspace">Editor Workspace <ExternalLink size={12}/></a><span>© {new Date().getFullYear()} MAP132 DIGITALS</span></div></footer>
  </div>;
}
const workspaceResources = [
 {section:'Workspace Home',title:'Your complete editing toolkit',description:'All agreed MAP132 editing resources in one place — music and SFX, stock footage, templates, motion graphics, LUTs, fonts, PNG graphics and saved favourites. Open any provider to preview and download under its licence.',cards:[]},
{section:'Brand Kit',title:'MAP132 logo assets',description:'The official MAP132 DIGITALS identity. Use the transparent PNG on dark or light backgrounds; keep its proportions intact.',cards:[{id:'logo-transparent',title:'Official transparent logo',detail:'PNG · Transparent background · High resolution',tags:['Brand','Logo','PNG'],href:'/resources/logo-removebg-preview.png',action:'Download PNG',download:true}]},
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
{id:'pixabay-sfx',title:'Pixabay Sound Effects',provider:'Pixabay',detail:'Browse ambience, cinematic hits, foley and transition sounds',tags:['Horror','Sci-Fi','Trailer','SFX'],licence:'Pixabay Content License applies; do not redistribute assets as standalone files and check third-party rights.',href:'https://pixabay.com/sound-effects/'},{id:'mixkit-cinematic-picks',title:'Cinematic SFX — Editor Picks',provider:'Mixkit · Curated',detail:'109 cinematic effects. Start here for whooshes, deep impacts, heartbeat transitions, risers, suspense swells, logo hits and trailer accents.',tags:['Trailer','Teaser','Action','Thriller','Cinematic','Logo Reveal','SFX'],licence:'Mixkit Sound Effects Free License permits commercial projects and client videos; do not redistribute the sound as a standalone asset. Confirm the item is under the Free SFX licence.',href:'https://mixkit.co/free-sound-effects/cinematic/'},
{id:'mixkit-impact-picks',title:'Impact & Hit Essentials',provider:'Mixkit · Curated',detail:'68 impact effects: deep hits, strikes, trailer impacts, crashes and punch accents for title reveals and edit points.',tags:['Action','Trailer','Impact','Mass','SFX'],licence:'Mixkit Sound Effects Free License. Use inside a larger creative project; no standalone redistribution.',href:'https://mixkit.co/free-sound-effects/impact/'},
{id:'mixkit-movie-picks',title:'Movie & Trailer Essentials',provider:'Mixkit · Curated',detail:'58 movie-style sounds including heartbeat transitions, trailer risers, epic impacts, suspense and intro accents.',tags:['Trailer','Teaser','Thriller','Horror','Cinematic','SFX'],licence:'Mixkit Sound Effects Free License. Confirm the selected item is not under a different/restricted item licence.',href:'https://mixkit.co/free-sound-effects/movie/'},
{id:'pixabay-cinematic-riser-boom',title:'Cinematic Riser + Boom',provider:'Pixabay · Editor Pick',detail:'17-second build-up ending in a deep cinematic impact. Listed with 170k+ plays and 20k+ downloads on its asset page when checked.',tags:['Trailer','Teaser','Impact','Riser','Logo Reveal','SFX'],licence:'Pixabay Content License. Free use in a new creative project; do not redistribute the original sound on its own. Check third-party rights and retain the asset page/licence evidence.',href:'https://pixabay.com/sound-effects/cinematic-riser-boom-466922/'},
{id:'pixabay-cinematic-impact',title:'Cinematic Impact Hit',provider:'Pixabay · Editor Pick',detail:'Short dramatic impact/drop for trailer cuts, title emphasis and transitions. Listed with 273k+ plays and 30k+ downloads when checked.',tags:['Action','Trailer','Impact','Mass','SFX'],licence:'Pixabay Content License. Free use in a new creative project; no standalone redistribution. Check third-party rights and retain the asset page/licence evidence.',href:'https://pixabay.com/sound-effects/film-special-effects-cinematic-impact-464937/'},
{id:'pixabay-whoosh-riser',title:'Whoosh Riser',provider:'Pixabay · Editor Pick',detail:'Eight-second rising whoosh for transitions, tension builds and trailer movement. Listed with 271k+ plays and 21k+ downloads when checked.',tags:['Trailer','Teaser','Transition','Riser','Reels','SFX'],licence:'Pixabay Content License. Free use in a new creative project; no standalone redistribution. Check third-party rights and retain the asset page/licence evidence.',href:'https://pixabay.com/sound-effects/film-special-effects-whoosh-riser-346045/'},
{id:'pixabay-heavy-whoosh',title:'Heavy Whoosh 06',provider:'Pixabay · Editor Pick',detail:'Short heavy whoosh/boom texture for punchy cuts and trailer build-ups. Listed with 94k+ plays and 14k+ downloads when checked.',tags:['Action','Trailer','Transition','Boom','SFX'],licence:'Pixabay Content License. Free use in a new creative project; no standalone redistribution. Check third-party rights and retain the asset page/licence evidence.',href:'https://pixabay.com/sound-effects/film-special-effects-heavy-whoosh-06-414584/'}]},
{section:'Editing Assets',title:'LUTs, transitions, overlays & fonts',description:'A focused source shelf for post-production assets. Confirm file format, editor version, commercial terms and attribution before paid client use.',cards:[
{id:'adobe-stock-free',title:'Adobe Stock Free collection',provider:'Adobe',detail:'Free videos, templates, motion graphics templates, 3D assets and design resources',tags:['Video','Templates','Motion','3D'],licence:'Adobe states its free assets meet its Stock licensing standards; exclude editorial-only assets and review applicable terms.',href:'https://stock.adobe.com/free'},
{id:'mixkit-templates',title:'Mixkit Video Templates',provider:'Mixkit',detail:'Premiere Pro, After Effects and other video template collections',tags:['Premiere Pro','After Effects','Templates'],licence:'Check the licence for the exact item type and whether the template is Free or Restricted.',href:'https://mixkit.co/free-video-templates/'},
{id:'google-fonts',title:'Google Fonts',provider:'Google',detail:'Typography for titles, captions, posters and brand graphics',tags:['Fonts','Typography','Design'],licence:'Review the individual font licence; many Google Fonts use open-source licences.',href:'https://fonts.google.com/'}]},
{section:'Stock Footage',title:'Cinematic footage & B-roll',description:'Live provider libraries. Open the source to preview and download the latest clips; check the exact clip licence before every client project.',cards:[
{id:'pexels-video',title:'Pexels Videos',provider:'Pexels',detail:'Free stock footage for reels, promos, wedding mood edits and cinematic B-roll',tags:['B-roll','Cinematic','Wedding','Commercial','Reels'],licence:'Pexels licence permits many commercial uses; do not redistribute unaltered clips or imply endorsement. Check people, property and trademark rights.',href:'https://www.pexels.com/videos/'},
{id:'pixabay-video',title:'Pixabay Videos',provider:'Pixabay',detail:'Search free HD and 4K clips, nature, city, abstract and lifestyle footage',tags:['B-roll','Cinematic','Commercial','Nature'],licence:'Pixabay Content License permits many commercial uses, but depicted trademarks, people and third-party rights may still apply. Check the individual asset.',href:'https://pixabay.com/videos/'},
{id:'mixkit-video',title:'Mixkit Stock Video',provider:'Mixkit',detail:'Cinematic backgrounds, lifestyle footage, aerials and motion clips',tags:['B-roll','Cinematic','Commercial','Aerial'],licence:'Use only clips explicitly marked Free License. Mixkit also has Restricted License clips; the licence is item-specific.',href:'https://mixkit.co/free-stock-video/'},
{id:'coverr-video',title:'Coverr Stock Video',provider:'Coverr',detail:'Curated cinematic stock clips and looping backgrounds',tags:['B-roll','Cinematic','Commercial','Backgrounds'],licence:'Review Coverr current licence and any model/property release limitations on the asset before client use.',href:'https://coverr.co/'},
{id:'pond5-free',title:'Pond5 Free Collection',provider:'Pond5',detail:'Free HD/4K footage, images and music selected for commercial projects',tags:['B-roll','Commercial','HD','4K'],licence:'Pond5 states its Free Collection supports commercial use with artist attribution. Copy the exact attribution from each asset page.',href:'https://www.pond5.com/free'}]},
{section:'Creative Tools',title:'Templates, LUTs, fonts & motion resources',description:'Official free collections for practical post-production. Provider catalogues change over time; open the source for current items and verify the item-specific licence.',cards:[
{id:'mixkit-templates-live',title:'Mixkit Video Templates',provider:'Mixkit',detail:'Premiere Pro, After Effects and social video templates',tags:['Premiere Pro','After Effects','Templates'],licence:'Only use templates marked Free License; check the exact item type and restrictions.',href:'https://mixkit.co/free-video-templates/'},
{id:'adobe-free',title:'Adobe Stock Free',provider:'Adobe',detail:'Free video, motion graphics templates, 3D assets and design resources',tags:['Video','Templates','Motion','3D'],licence:'Review Adobe Stock licence, editorial-only status and attribution guidance for each asset.',href:'https://stock.adobe.com/free'},
{id:'google-fonts-live',title:'Google Fonts',provider:'Google',detail:'Open-source typefaces for posters, titles, captions and brand graphics',tags:['Fonts','Typography','Design'],licence:'Check the licence attached to the individual font family before embedding or redistributing font files.',href:'https://fonts.google.com/'},
{id:'createthat-free',title:'CreateThat Free Assets',provider:'CreateThat',detail:'Free b-roll, music, sound effects, LUTs and images in one library',tags:['B-roll','Music','SFX','LUTs'],licence:'The provider states its listed free assets can be used commercially, but do not redistribute assets as standalone files. Verify the current terms on the asset page.',href:'https://www.createthat.ai/free-assets'}]},
{section:'My Collections',title:'Saved resources',description:'MAP132 editor-curated picks are preloaded here. Add your own favourites too; the starter picks are selected from established free SFX catalogues and asset-page engagement signals, not a claimed worldwide ranking.',cards:[]}];
function SoundResultCard({sound}:{sound:any}){
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const [playing,setPlaying]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [downloadError,setDownloadError]=useState('');
  const [playError,setPlayError]=useState('');
  async function toggle(){
    const audio=audioRef.current;
    if(!audio)return;
    if(playing){audio.pause();setPlaying(false);return;}
    document.querySelectorAll('audio').forEach((other)=>{if(other!==audio)(other as HTMLAudioElement).pause();});
    setPlayError('');
    try{if(audio.error)audio.load();await audio.play();setPlaying(true);}
    catch(error){setPlaying(false);setPlayError(error instanceof Error&&error.name==='NotAllowedError'?'Browser blocked playback. Tap Play again.':'Preview could not start. This source preview may be unavailable; try another sound.');}
  }
  async function downloadPreview(){
    if(downloading)return;
    setDownloading(true);setDownloadError('');
    try{
      const response=await fetch('/api/resources/sounds/'+encodeURIComponent(String(sound.id))+'/download');
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'Download failed.');}
      const blob=await response.blob();
      const objectUrl=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=objectUrl;anchor.download=(String(sound.title||'sound-preview').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80)||'sound-preview')+'.mp3';
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
    }catch(error){setDownloadError(error instanceof Error?error.message:'Download failed.');}
    finally{setDownloading(false);}
  }
  const licence=String(sound.license||'').toLowerCase();
  const downloadAllowed=licence.includes('creativecommons.org/publicdomain/zero/')||(licence.includes('creativecommons.org/licenses/by/')&&!licence.includes('/by-nc/'));
  const duration=Number.isFinite(Number(sound.duration))?Math.floor(Number(sound.duration)):0;
  const time=duration?Math.floor(duration/60)+':'+String(duration%60).padStart(2,'0'):'';
  return <article className="workspace-resource-card" style={{display:'flex',flexDirection:'column',alignItems:'stretch',gap:10,padding:'14px 16px',minWidth:0,overflow:'hidden'}}>
    <audio ref={audioRef} preload="none" src={sound.id?'/api/resources/sounds/'+encodeURIComponent(String(sound.id))+'/preview':undefined} onEnded={()=>setPlaying(false)} onPause={()=>setPlaying(false)} onPlay={()=>{setPlaying(true);setPlayError('');}} onError={()=>{setPlaying(false);setPlayError('Preview unavailable from the source. Try another sound.');}} />
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,minWidth:0}}>
      <div style={{minWidth:0,flex:'1 1 auto'}}>
        <strong title={sound.title} style={{display:'block',fontSize:15,lineHeight:1.35,overflowWrap:'anywhere'}}>{sound.title}</strong>
        <span style={{display:'block',fontSize:12,opacity:.72,marginTop:5}}>Preview available{sound.creator?' · '+sound.creator:''}{time?' · '+time:''}</span>
      </div>
      <span style={{fontSize:11,opacity:.7,whiteSpace:'nowrap',flexShrink:0}}>{downloadAllowed?'CC licence':'Licence check'}</span>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
      <button type="button" className="gold-button" aria-label={playing?'Pause preview':'Play preview'} onClick={toggle} disabled={!sound.previewUrl} style={{minWidth:132,padding:'9px 14px',justifyContent:'center'}}>{playing?'Ⅱ Pause Preview':'▶ Play Preview'}</button>
      <button type="button" className="gold-button" onClick={downloadPreview} disabled={!downloadAllowed||downloading} style={{minWidth:140,padding:'9px 14px',justifyContent:'center',opacity:downloadAllowed?1:.45}}>{downloading?'Downloading…':'↓ Download Preview'}</button>
    </div>
    {playError&&<span className="error-text" role="status">{playError}</span>}
    {downloadError&&<span className="error-text">{downloadError}</span>}
  </article>;
}
function WorkspaceLibrary({resources=[],onAdd,onDelete,saving=false}:{resources?:WorkspaceEntry[];onAdd:(item:WorkspaceEntry)=>void;onDelete:(id:string)=>void;saving?:boolean}){
  const [section,setSection]=useState('Music & BGM'),[query,setQuery]=useState(''),[kind,setKind]=useState('All types'),[draft,setDraft]=useState({title:'',category:'Music & BGM',detail:'',href:'',provider:'',licence:'',compatibility:'',kind:'audio' as WorkspaceEntry['kind'],previewUrl:'',downloadUrl:''}),[formOpen,setFormOpen]=useState(false),[message,setMessage]=useState('');
  const [activePreview,setActivePreview]=useState<WorkspaceEntry|null>(null);
  const [soundGenre,setSoundGenre]=useState('All genres');
  const [soundQuery,setSoundQuery]=useState('');
  const [soundResults,setSoundResults]=useState<any[]>([]);
  const [soundBusy,setSoundBusy]=useState(false);
  const [soundError,setSoundError]=useState('');
  const [soundCount,setSoundCount]=useState(0);
  const [soundPage,setSoundPage]=useState(1);
  const [soundNextPage,setSoundNextPage]=useState<number|null>(null);
  useEffect(()=>{const stopOthers=(event:Event)=>{const target=event.target;if(!(target instanceof HTMLAudioElement))return;document.querySelectorAll('audio').forEach(node=>{if(node!==target&&!node.paused)node.pause();});};document.addEventListener('play',stopOthers,true);return()=>document.removeEventListener('play',stopOthers,true);},[]);
  const musicGenres=['All genres','Cinematic','Emotional','Romantic','Action','Horror','Thriller','Corporate','Ambient','Orchestral','Piano','Vlog','Wedding','Documentary','Hip Hop','Electronic','Telugu instrumental'];
  const effectGenres=['All genres','Whoosh','Impact','Riser','Boom','Ambience','Action','Horror','Suspense','Trailer','Transition','Foley','Nature','Vehicles','Crowd','UI sounds','Footsteps','Weapons','Fire','Water'];
  const soundGenres=section==='Music & BGM'?musicGenres:effectGenres;
  async function searchSounds(page=1,append=false,quickTerm?:string,quickGenre?:string){
    const base=(quickTerm??soundQuery).trim();
    const selectedGenre=quickGenre??soundGenre;
    const genre=selectedGenre==='All genres'?'':selectedGenre;
    const terms=[base,genre].filter(Boolean).join(' ').trim()||(section==='Music & BGM'?'music background score':'sound effect');
    setSoundBusy(true);setSoundError('');
    try{
      const response=await fetch('/api/resources/sounds?query='+encodeURIComponent(terms)+'&page='+page);
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Could not load sounds.');
      setSoundResults(current=>append?[...current,...(data.results||[]).filter((item:any)=>!current.some((existing:any)=>existing.id===item.id))]:(data.results||[]));
      setSoundCount(data.count||0);setSoundPage(page);setSoundNextPage(data.nextPage||null);
    }catch(error){setSoundError(error instanceof Error?error.message:'Sound search failed.');if(!append){setSoundResults([]);setSoundCount(0);setSoundNextPage(null);}}
    finally{setSoundBusy(false);}
  }
  const sections=['Music & BGM','Sound Effects','Stock Footage','Editing Templates','Cinematic Fonts'];
  const seeded=workspaceResources.filter(x=>['Audio Library','Stock Footage','Editing Assets'].includes(x.section)).flatMap(x=>x.cards.filter((c:any)=>!['google-fonts','google-fonts-live'].includes(c.id)).map((c:any)=>({...c,category:x.section==='Audio Library'?(c.id.includes('sfx')||c.id.includes('cinematic')||c.id.includes('impact')||c.id.includes('whoosh')||c.id.includes('movie')?'Sound Effects':'Music & BGM'):x.section==='Stock Footage'?'Stock Footage':'Editing Templates',kind:(x.section==='Audio Library'?'audio':x.section==='Stock Footage'?'video':'template') as WorkspaceEntry['kind'],licence:c.licence||'Check the provider’s current licence on the original asset page before client or commercial use.',compatibility:c.compatibility||'Check the asset page for supported software and formats.'})));
  const cinematicFonts=[
    {id:'font-cinzel',title:'Cinzel — Epic / Historical',provider:'Google Fonts',detail:'Roman inscription-inspired display face for epic titles, period dramas and premium cinematic posters.',href:'https://fonts.google.com/specimen/Cinzel',tags:['Hollywood','Epic','Historical','Title'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-bebas',title:'Bebas Neue — Action / Trailer',provider:'Google Fonts',detail:'Tall condensed display typography for action titles, sports promos and trailer cards.',href:'https://fonts.google.com/specimen/Bebas+Neue',tags:['Hollywood','Action','Trailer','Title'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-anton',title:'Anton — Mass / Bold Titles',provider:'Google Fonts',detail:'Heavy condensed lettering for mass Telugu-film-inspired title treatments and punchy promo graphics.',href:'https://fonts.google.com/specimen/Anton',tags:['Tollywood','Mass','Action','Poster'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-teko',title:'Teko — Telugu Commercial Cinema',provider:'Google Fonts',detail:'Strong narrow display style for commercial-film title cards, action promos and vertical posters.',href:'https://fonts.google.com/specimen/Teko',tags:['Tollywood','Commercial','Action','Poster'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-oswald',title:'Oswald — Thriller / Crime',provider:'Google Fonts',detail:'Condensed modern sans for thriller, crime, investigative and documentary title designs.',href:'https://fonts.google.com/specimen/Oswald',tags:['Hollywood','Thriller','Crime'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-cormorant',title:'Cormorant Garamond — Romance / Period',provider:'Google Fonts',detail:'Elegant high-contrast serif for romance, period drama, wedding-film and emotional title cards.',href:'https://fonts.google.com/specimen/Cormorant+Garamond',tags:['Hollywood','Romance','Period'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},
    {id:'font-blackops',title:'Black Ops One — Sci-Fi / Gaming',provider:'Google Fonts',detail:'Angular display style for sci-fi, military, gaming and futuristic title treatments.',href:'https://fonts.google.com/specimen/Black+Ops+One',tags:['Hollywood','Sci-Fi','Futuristic','Gaming'],licence:'SIL Open Font License. Verify the current family licence on its specimen page.',compatibility:'Premiere Pro · After Effects · Photoshop · DaVinci Resolve',kind:'font'},

  ].map((font:any)=>({...font,category:'Cinematic Fonts',kind:'font' as WorkspaceEntry['kind']}));
  const all=[...seeded,...cinematicFonts,...resources.filter(x=>['Music & BGM','Sound Effects','Stock Footage','Editing Templates','Cinematic Fonts'].includes(x.category))];
  // Audio libraries use live Freesound search only; hide the old static provider/resource cards.
  const cards=(section==='Music & BGM'||section==='Sound Effects')
    ? resources.filter(c=>c.category===section)
    : all.filter(c=>c.category===section);
  const visible=cards.filter(c=>(c.title+' '+(c.detail||'')+' '+(c.provider||'')+' '+(c.tags||[]).join(' ')).toLowerCase().includes(query.toLowerCase())&&(kind==='All types'||c.kind===kind));
  function submit(e:React.FormEvent){e.preventDefault();const href=safeLink(draft.href);if(!href){setMessage('Enter a valid https:// resource URL.');return}if(!draft.title.trim()||!draft.licence.trim()){setMessage('Title and licence notes are required.');return}const previewUrl=draft.previewUrl?safeLink(draft.previewUrl):'';const downloadUrl=draft.downloadUrl?safeLink(draft.downloadUrl):'';if((draft.previewUrl&&!previewUrl)||(draft.downloadUrl&&!downloadUrl)){setMessage('Preview / download URL must be a valid https:// URL.');return}onAdd({...draft,id:crypto.randomUUID(),href,previewUrl,downloadUrl,tags:draft.category.split(' ')});setDraft({title:'',category:'Audio Library',detail:'',href:'',provider:'',licence:'',compatibility:'',kind:'audio',previewUrl:'',downloadUrl:''});setMessage('');setFormOpen(false)}
  return <section className="workspace-library">
    <div className="workspace-heading"><div><p className="kicker">MAP132 / PRIVATE PRODUCTION LIBRARY</p><h2>Editor Workspace</h2><p>Only the resources used in MAP132 client edits. Search, preview, play/pause and download without extra clutter.</p></div><button className="gold-button" type="button" onClick={()=>setFormOpen(v=>!v)}><Plus size={16}/>{formOpen?'Close':'Add resource'}</button></div>
    <div className="workspace-stats"><span><b>{all.length}</b> RESOURCES</span><span><b>5</b> ESSENTIAL LIBRARIES</span></div>
    {formOpen&&<form className="workspace-add-form" onSubmit={submit}><div className="card-heading"><div><p className="kicker">LIBRARY MANAGEMENT</p><h3>Add a resource</h3></div></div>
      <div className="form-row"><label>Resource title<input required value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))} placeholder="e.g. Telugu action trailer BGM"/></label><label>Library<select value={draft.category} onChange={e=>setDraft(v=>({...v,category:e.target.value}))}>{sections.filter(x=>x!=='Workspace Home').map(x=><option key={x}>{x}</option>)}</select></label></div>
      <div className="form-row"><label>Resource type<select value={draft.kind} onChange={e=>setDraft(v=>({...v,kind:e.target.value as WorkspaceEntry['kind']}))}><option value="audio">Music / SFX</option><option value="video">Video / footage</option><option value="image">Image / graphics</option><option value="template">Template / motion</option><option value="font">Cinematic font</option></select></label><label>Provider<input value={draft.provider} onChange={e=>setDraft(v=>({...v,provider:e.target.value}))} placeholder="Provider name"/></label></div>
      <label>Original resource page<input required type="url" value={draft.href} onChange={e=>setDraft(v=>({...v,href:e.target.value}))} placeholder="https://…"/></label>
      <label>Direct preview media URL (MP3 / MP4 / image)<input type="url" value={draft.previewUrl} onChange={e=>setDraft(v=>({...v,previewUrl:e.target.value}))} placeholder="Only a real playable media-file URL"/></label>
      <label>Direct download URL (optional)<input type="url" value={draft.downloadUrl} onChange={e=>setDraft(v=>({...v,downloadUrl:e.target.value}))} placeholder="Only a real downloadable file URL"/></label>
      <label>Description<textarea rows={2} value={draft.detail} onChange={e=>setDraft(v=>({...v,detail:e.target.value}))} placeholder="Genre, mood, duration, resolution…"/></label>
      <div className="form-row"><label>Software / format compatibility<input value={draft.compatibility} onChange={e=>setDraft(v=>({...v,compatibility:e.target.value}))} placeholder="Premiere Pro · After Effects · MP3"/></label><label>Licence notes<input required value={draft.licence} onChange={e=>setDraft(v=>({...v,licence:e.target.value}))} placeholder="Exact licence / permitted use…"/></label></div>
      <p className="workspace-form-note">Do not paste a catalogue/search URL as a preview or download. Those fields must point to the actual media file. Third-party stock files stay on their provider unless the licence expressly permits hosting.</p>
      <button className="gold-button" type="submit" disabled={saving}><Save size={15}/>{saving?'Saving…':'Save to library'}</button>{message&&<p className="error-text">{message}</p>}
    </form>}
    <nav className="workspace-library-nav" aria-label="Editing resource libraries">
      {sections.map(name=><button type="button" key={name} className={section===name?'selected':''} aria-current={section===name?'page':undefined} onClick={()=>{setSection(name);setQuery('');setKind('All types')}}>{name}</button>)}
    </nav>
    {(section==='Sound Effects'||section==='Music & BGM')&&<section className="workspace-live-search">
      <div className="workspace-section-title"><div><p className="kicker">AUDIO LIBRARY</p><h3>Find sounds</h3></div><span>{soundCount.toLocaleString()} MATCHES</span></div>
      <div className="workspace-filterbar"><input value={soundQuery} onChange={e=>setSoundQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchSounds()}} placeholder="Search sounds…"/><select value={soundGenre} onChange={e=>setSoundGenre(e.target.value)}>{soundGenres.map(g=><option key={g}>{g}</option>)}</select><button type="button" className="gold-button" onClick={()=>searchSounds(1,false)} disabled={soundBusy}>{soundBusy?'Searching…':'Search'}</button></div>
      {section==='Sound Effects'&&<div className="workspace-cinematic-filters" aria-label="Film-style sound effect filters" style={{display:'grid',gap:12,margin:'12px 0 16px'}}>
        {[
          {group:'ORIGINAL QUICK FILTERS',items:[['Whoosh','cinematic whoosh'],['Riser','cinematic riser build'],['Impact','cinematic impact hit'],['Boom','cinematic deep boom'],['Transition','transition sound effect'],['Cinematic Hit','cinematic impact hit'],['Logo Reveal','logo reveal sound'],['Swipe','fast swipe transition'],['Punch','punch impact sound'],['Heartbeat','heartbeat suspense'],['Suspense','suspense tension sound'],['Ambient','cinematic ambient atmosphere']]},
          {group:'TRAILER & CINEMATIC IMPACT',items:[['Deep Boom','cinematic deep boom'],['Cinematic Hit','cinematic impact hit'],['Riser','cinematic riser build'],['Bass Drop','bass drop impact'],['Trailer Stinger','trailer stinger'],['Metallic Hit','metallic cinematic hit']]},
          {group:'ACTION & FIGHT',items:[['Punch','punch impact sound'],['Kick / Body Hit','body hit impact'],['Sword Clash','sword clash metal'],['Gunshot','cinematic gunshot'],['Explosion','cinematic explosion'],['Vehicle Pass','vehicle pass by']]},
          {group:'TRANSITIONS & LOGO REVEALS',items:[['Whoosh','cinematic whoosh'],['Fast Swipe','fast swipe transition'],['Reverse Whoosh','reverse whoosh'],['Logo Reveal','logo reveal sound'],['Transition Impact','transition impact']]},
          {group:'SUSPENSE & HORROR',items:[['Heartbeat','heartbeat suspense'],['Tension Drone','dark tension drone'],['Horror Stinger','horror stinger'],['Dark Atmosphere','dark cinematic ambience'],['Rising Tension','rising suspense tension']]},
          {group:'AMBIENCE & FOLEY',items:[['Thunder & Rain','thunder rain ambience'],['Wind','strong wind ambience'],['Fire','fire crackling'],['Crowd','cinematic crowd ambience'],['Footsteps','cinematic footsteps'],['Door / Metal Creak','creaking door metal']]},
        ].map(group=><div key={group.group}>
          <p className="kicker" style={{margin:'0 0 7px',fontSize:10,letterSpacing:1.2}}>{group.group}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {group.items.map(([label,term])=><button key={label} type="button" className={soundQuery.toLowerCase()===term.toLowerCase()?'selected':''} onClick={()=>{setSoundGenre('All genres');setSoundQuery(term);searchSounds(1,false,term,'All genres');}}>{label}</button>)}
          </div>
        </div>)}
      </div>}
      <p className="workspace-form-note">Film-style sound searches across Freesound. Results are filtered to CC0 and Creative Commons Attribution licences; CC BY requires creator credit. Availability depends on the source catalogue, so try related terms if a filter returns no eligible preview.</p>
      {soundError&&<p className="error-text">{soundError}</p>}
      {soundResults.length>0&&<><div className="workspace-resource-grid" style={{gridTemplateColumns:'1fr',gap:8}}>{soundResults.map(sound=><SoundResultCard key={sound.id} sound={sound}/>)}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'12px 0'}}><span>{soundResults.length.toLocaleString()} loaded · {soundCount.toLocaleString()} provider matches</span>{soundNextPage&&<button type="button" className="gold-button" onClick={()=>searchSounds(soundNextPage!,true)} disabled={soundBusy}>{soundBusy?'Loading…':'Load more sounds'}</button>}</div></>}
      {!soundBusy&&!soundError&&soundResults.length===0&&<div className="workspace-empty"><b>No eligible previews on this page yet</b><p>Try another quick search or load the next provider page. Some results are excluded because of their licence.</p></div>}
      {soundResults.length===0&&soundNextPage!==null&&<div style={{display:'flex',justifyContent:'center',padding:'10px 0 18px'}}><button type="button" className="gold-button" onClick={()=>searchSounds(soundNextPage,false)} disabled={soundBusy}>{soundBusy?'Loading…':'Load more eligible sounds'}</button></div>}
    </section>}
    <div className="workspace-results workspace-page">
      <div className="workspace-filterbar"><input aria-label="Search resources" value={query} onChange={e=>setQuery(e.target.value)} placeholder={section==='Music & BGM'?'Search music…':section==='Sound Effects'?'Search sound effects…':'Search resources…'}/><select aria-label="Filter by resource type" value={kind} onChange={e=>setKind(e.target.value)}><option>All types</option><option value="audio">Music / SFX</option><option value="video">Video / footage</option><option value="image">Images</option><option value="template">Templates</option><option value="font">Cinematic fonts</option><option value="other">Tools / other</option></select></div>
      <div className="workspace-section-title"><div><h3>{section}</h3></div><span>{visible.length} ITEMS</span></div>
      <div className="workspace-resource-grid">{visible.map((card:any)=><article className="workspace-resource-card" key={card.id}>
        <div className="workspace-card-top"><span>{card.provider||card.category}</span></div>
        {card.previewUrl&&<div className="workspace-media-preview">{card.kind==='audio'?<><audio controls preload="none" src={safeLink(card.previewUrl)}/></>:card.kind==='video'?<video controls preload="metadata" playsInline src={safeLink(card.previewUrl)}/>:<img src={safeLink(card.previewUrl)} alt={card.title}/>}</div>}
        <h4>{card.title}</h4><p>{card.detail||'Open the provider page to explore this resource.'}</p>
        <div className="workspace-card-meta"><span>{card.kind||'resource'}</span><span>{card.compatibility||'Check formats on source'}</span></div>
        <div className="workspace-card-tags">{(card.tags||[]).slice(0,5).map((tag:string)=><span key={tag}>{tag}</span>)}</div>
        <details><summary>Licence & usage notes</summary><p>{card.licence||'Check the provider terms before use.'}</p></details>
        <div className="workspace-card-actions">{card.previewUrl&&<button type="button" onClick={()=>setActivePreview(card)}>Open preview</button>}{card.downloadUrl&&<a href={safeLink(card.downloadUrl)} download>Download file</a>}<a href={safeLink(card.href||'')} target="_blank" rel="noreferrer">Browse official library ↗</a>{resources.some(x=>x.id===card.id)&&<button type="button" onClick={()=>onDelete(card.id)}>Remove</button>}</div>
      </article>)}</div>
      {visible.length===0&&<div className="workspace-empty"><Film size={26}/><b>No resources in this library yet</b><p>Try another library.</p></div>}
    </div>
    <p className="workspace-footnote"><ShieldCheck size={15}/> Audio search currently shows Freesound CC0 and CC BY results only. CC BY requires creator attribution; CC BY-NC and other non-commercial licences are excluded. Preview is streamed from the source; use the source page for its permitted download.</p>
    {activePreview&&<div className="workspace-preview-modal" role="dialog" aria-modal="true" aria-label={activePreview.title} onClick={()=>setActivePreview(null)}><div className="workspace-preview-dialog" onClick={e=>e.stopPropagation()}><button type="button" className="workspace-preview-close" onClick={()=>setActivePreview(null)}>Close ✕</button><p className="kicker">{activePreview.provider||'MAP132 RESOURCE PREVIEW'}</p><h3>{activePreview.title}</h3>{activePreview.kind==='audio'?<audio controls autoPlay src={safeLink(activePreview.previewUrl||'')}/>:activePreview.kind==='video'?<video controls autoPlay playsInline src={safeLink(activePreview.previewUrl||'')}/>:<img src={safeLink(activePreview.previewUrl||'')} alt={activePreview.title}/>}<p>{activePreview.detail}</p><div className="workspace-card-actions">{activePreview.downloadUrl&&<a href={safeLink(activePreview.downloadUrl)} download>Download file</a>}<a href={safeLink(activePreview.href)} target="_blank" rel="noreferrer">Open original resource page ↗</a></div></div></div>}
  </section>;
}

function WorkspaceStandalone(){
  const [resources,setResources]=useState<WorkspaceEntry[]>(()=>{try{return JSON.parse(localStorage.getItem('map132-private-workspace-resources')||'[]')}catch{return[]}});
  useEffect(()=>{localStorage.setItem('map132-private-workspace-resources',JSON.stringify(resources));},[resources]);
  return <main className="admin-main" style={{minHeight:'100vh',maxWidth:1500,margin:'0 auto'}}>
    <div className="admin-top"><div><p className="kicker">MAP132 DIGITALS / PRIVATE EDITING AREA</p><h1>Editor Workspace</h1><p>Personal editing resources. Admin dashboard remains separately protected.</p></div><a className="back-link" href="#top">← Public website</a></div>
    <WorkspaceLibrary resources={resources} onAdd={item=>setResources(v=>[item,...v])} onDelete={id=>setResources(v=>v.filter(x=>x.id!==id))}/>
  </main>;
}

function AdminApp() {
  const [loggedIn,setLoggedIn] = useState(true);
  const [checking,setChecking] = useState(false);
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  const [content,setContent] = useState<Content>(defaults);
  const [tab,setTab] = useState<'profile'|'skills'|'portfolio'|'social'|'workspace'>(window.location.hash === '#workspace' ? 'workspace' : 'portfolio');
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');  const [title,setTitle] = useState('');
  const [category,setCategory] = useState(categories[0]);
  const [description,setDescription] = useState('');
  const [mediaUrl,setMediaUrl] = useState('');
  const [file,setFile] = useState<File|null>(null);
  const [source,setSource] = useState<'youtube'|'drive'|'other'>('youtube');
  const [uploading,setUploading] = useState(false);
  useEffect(()=>{ api.get('/api/admin/session').then(()=>setLoggedIn(true)).catch(()=>setLoggedIn(false)).finally(()=>setChecking(false)); },[]);
  useEffect(()=>{ if(loggedIn) api.get('/api/portfolio').then(r=>setContent(r.data.content || defaults)).catch(()=>setError('Could not load portfolio content.')); },[loggedIn]);
  async function login(e:React.FormEvent){e.preventDefault();setError('');try{await api.post('/api/admin/login',{password});setLoggedIn(true);setPassword('');}catch(error){setError(error instanceof Error?error.message:'Could not sign in. Please try again.');}}
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
    <main className="admin-main"><div className="admin-top"><div><p className="kicker">MAP132 DIGITALS / CONTROL ROOM</p><h1>{tab==='portfolio'?'Portfolio manager':tab==='profile'?'Profile & about':tab==='skills'?'Skills & tools':tab==='social'?'Social & contact':'Editor Workspace'}</h1><p>Manage what visitors see on your public portfolio.</p></div>{tab!=='workspace'&&<button className="save-button" onClick={()=>save()} disabled={saving}><Save size={16}/>{saving?'Saving…':'Save changes'}</button>}</div>
      {notice&&<div className="notice"><Check size={16}/>{notice}</div>}{error&&<div className="error-banner">{error}</div>}
      {tab==='portfolio'&&<div className="admin-content"><section className="admin-card"><div className="card-heading"><div><p className="kicker">ADD A NEW PROJECT</p><h2>Show your latest work.</h2></div><span className="count-pill">{content.items.length} PROJECTS</span></div><form className="admin-form" onSubmit={addProject}><div className="form-row"><label>Project title<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Cinematic wedding teaser"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div><label>Short description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What makes this edit special?"/></label><div className="source-switch"><button type="button" className={!file?'selected':''} onClick={()=>setFile(null)}>YouTube / Drive link</button><button type="button" className={file?'selected':''} onClick={()=>setMediaUrl('')}>Direct upload</button></div>{!file?<><div className="form-row"><label>Link type<select value={source} onChange={e=>setSource(e.target.value as typeof source)}><option value="youtube">YouTube</option><option value="drive">Google Drive</option><option value="other">Other video / image URL</option></select></label><label>Media URL<input required type="url" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} placeholder="https://…"/></label></div></>:<div className="upload-field"><Upload size={20}/><label>Selected file: {file.name}<input type="file" accept="video/mp4,image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><small>MP4, JPG, PNG, WebP · up to 3.5 MB per file</small></div>}<button className="gold-button" disabled={uploading||saving} type="submit"><Plus size={16}/>{uploading?'Uploading…':'Add to portfolio'}</button></form></section>
      <section className="admin-card"><div className="card-heading"><div><p className="kicker">PUBLISHED PROJECTS</p><h2>Portfolio library</h2></div></div>{content.items.length===0?<p className="empty-admin">No projects yet. Add your first edit above.</p>:content.items.map(item=><div className="admin-item" key={item.id}><div className="admin-thumb">{item.path?<Video size={19}/>:item.kind==='image'?<Camera size={19}/>:<Play size={19}/>}</div><div className="admin-item-info"><b>{item.title}</b><span>{item.category} · {item.source||'link'}</span></div><button className="delete-button" onClick={()=>removeItem(item)} aria-label={'Delete '+item.title}><Trash2 size={16}/></button></div>)}</section></div>}
      {tab==='profile'&&<section className="admin-card"><p className="kicker">YOUR CREATIVE IDENTITY</p><h2>Profile & about</h2><div className="admin-form"><label>Brand / display name<input value={content.profile.name} onChange={e=>updateProfile('name',e.target.value)}/></label><label>Hero headline<input value={content.profile.headline} onChange={e=>updateProfile('headline',e.target.value)}/></label><label>Short introduction<textarea rows={3} value={content.profile.intro} onChange={e=>updateProfile('intro',e.target.value)}/></label><label>About your editing approach<textarea rows={5} value={content.profile.about} onChange={e=>updateProfile('about',e.target.value)}/></label><label>Location<input value={content.profile.location} onChange={e=>updateProfile('location',e.target.value)}/></label></div><button className="gold-button" onClick={()=>save()}>Save profile <Save size={15}/></button></section>}
      {tab==='skills'&&<section className="admin-card"><p className="kicker">TOOLS · TECHNIQUE · TASTE</p><h2>Skills & software</h2><p className="admin-hint">One skill per line. These appear on your public website.</p><textarea className="skills-editor" rows={12} value={content.skills.join('\n')} onChange={e=>setContent(c=>({...c,skills:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}))}/><button className="gold-button" onClick={()=>save()}>Save skills <Save size={15}/></button></section>}
      {tab==='social'&&<section className="admin-card"><p className="kicker">CLIENT CONNECTIONS</p><h2>Social & contact links</h2><p className="admin-hint">Only configured links appear on the public website.</p><div className="admin-form"><label>WhatsApp number (with country code)<input value={content.profile.whatsapp} onChange={e=>updateProfile('whatsapp',e.target.value)} placeholder="91XXXXXXXXXX"/></label><label>Instagram profile URL<input type="url" value={content.profile.instagram} onChange={e=>updateProfile('instagram',e.target.value)} placeholder="https://instagram.com/…"/></label><label>Facebook page URL<input type="url" value={content.profile.facebook || ''} onChange={e=>updateProfile('facebook',e.target.value)} placeholder="https://facebook.com/…"/></label><label>Telegram link<input type="url" value={content.profile.telegram || ''} onChange={e=>updateProfile('telegram',e.target.value)} placeholder="https://t.me/…"/></label><label>LinkedIn profile URL<input type="url" value={content.profile.linkedin || ''} onChange={e=>updateProfile('linkedin',e.target.value)} placeholder="https://linkedin.com/in/…"/></label><label>YouTube channel URL<input type="url" value={content.profile.youtube} onChange={e=>updateProfile('youtube',e.target.value)} placeholder="https://youtube.com/@…"/></label><label>Business email<input type="email" value={content.profile.email} onChange={e=>updateProfile('email',e.target.value)} placeholder="hello@example.com"/></label></div><button className="gold-button" onClick={()=>save()}>Save contact links <Save size={15}/></button></section>}
      {tab==='workspace'&&<WorkspaceLibrary resources={content.resources||[]} onAdd={item=>save({...content,resources:[item,...(content.resources||[])]})} onDelete={id=>save({...content,resources:(content.resources||[]).filter(x=>x.id!==id)})} saving={saving}/ >}
      {tab==='workspace'&&<section className="admin-card" style={{marginTop:18}}><p className="kicker">WORKSPACE NAVIGATION</p><h2>Editing resources</h2><p className="admin-hint">If the library panel fails to load, use these category shortcuts to open the resource libraries.</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{['Workspace Home','Brand Kit','Intro Library','Audio Library','Editing Assets','Stock Footage','Creative Tools','My Collections'].map(label=><button type="button" key={label} className="admin-nav" style={{width:'auto',border:'1px solid #DDB57955',padding:'12px 14px'}} onClick={()=>{window.location.hash='#workspace';setTab('workspace')}}>{label}</button>)}</div></section>}
      <p className="admin-footnote"><ShieldCheck size={15}/> Admin changes are saved to the website content store.</p>
    </main></div>;
}
export default function App() {
  const [isAdmin,setIsAdmin] = useState(window.location.hash === '#admin');
  const [isWorkspace,setIsWorkspace] = useState(window.location.hash === '#workspace');
  const [content,setContent] = useState<Content>(defaults);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    const syncRoute = () => {setIsAdmin(window.location.hash === '#admin');setIsWorkspace(window.location.hash === '#workspace');};
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  },[]);
  useEffect(()=>{if(!isAdmin&&!isWorkspace)api.get('/api/portfolio').then(r=>setContent(r.data.content||defaults)).catch(()=>{}).finally(()=>setLoading(false));},[isAdmin,isWorkspace]);
  if(isWorkspace)return <WorkspaceStandalone/>;
  if(isAdmin)return <AdminApp/>;
  return loading?<div className="site-loading">Preparing the next frame…</div>:<PublicSite content={content}/>;
}