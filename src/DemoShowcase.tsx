import { useState } from 'react';
import { DEMO_SHOWCASE } from './demoShowcase';

const clips = [
  { id:'cinematic', title:'After Dark', category:'Cinematic Films', note:'Atmosphere · cinematic pacing · title treatment', video:'https://videos.pexels.com/video-files/27099636/12071805_1920_1080_60fps.mp4', poster:DEMO_SHOWCASE[0].image, source:'https://www.pexels.com/video/aerial-view-of-the-city-at-night-27099636/', tag:'CINEMATIC STUDY', number:'01' },
  { id:'wedding', title:'A Celebration of Two', category:'Wedding & Events', note:'Emotion · warm tones · elegant storytelling', video:'https://videos.pexels.com/video-files/31245302/13345103_1920_1080_50fps.mp4', poster:DEMO_SHOWCASE[1].image, source:'https://www.pexels.com/video/beautiful-south-indian-wedding-ceremony-highlights-31245302/', tag:'EMOTIONAL FILM', number:'02' },
  { id:'birthday', title:'A Day to Remember', category:'Birthday Films', note:'Moments · rhythm · joyful visual story', video:'https://videos.pexels.com/video-files/7424531/7424531-uhd_3840_2160_30fps.mp4', poster:DEMO_SHOWCASE[2].image, source:'https://www.pexels.com/video/a-family-celebrating-a-birthday-party-7424531/', tag:'CELEBRATION FILM', number:'03' },
  { id:'editing', title:'Inside the Edit', category:'YouTube Videos', note:'The craft · timeline · post-production', video:'https://videos.pexels.com/video-files/8100337/8100337-uhd_4096_2160_25fps.mp4', poster:DEMO_SHOWCASE[4].image, source:'https://www.pexels.com/video/person-editing-a-video-8100337/', tag:'BEHIND THE CRAFT', number:'04' }
];
const categories = ['All Studies','Cinematic Films','Wedding & Events','Birthday Films','YouTube Videos'];
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'READING RUNTIME';
  const mins = Math.floor(seconds / 60), secs = Math.floor(seconds % 60);
  return 'RUNTIME ' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
}
export default function DemoShowcase() {
  const [activeCategory,setActiveCategory] = useState('All Studies');
  const [durations,setDurations] = useState<Record<string,number>>({});
  const visible = activeCategory === 'All Studies' ? clips : clips.filter(clip => clip.category === activeCategory);
  return <div className="demo-showcase studio-reel">
    <div className="studio-reel-heading">
      <div><span className="concept-kicker">MAP132 DIGITALS / VISUAL DIRECTION</span><h3>Ideas in <em>motion.</em></h3></div>
      <p>A glimpse into the visual worlds MAP132 can create — from cinematic atmosphere to celebrations and creator content.</p>
    </div>
    <div className="studio-reel-feature">
      <div className="studio-reel-feature-art">
        <img src={DEMO_SHOWCASE[0].image} alt="Night city visual direction reference" loading="lazy"/>
        <div className="studio-reel-feature-shade"/>
        <div className="studio-reel-feature-copy"><span>THE MAP132 CREATIVE LANGUAGE</span><strong>STORY.<br/>RHYTHM.<br/><em>IMPACT.</em></strong><small>VIDEO · MOTION · SOUND DESIGN</small></div>
        <div className="studio-reel-feature-index">MAP132 / 001</div>
      </div>
      <div className="studio-reel-feature-note"><span>OUR CREATIVE PRINCIPLE</span><h4>Make the viewer<br/><em>feel the frame.</em></h4><p>Strong editing is more than transitions. It is the relationship between the image, the pace, the music and the moment.</p><a href="#services">Explore services ↗</a></div>
    </div>
    <div className="studio-reel-toolbar"><div><span>01 — CREATIVE STUDIES</span><p>Explore the styles and formats we work towards.</p></div><div className="studio-reel-filters" aria-label="Filter visual studies">{categories.map(category=><button type="button" key={category} className={activeCategory===category?'active':''} aria-pressed={activeCategory===category} onClick={()=>setActiveCategory(category)}>{category}</button>)}</div></div>
    <div className="studio-reel-grid">
      {visible.map((clip,index)=><article className={'studio-reel-card'+(index===0&&activeCategory==='All Studies'?' featured':'')} key={clip.id}>
        <div className="studio-reel-media"><video controls playsInline preload="metadata" poster={clip.poster} onLoadedMetadata={e=>{const media=e.currentTarget;const duration=media?.duration;if(typeof duration==="number"&&Number.isFinite(duration)){setDurations(prev=>({...prev,[clip.id]:duration}));}}} onPlay={e=>document.querySelectorAll('video').forEach(v=>{if(v!==e.currentTarget)v.pause();})}><source src={clip.video} type="video/mp4"/>Your browser does not support video playback.</video><span className="studio-reel-number">{clip.number}</span><span className="studio-reel-runtime">{formatDuration(durations[clip.id]||0)}</span></div>
        <div className="studio-reel-card-copy"><div><span>{clip.tag}</span><h4>{clip.title}</h4><p>{clip.note}</p></div><a href={clip.source} target="_blank" rel="noreferrer">SOURCE ↗</a></div>
      </article>)}
    </div>
    <div className="studio-reel-disclaimer"><span>REFERENCE FOOTAGE · NOT CLIENT WORK</span><p>These are visual-direction studies using Pexels footage to demonstrate the kinds of stories and treatments MAP132 can develop. They are not commissioned projects or finished MAP132 edits. Original work added through the Admin Dashboard appears in Selected Projects above.</p></div>
  </div>;
}