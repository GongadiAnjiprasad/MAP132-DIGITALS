import { useState } from 'react';
import { DEMO_SHOWCASE } from './demoShowcase';

const clips = [
  { id:'cinematic', title:'After Dark — Cinematic Film', category:'Cinematic Films', note:'Atmosphere · cinematic grade · title treatment', video:'https://videos.pexels.com/video-files/27099636/12071805_1920_1080_60fps.mp4', poster:DEMO_SHOWCASE[0].image, source:'https://www.pexels.com/video/aerial-view-of-the-city-at-night-27099636/' },
  { id:'wedding', title:'A Celebration of Two', category:'Wedding & Events', note:'Emotion · warm tones · elegant storytelling', video:'https://videos.pexels.com/video-files/31245302/13345103_1920_1080_50fps.mp4', poster:DEMO_SHOWCASE[1].image, source:'https://www.pexels.com/video/beautiful-south-indian-wedding-ceremony-highlights-31245302/' },
  { id:'birthday', title:'A Day to Remember', category:'Birthday Films', note:'Moments · rhythm · joyful visual story', video:'https://videos.pexels.com/video-files/7424531/7424531-uhd_3840_2160_30fps.mp4', poster:DEMO_SHOWCASE[2].image, source:'https://www.pexels.com/video/a-family-celebrating-a-birthday-party-7424531/' },
  { id:'editing', title:'Inside the Edit', category:'YouTube Videos', note:'The craft · timeline · post-production', video:'https://videos.pexels.com/video-files/8100337/8100337-uhd_4096_2160_25fps.mp4', poster:DEMO_SHOWCASE[4].image, source:'https://www.pexels.com/video/person-editing-a-video-8100337/' }
];
const categories = ['Cinematic Films','Wedding & Events','Birthday Films','Reels & Shorts','YouTube Videos','Brand Promotions','AI Video Creation','Other Projects'];
function pauseOtherVideos(current: HTMLVideoElement) {
  document.querySelectorAll('video').forEach(video => { if (video !== current) video.pause(); });
}
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'DURATION LOADING';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return 'RUNTIME ' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
}
export default function DemoShowcase() {
  const [split,setSplit] = useState(52);
  const [activeCategory,setActiveCategory] = useState('All Projects');
  const [durations,setDurations] = useState<Record<string,number>>({});
  const compareVideo = clips[0];
  const visibleClips = activeCategory === 'All Projects' ? clips : clips.filter(clip => clip.category === activeCategory);
  function handleVideoPlay(current: HTMLVideoElement) {
    pauseOtherVideos(current);
  }
  function updateDuration(id: string, seconds: number) {
    setDurations(previous => previous[id] === seconds ? previous : {...previous,[id]:seconds});
  }
  return <div className="demo-showcase">
    <div className="demo-showcase-intro">
      <span className="concept-kicker">MAP132 DIGITALS / THE CREATIVE CUT</span>
      <h3>Every frame has<br/><em>a feeling.</em></h3>
      <p>From the first cut to the final sound, every creative choice should serve the story. Explore the visual language behind cinematic films, celebrations and digital content.</p>
      <div className="demo-craft-points"><span>01 / STORY & PACING</span><span>02 / COLOUR & MOTION</span><span>03 / SOUND & DETAIL</span></div>
    </div>
    <div className="demo-service-strip" aria-label="Explore creative categories">
      {['All Projects',...categories].map(category => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}
    </div>
    <section className="demo-compare">
      <div className="demo-section-heading"><span>01 / SEE THE DIFFERENCE</span><h3>One frame. Two visual directions.</h3><p>Drag the centre handle across the image. The left side shows the neutral source look; the right side reveals a stylised cinematic treatment.</p></div>
      <div className="demo-compare-stage">
        <video className="compare-video compare-video-base" src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/>
        <div className="compare-video-top" style={{clipPath:'inset(0 0 0 '+split+'%)'}}><video src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/></div>
        <div className="compare-treatment-overlay" style={{clipPath:'inset(0 0 0 '+split+'%)'}}><span>MAP132 DIGITALS — CINEMATIC STUDY</span><strong>THE CITY<br/>AFTER DARK</strong><small>COLOUR · CONTRAST · TITLE DESIGN</small></div>
        <span className="compare-label compare-before">RAW FOOTAGE</span>
        <span className="compare-label compare-after">CINEMATIC EDIT</span>
        <div className="compare-divider" style={{left:split+'%'}}><i/></div>
        <input className="compare-stage-range" aria-label="Drag the centre handle to compare raw footage and cinematic edit" type="range" min="5" max="95" value={split} onChange={e=>setSplit(Number(e.target.value))}/>
      </div>
      <div className="compare-range-label"><span>RAW FOOTAGE</span><strong>{split}% REVEALED</strong><span>CINEMATIC EDIT</span></div>
      <div className="demo-craft-points demo-treatment-list"><span>NEUTRAL SOURCE LOOK</span><span>CONTRAST & COLOUR</span><span>TITLE & FRAME DESIGN</span><span>VISUAL STORYTELLING</span></div>
      <p className="demo-compare-note">This is an interactive visual-grade study using the same reference clip on both sides — not a separately rendered final edit.</p>
    </section>
    <div className="demo-section-heading demo-clips-heading"><span>02 / CREATIVE FORMATS</span><h3>{activeCategory === 'All Projects' ? 'Different stories. Distinct treatments.' : activeCategory}</h3><p>Play a clip to view it at full length. The runtime is read from the actual video file; no artificial looping or duration labels.</p></div>
    <div className="demo-video-grid">
      {visibleClips.map((clip,index) => <article className={'demo-video-card'+(index===0&&activeCategory==='All Projects'?' demo-video-featured':'')} key={clip.id}>
        <div className="demo-video-frame"><video controls playsInline preload="metadata" poster={clip.poster} onPlay={e => handleVideoPlay(e.currentTarget)} onLoadedMetadata={e=>updateDuration(clip.id,e.currentTarget.duration)}><source src={clip.video} type="video/mp4"/>Your browser does not support video playback.</video><span className="demo-video-number">0{index+1}</span><span className="demo-video-runtime">{formatDuration(durations[clip.id] || 0)}</span></div>
        <div className="demo-video-copy"><span>{clip.category}</span><h4>{clip.title}</h4><p>{clip.note}</p><div className="demo-video-meta"><span>REFERENCE FOOTAGE</span><a href={clip.source} target="_blank" rel="noreferrer">Footage source ↗</a></div></div>
      </article>)}
      {visibleClips.length === 0 && <div className="demo-empty-category"><b>{activeCategory}</b><p>This format can be developed around your brief, footage and intended audience. Contact MAP132 to discuss the creative direction.</p></div>}
    </div>
    <div className="demo-sound-note-panel"><span>03 / SOUND DESIGN</span><p>No generic browser-generated whoosh is added to these clips. Source footage audio plays only when it exists. Final sound design should be built to the cut — with matched impacts, transitions, ambience and music, not a one-size-fits-all effect.</p><a href="https://mixkit.co/free-sound-effects/" target="_blank" rel="noreferrer">Explore sound-effect reference library ↗</a></div>
    <p className="demo-disclaimer">Creative direction studies using Pexels reference footage. These are visual samples, not representations of commissioned client projects. Footage sources are linked with each clip.</p>
  </div>;
}
