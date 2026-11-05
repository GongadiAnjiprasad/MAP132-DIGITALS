import { useState } from 'react';

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

export default IndianFestivalAtmosphere;
