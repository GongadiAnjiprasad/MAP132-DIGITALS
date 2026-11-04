import { DEMO_SHOWCASE } from './demoShowcase';
export default function DemoShowcase() {
  return <div className="demo-showcase">
    <div className="demo-showcase-intro"><span className="concept-kicker">PORTFOLIO PREVIEW / 08 CATEGORIES</span><h3>Explore the<br/><em>creative range.</em></h3><p>Stock-image moodboards for portfolio categories. These are sample visuals, not completed client edits. Add original projects in Dashboard to replace this preview.</p><b>SAMPLE SHOWCASE · NOT CLIENT WORK</b></div>
    {DEMO_SHOWCASE.map((demo,index)=><article className="demo-showcase-card" key={demo.id}><div className="demo-image-link"><img src={demo.image} alt={demo.category+' sample visual'} loading="lazy"/><span className="demo-index">0{index+1}</span><span className="demo-stock-tag">SAMPLE VISUAL</span></div><div className="demo-showcase-caption"><span>{demo.category}</span><h3>{demo.title}</h3><p>{demo.description}</p><small>{demo.style}</small></div></article>)}
  </div>;
}
