import { useState } from 'react';
import { DEMO_SHOWCASE } from './demoShowcase';
const clips = [
  { id:'cinematic', title:'Cinematic City Film', category:'Cinematic Films', note:'Aerial footage · mood · atmosphere', video:'https://videos.pexels.com/video-files/27099636/12071805_1920_1080_60fps.mp4', poster:DEMO_SHOWCASE[0].image, source:'https://www.pexels.com/video/aerial-view-of-the-city-at-night-27099636/' },
  { id:'wedding', title:'South Indian Wedding', category:'Wedding & Events', note:'Wedding moments · emotion · storytelling', video:'https://videos.pexels.com/video-files/31245302/13345103_1920_1080_50fps.mp4', poster:DEMO_SHOWCASE[1].image, source:'https://www.pexels.com/video/beautiful-south-indian-wedding-ceremony-highlights-31245302/' },
  { id:'birthday', title:'Birthday Celebration', category:'Birthday Films', note:'Celebration · family · memories', video:'https://videos.pexels.com/video-files/7424531/7424531-uhd_3840_2160_30fps.mp4', poster:DEMO_SHOWCASE[2].image, source:'https://www.pexels.com/video/a-family-celebrating-a-birthday-party-7424531/' },
  { id:'editing', title:'Editing Process Reference', category:'YouTube & Creator Videos', note:'Editing workflow · timeline · post-production', video:'https://videos.pexels.com/video-files/8100337/8100337-uhd_4096_2160_25fps.mp4', poster:DEMO_SHOWCASE[4].image, source:'https://www.pexels.com/video/person-editing-a-video-8100337/' }
];
export default function DemoShowcase() {
  const [split,setSplit] = useState(52);
  const compareVideo = clips[0];
  return <div className="demo-showcase">
    <div className="demo-showcase-intro">
      <span className="concept-kicker">MAP132 DIGITALS / CREATIVE SERVICES</span>
      <h3>See the story.<br/><em>Feel the edit.</em></h3>
      <p>Explore sample stock footage to understand the types of videos and editing styles we can create. These are licensed reference clips, not MAP132 completed client projects.</p>
      <b>STOCK FOOTAGE DEMO · NOT ORIGINAL CLIENT WORK</b><button type="button" className="demo-sound-button" onClick={playSoundDesign}>▶ Hear original cinematic impact</button><small className="demo-sound-note">Original synthesized sound preview. Stock footage itself may not include recorded audio.</small>
    </div>
    <div className="demo-service-strip" aria-label="Filter demo categories">
      {["All Projects",...DEMO_SHOWCASE.map(demo=>demo.category)].map(category=><button type="button" key={category} className={activeCategory===category?"active":""} aria-pressed={activeCategory===category} onClick={()=>setActiveCategory(category)}>{category}</button>)}
    </div>
    <section className="demo-compare">
      <div className="demo-section-heading"><span>01 / LOOK DEVELOPMENT</span><h3>Before & After Look Preview</h3><p>Move the slider to compare a neutral stock clip with a stylised cinematic colour treatment.</p></div>
      <div className="demo-compare-stage">
        <video className="compare-video compare-video-base" src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/>
        <div className="compare-video-top" style={{clipPath:'inset(0 '+(100-split)+'% 0 0)'}}><video src={compareVideo.video} poster={compareVideo.poster} muted autoPlay loop playsInline preload="metadata"/></div>
        <span className="compare-label compare-before">NEUTRAL LOOK</span><span className="compare-label compare-after">CINEMATIC LOOK</span>
        <div className="compare-divider" style={{left:split+'%'}}><i/></div>
      </div>
      <label className="compare-range-label">Drag to compare <strong>{split}%</strong><input aria-label="Before and after visual comparison" type="range" min="5" max="95" value={split} onChange={e=>setSplit(Number(e.target.value))}/></label>
      <small className="demo-disclaimer">Illustrative colour treatment only. This is not an actual before/after edit by MAP132.</small>
    </section>
    <div className="demo-section-heading demo-clips-heading"><span>02 / PLAYABLE REFERENCES</span><h3>Explore Sample Footage</h3><p>Tap play on each clip. These references help explain the service category and visual direction.</p></div>
    <div className="demo-video-grid">
      {visibleClips.map((clip,index)=><article className="demo-video-card" key={clip.id}>
        <div className="demo-video-frame"><video controls playsInline preload="metadata" poster={clip.poster} onPlay={e=>document.querySelectorAll("video").forEach(v=>{if(v!==e.currentTarget)v.pause();})}><source src={clip.video} type="video/mp4"/>Your browser does not support video playback.</video><span className="demo-video-number">0{index+1}</span></div>
        <div className="demo-video-copy"><span>{clip.category}</span><h4>{clip.title}</h4><p>{clip.note}</p><a href={clip.source} target="_blank" rel="noreferrer">Stock footage source ↗</a></div>
      </article>)}
      {visibleClips.length===0&&<div className="demo-empty-category"><b>{activeCategory}</b><p>Demo footage for this category is not added yet. Original MAP132 projects will appear here when published.</p></div>}
    </div>
    <p className="demo-final-note">When your own edits are ready, upload them in Dashboard. Your original portfolio items will replace this demo showcase.</p>
  </div>;
}
