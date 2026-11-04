import { useRef, useState } from 'react';
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
export default function DemoShowcase() {
  const [split,setSplit] = useState(52);
  const [activeCategory,setActiveCategory] = useState('All Projects');
  const audioRef = useRef<AudioContext|null>(null);
  const compareVideo = clips[0];
  const visibleClips = activeCategory === 'All Projects' ? clips : clips.filter(clip => clip.category === activeCategory);
  function stopSoundDesign() {
    if (audioRef.current) { void audioRef.current.close().catch(()=>{}); audioRef.current = null; }
  }
  function playSoundDesign() {
    stopSoundDesign();
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    audioRef.current = ctx;
    void ctx.resume();
    const now = ctx.currentTime;
    // Original sound-design cue: airy whoosh, low cinematic impact and fading tonal bed.
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.8), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i=0;i<noiseData.length;i++) noiseData[i]=(Math.random()*2-1)*(1-i/noiseData.length);
    const noise = ctx.createBufferSource(); noise.buffer=noiseBuffer;
    const sweep = ctx.createBiquadFilter(); sweep.type='bandpass'; sweep.Q.value=.65;
    sweep.frequency.setValueAtTime(260,now); sweep.frequency.exponentialRampToValueAtTime(3200,now+.55); sweep.frequency.exponentialRampToValueAtTime(180,now+2.5);
    const air = ctx.createGain(); air.gain.setValueAtTime(.0001,now); air.gain.exponentialRampToValueAtTime(.22,now+.12); air.gain.exponentialRampToValueAtTime(.0001,now+2.65);
    noise.connect(sweep); sweep.connect(air); air.connect(ctx.destination); noise.start(now); noise.stop(now+2.8);
    const sub = ctx.createOscillator(); sub.type='sine'; sub.frequency.setValueAtTime(105,now+.18); sub.frequency.exponentialRampToValueAtTime(34,now+1.9);
    const subGain=ctx.createGain(); subGain.gain.setValueAtTime(.0001,now); subGain.gain.setValueAtTime(.34,now+.2); subGain.gain.exponentialRampToValueAtTime(.0001,now+2.25);
    sub.connect(subGain); subGain.connect(ctx.destination); sub.start(now); sub.stop(now+2.3);
    const tone=ctx.createOscillator(); tone.type='triangle'; tone.frequency.setValueAtTime(220,now); tone.frequency.exponentialRampToValueAtTime(110,now+2.8);
    const toneGain=ctx.createGain(); toneGain.gain.setValueAtTime(.0001,now); toneGain.gain.linearRampToValueAtTime(.025,now+.4); toneGain.gain.exponentialRampToValueAtTime(.0001,now+2.8);
    tone.connect(toneGain); toneGain.connect(ctx.destination); tone.start(now); tone.stop(now+2.85);
  }
  function handleVideoPlay(current: HTMLVideoElement) { pauseOtherVideos(current); playSoundDesign(); }
  return <div className="demo-showcase">
    <div className="demo-showcase-intro">
      <span className="concept-kicker">MAP132 DIGITALS / THE CREATIVE CUT</span>
      <h3>Every frame has<br/><em>a feeling.</em></h3>
      <p>We shape raw moments into visual stories through cinematic colour, considered pacing, expressive titles and sound. Explore the creative direction behind each format.</p>
      <div className="demo-craft-points"><span>01 / COLOUR & MOOD</span><span>02 / MOTION & TYPE</span><span>03 / SOUND DESIGN</span></div>
    </div>
    <div className="demo-service-strip" aria-label="Explore creative categories">
      {['All Projects',...categories].map(category => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}
    </div>
    <section className="demo-compare">
      <div className="demo-section-heading"><span>01 / THE TRANSFORMATION</span><h3>From raw scene to cinematic mood</h3><p>Move the slider to reveal the treatment: richer contrast, warm highlights, deeper shadows, a designed title and cinematic framing.</p></div>
      <div className="demo-compare-stage">
        <video className="compare-video compare-video-base" src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/>
        <div className="compare-video-top" style={{clipPath:'inset(0 '+(100-split)+'% 0 0)'}}><video src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/></div>
        <div className="compare-treatment-overlay" style={{clipPath:'inset(0 '+(100-split)+'% 0 0)'}}><span>MAP132 DIGITALS — CINEMATIC STUDY</span><strong>THE CITY<br/>AFTER DARK</strong><small>COLOUR · CONTRAST · TITLE DESIGN</small></div>
        <span className="compare-label compare-before">RAW LOOK</span><span className="compare-label compare-after">CINEMATIC TREATMENT</span>
        <div className="compare-divider" style={{left:split+'%'}}><i/></div>
      </div>
      <label className="compare-range-label">REVEAL THE EDIT <strong>{split}%</strong><input aria-label="Reveal cinematic treatment" type="range" min="5" max="95" value={split} onChange={e=>setSplit(Number(e.target.value))}/></label>
      <div className="demo-craft-points demo-treatment-list"><span>FILM-INSPIRED COLOUR</span><span>VIGNETTE & DEPTH</span><span>ANIMATED TITLE FEEL</span><span>ORIGINAL SOUND CUE ON PLAY</span></div>
    </section>
    <div className="demo-section-heading demo-clips-heading"><span>02 / CREATIVE FORMATS</span><h3>{activeCategory === 'All Projects' ? 'Stories in different styles' : activeCategory}</h3><p>Choose a film to experience its visual direction and original sound-design cue.</p></div>
    <div className="demo-video-grid">
      {visibleClips.map((clip,index) => <article className="demo-video-card" key={clip.id}>
        <div className="demo-video-frame"><video controls playsInline preload="metadata" poster={clip.poster} onPlay={e => handleVideoPlay(e.currentTarget)} onPause={stopSoundDesign} onEnded={stopSoundDesign}><source src={clip.video} type="video/mp4"/>Your browser does not support video playback.</video><span className="demo-video-number">0{index+1}</span><span className="demo-play-caption">PLAY WITH SOUND DESIGN</span></div>
        <div className="demo-video-copy"><span>{clip.category}</span><h4>{clip.title}</h4><p>{clip.note}</p><a href={clip.source} target="_blank" rel="noreferrer">Footage credit ↗</a></div>
      </article>)}
      {visibleClips.length === 0 && <div className="demo-empty-category"><b>{activeCategory}</b><p>This creative format can be developed for your project. Contact MAP132 to discuss the visual direction.</p></div>}
    </div>
    <p className="demo-disclaimer">Creative direction studies using licensed reference footage. Each sample demonstrates a visual approach; footage credits are provided with the clips.</p>
  </div>;
}
