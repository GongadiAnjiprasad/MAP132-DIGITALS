import { FESTIVAL_CALENDAR, getIndiaDateKey } from '../src/modules/seasonal/festivalCalendar';
import { createFeedbackResponse } from './feedback';
import { clearMyDriveSession, getPublishedDriveAccessToken, handleMyDriveOAuth } from '../src/modules/my-drive-resource-manager/driveOAuth';
import { handleMyDriveAssets } from './myDriveAssets';
interface Env { ASSETS: Fetcher; MAP132_KV?: KVNamespace; MAP132_MEDIA?: R2Bucket; ADMIN_PASSWORD?: string; FREESOUND_API_KEY?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; GOOGLE_PICKER_API_KEY?: string; MY_DRIVE_SESSION_SECRET?: string; AI?: { run(model: string, inputs: Record<string, unknown>): Promise<{ image?: string; translated_text?: string; translations?: string[] }> }; }
const DEFAULTS={profile:{name:'MAP132 DIGITALS',headline:'Every frame has a story.',intro:'Cinematic edits. Powerful stories. Visuals that stay with you.',about:'I turn raw footage into purposeful visual stories through thoughtful editing, rhythm, colour, motion and sound.',location:'India',seasonalEffect:'none',whatsapp:'',instagram:'',youtube:'',email:'',facebook:'',telegram:'',linkedin:''},skills:['Adobe Premiere Pro','After Effects','DaVinci Resolve','Cinematic Editing','Colour Grading','Motion Graphics','Sound Design','Storytelling'],items:[]};
const json=(body:unknown,status=200,headers:HeadersInit={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...Object.fromEntries(new Headers(headers))}});
const COOKIE='map132_admin';
const encoder=new TextEncoder();
function toBase64Url(bytes:Uint8Array){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
function fromBase64Url(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function signature(payload:string,password:string){const key=await crypto.subtle.importKey('raw',encoder.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign']);return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload))));}
async function validSession(req:Request,env:Env){if(!env.ADMIN_PASSWORD)return false;const cookie=req.headers.get('Cookie')||'',match=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));if(!match)return false;const token=match.slice(COOKIE.length+1),parts=token.split('.');if(parts.length!==2)return false;try{const payload=atob(parts[0].replace(/-/g,'+').replace(/_/g,'/'));const data=JSON.parse(payload);if(!Number.isFinite(data.exp)||data.exp<Date.now())return false;return parts[1]===await signature(parts[0],env.ADMIN_PASSWORD);}catch{return false;}}
function sessionCookie(value:string,maxAge:number){return COOKIE+'='+value+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+maxAge;}

async function read(env:Env){
  if(!env.MAP132_KV)return DEFAULTS;
  try{
    const stored=JSON.parse(await env.MAP132_KV.get('portfolio/content')||'{}');
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return DEFAULTS;
    const sourceProfile=stored.profile&&typeof stored.profile==='object'&&!Array.isArray(stored.profile)?stored.profile:{};
    const profile:any={...DEFAULTS.profile};
    for(const key of Object.keys(DEFAULTS.profile)){if(typeof sourceProfile[key]==='string')profile[key]=sourceProfile[key];}
    const skills=Array.isArray(stored.skills)?stored.skills.filter((value:any)=>typeof value==='string'&&value.trim()):DEFAULTS.skills;
    const items=Array.isArray(stored.items)?stored.items.filter((item:any)=>item&&typeof item==='object'&&!Array.isArray(item)).map((item:any,index:number)=>({
      ...item,
      id:typeof item.id==='string'&&item.id?item.id:'project-'+index,
      title:typeof item.title==='string'?item.title:'Untitled project',
      category:typeof item.category==='string'?item.category:'Other Projects',
      description:typeof item.description==='string'?item.description:'',
      kind:['video','image','link'].includes(item.kind)?item.kind:'link',
      url:typeof item.url==='string'?item.url:'',
      path:typeof item.path==='string'?item.path:'',
      mediaUrl:typeof item.mediaUrl==='string'?item.mediaUrl:'',
      source:['upload','youtube','drive','other'].includes(item.source)?item.source:undefined
    })):DEFAULTS.items;
    const resources=Array.isArray(stored.resources)?stored.resources.filter((item:any)=>item&&typeof item==='object'&&!Array.isArray(item)).map((item:any,index:number)=>({
      ...item,
      id:typeof item.id==='string'&&item.id?item.id:'resource-'+index,
      title:typeof item.title==='string'?item.title:'Untitled resource',
      category:typeof item.category==='string'?item.category:'Editing Assets',
      detail:typeof item.detail==='string'?item.detail:'',
      href:typeof item.href==='string'?item.href:'',
      provider:typeof item.provider==='string'?item.provider:'',
      licence:typeof item.licence==='string'?item.licence:'Check the original provider licence before commercial use.',
      compatibility:typeof item.compatibility==='string'?item.compatibility:'',
      tags:Array.isArray(item.tags)?item.tags.filter((tag:any)=>typeof tag==='string'):[],
      kind:['audio','video','image','template','font','other'].includes(item.kind)?item.kind:'other',
      previewUrl:typeof item.previewUrl==='string'?item.previewUrl:'',
      downloadUrl:typeof item.downloadUrl==='string'?item.downloadUrl:''
    })):[]; 
    return {...DEFAULTS,...stored,profile,skills,items,resources,logoPath:typeof stored.logoPath==='string'&&stored.logoPath.startsWith('portfolio/logos/')?stored.logoPath:''};
  }catch{return DEFAULTS;}
}
async function api(req:Request,env:Env){const url=new URL(req.url),path=url.pathname,method=req.method;if(path.startsWith('/api/portfolio/video/')&&method==='GET'){
 const fileId=path.slice('/api/portfolio/video/'.length);
 if(!/^[a-zA-Z0-9_-]{1,256}$/.test(fileId))return json({error:'Invalid portfolio video ID.'},400);
 const content=await read(env);
 const published=(content.items||[]).some((item:any)=>item&&item.kind==='video'&&item.source==='drive'&&item.driveFileId===fileId&&typeof item.driveFolderId==='string');
 if(!published)return json({error:'This video is not published in the MAP132 portfolio.'},404);
 const accessToken=await getPublishedDriveAccessToken(env);
 if(!accessToken)return json({error:'Google Drive playback is unavailable. Reconnect Google Drive from the Admin Dashboard.'},503);
 const authHeaders={Authorization:'Bearer '+accessToken,Accept:'application/json'};
 const metadataUrl=new URL('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId));
 metadataUrl.searchParams.set('fields','id,mimeType,trashed');
 const metadataResponse=await fetch(metadataUrl,{headers:authHeaders});
 if(!metadataResponse.ok)return json({error:'Google Drive could not verify this published video.'},metadataResponse.status===404?404:502);
 const metadata=await metadataResponse.json() as {id?:string;mimeType?:string;trashed?:boolean};
 if(metadata.trashed||!String(metadata.mimeType||'').startsWith('video/'))return json({error:'The published Drive item is not an available video file.'},415);
 const upstreamUrl=new URL('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId));
 upstreamUrl.searchParams.set('alt','media');
 const upstreamHeaders:Record<string,string>={Authorization:'Bearer '+accessToken,Accept:'*/*'};
 const range=req.headers.get('Range');
 if(range)upstreamHeaders.Range=range;
 const upstream=await fetch(upstreamUrl,{headers:upstreamHeaders});
 if(!upstream.ok||!upstream.body)return json({error:'Google Drive could not stream this published video.'},upstream.status===404?404:upstream.status===416?416:502);
 const headers=new Headers({
  'Content-Type':upstream.headers.get('Content-Type')||'video/mp4',
  'Cache-Control':'public, max-age=60, stale-while-revalidate=300',
  'Accept-Ranges':upstream.headers.get('Accept-Ranges')||'bytes',
  'X-Content-Type-Options':'nosniff',
  'Content-Disposition':'inline',
  'X-Robots-Tag':'noindex',
 });
 for(const name of ['Content-Length','Content-Range','Last-Modified','ETag']){const value=upstream.headers.get(name);if(value)headers.set(name,value);}
 return new Response(upstream.body,{status:upstream.status,headers});
}if(path.startsWith('/api/my-drive/')){if(path==='/api/my-drive/logout'&&method==='POST'){const headers=await clearMyDriveSession(req,env);return json({signedOut:true},200,headers);}const oauthCallback=path==='/api/my-drive/oauth/callback'&&method==='GET';if(!oauthCallback&&!await validSession(req,env))return json({error:'MAP132 Admin login required. Sign in to the Admin Dashboard to access My Drive.'},401);}const driveAssetsResponse=await handleMyDriveAssets(req,env);if(driveAssetsResponse)return driveAssetsResponse;const driveOAuthResponse=await handleMyDriveOAuth(req,env);if(driveOAuthResponse)return driveOAuthResponse;
if(path.startsWith('/api/resources/sounds/')&&path.endsWith('/preview')&&method==='GET'){
  if(!env.FREESOUND_API_KEY)return json({error:'Sound preview is not connected.'},503);
  const id=path.split('/')[4];
  if(!/^\d+$/.test(id))return json({error:'Invalid sound id.'},400);
  const detailUrl=new URL('https://freesound.org/apiv2/sounds/'+id+'/');
  detailUrl.searchParams.set('fields','id,previews');
  detailUrl.searchParams.set('token',env.FREESOUND_API_KEY);
  const detailResponse=await fetch(detailUrl.toString(),{headers:{'Accept':'application/json'}});
  if(!detailResponse.ok)return json({error:'Could not retrieve this sound preview.'},502);
  const sound:any=await detailResponse.json();
  const preview=sound.previews?.['preview-hq-mp3']||sound.previews?.['preview-lq-mp3'];
  let previewUrl:URL;try{previewUrl=new URL(String(preview||''));}catch{return json({error:'This sound has no playable MP3 preview.'},404);}
  if(previewUrl.protocol!=='https:'||!['freesound.org','cdn.freesound.org'].includes(previewUrl.hostname))return json({error:'Preview source is not supported.'},404);
  const audioResponse=await fetch(previewUrl.toString(),{headers:{'Accept':'audio/mpeg'}});
  if(!audioResponse.ok||!audioResponse.body)return json({error:'The source could not stream this preview.'},502);
  return new Response(audioResponse.body,{headers:{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
if(path.startsWith('/api/resources/sounds/')&&path.endsWith('/download')&&method==='GET'){
  if(!env.FREESOUND_API_KEY)return json({error:'Sound download is not connected.'},503);
  const id=path.split('/')[4];
  if(!/^\d+$/.test(id))return json({error:'Invalid sound id.'},400);
  const detailUrl=new URL('https://freesound.org/apiv2/sounds/'+id+'/');
  detailUrl.searchParams.set('fields','id,name,license,previews');
  detailUrl.searchParams.set('token',env.FREESOUND_API_KEY);
  const detailResponse=await fetch(detailUrl.toString(),{headers:{'Accept':'application/json'}});
  if(!detailResponse.ok)return json({error:'Could not retrieve sound details.'},502);
  const sound:any=await detailResponse.json();
  const licence=String(sound.license||'').toLowerCase();
  const allowed=licence.includes('creativecommons.org/publicdomain/zero/')||(licence.includes('creativecommons.org/licenses/by/')&&!licence.includes('/by-nc/'));
  if(!allowed)return json({error:'This sound is not eligible for download.'},403);
  const preview=sound.previews?.['preview-hq-mp3']||sound.previews?.['preview-lq-mp3'];
  let previewUrl:URL;try{previewUrl=new URL(String(preview||''));}catch{return json({error:'Preview download unavailable.'},404);}if(previewUrl.protocol!=='https:'||!['freesound.org','cdn.freesound.org'].includes(previewUrl.hostname))return json({error:'Preview download unavailable.'},404);
  const fileResponse=await fetch(preview);
  if(!fileResponse.ok)return json({error:'Could not download preview.'},502);
  const safeName=String(sound.name||'sound-preview').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80)||'sound-preview';
  return new Response(fileResponse.body,{headers:{'Content-Type':'audio/mpeg','Content-Disposition':'attachment; filename="'+safeName+'.mp3"','Cache-Control':'no-store'}});
}
if(path==='/api/resources/sounds'&&method==='GET'){
  if(!env.FREESOUND_API_KEY)return json({error:'Sound search is not connected yet. Add the FREESOUND_API_KEY secret in Cloudflare.'},503);
  const query=(url.searchParams.get('query')||'').trim().slice(0,100);
  const page=Math.max(1,Math.min(1000,Number(url.searchParams.get('page')||1)));
  if(!query)return json({results:[],count:0});
  const upstream=new URL('https://freesound.org/apiv2/search/');
  upstream.searchParams.set('query',query);
  upstream.searchParams.set('page',String(page));
  upstream.searchParams.set('page_size','100');
  upstream.searchParams.set('fields','id,name,username,license,previews,duration,tags,url,description');
  upstream.searchParams.set('token',env.FREESOUND_API_KEY);
  const response=await fetch(upstream.toString(),{headers:{'Accept':'application/json'}});
  if(!response.ok)return json({error:response.status===401?'Freesound API key was rejected. Check the Cloudflare secret.':'Sound provider request failed. Please try again.'},502);
  const data:any=await response.json();
  const allowed=(data.results||[]).filter((sound:any)=>{const licence=String(sound.license||'').toLowerCase();return licence.includes('creativecommons.org/publicdomain/zero/')||(licence.includes('creativecommons.org/licenses/by/')&&!licence.includes('/by-nc/'));});
  return json({count:data.count||0,providerCount:data.count||0,allowedCount:allowed.length,page,nextPage:data.next?page+1:null,previousPage:data.previous?page-1:null,results:allowed.map((sound:any)=>({id:sound.id,title:sound.name,creator:sound.username,license:sound.license,duration:sound.duration,previewUrl:sound.previews?.['preview-hq-mp3']||sound.previews?.['preview-lq-mp3']||'',sourceUrl:sound.url||('https://freesound.org/s/'+sound.id+'/'),tags:sound.tags||[],description:sound.description||''}))});
}
if(path==='/api/resources/fonts'&&method==='GET'){
  const forceRefresh=url.searchParams.get('refresh')==='1';
  const cacheKey=new Request(new URL('/api/resources/fonts?catalogue=google-v1',url.origin).toString());
  const cache=caches.default;
  const cached=await cache.match(cacheKey);
  if(cached&&!forceRefresh)return cached;
  const upstream=await fetch('https://fonts.google.com/metadata/fonts',{headers:{'Accept':'application/json','User-Agent':'MAP132-DIGITALS-font-catalogue/1.0'}});
  if(!upstream.ok)return json({error:'Google Fonts metadata is temporarily unavailable.'},502);
  const raw=await upstream.text();
  const start=raw.indexOf('{');
  if(start<0)return json({error:'Google Fonts returned an unreadable catalogue.'},502);
  let catalogue:any;try{catalogue=JSON.parse(raw.slice(start));}catch{return json({error:'Google Fonts catalogue could not be parsed.'},502);}
  const families=Array.isArray(catalogue.familyMetadataList)?catalogue.familyMetadataList:Array.isArray(catalogue.items)?catalogue.items:[];
  if(!families.length)return json({error:'Google Fonts returned no families.'},502);
  const fonts=families.map((font:any)=>({family:String(font.family||font.name||'').trim(),category:String(font.category||'sans-serif'),subsets:Array.isArray(font.subsets)?font.subsets:[],lastModified:String(font.lastModified||''),tags:Array.isArray(font.tags)?font.tags:[]})).filter((font:any)=>font.family);
  const response=json({source:'google-fonts-metadata',count:fonts.length,updatedAt:new Date().toISOString(),fonts},200,{'Cache-Control':'public, max-age=21600, s-maxage=21600'});
  await cache.put(cacheKey,response.clone());
  return response;
}
if(path==='/api/festival-greeting'&&method==='GET'){
  const today=getIndiaDateKey();
  const festival=FESTIVAL_CALENDAR.find(item=>item.date===today);
  if(!festival)return json({active:false},200,{'Cache-Control':'public, max-age=300, s-maxage=300'});
  const image=env.MAP132_KV?await env.MAP132_KV.get('festival/greeting/'+today):null;
  return json({active:true,ready:Boolean(image),image:image||null,festival},200,{'Cache-Control':'public, max-age=30, s-maxage=30'});
}
if(path==='/api/_healthcheck')return json({message:'Success'});
if(path==='/api/feedback'&&method==='POST'){
  if(!env.MAP132_KV)return json({error:'Feedback storage is not configured.'},503);
  let body:any;try{body=await req.json();}catch{return json({error:'Invalid feedback data.'},400);}
  const kind=body.kind==='Website Experience'?'Website Experience':'Work feedback';
  const service=String(body.service||'').trim(),message=String(body.message||'').trim(),email=String(body.email||'').trim(),rating=Number(body.rating);
  const allowedServices=['Cinematic Trailers','Wedding / B’Day','Advertisements','AI Services','Insta Reels','YouTube Related','Overall Studio Experience'];
  if(kind==='Work feedback'&&!allowedServices.includes(service))return json({error:'Choose the MAP132 service you are reviewing.'},400);
  if(kind==='Website Experience'&&service)return json({error:'Website feedback must not include a service selection.'},400);
  if(message.length<1||message.length>2000)return json({error:'Enter feedback between 1 and 2000 characters.'},400);
  if(email.length>254|| (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return json({error:'Enter a valid email address.'},400);
  if(!Number.isInteger(rating)||rating<1||rating>5)return json({error:'Choose a rating from 1 to 5.'},400);
  const aspects=Array.isArray(body.aspects)?body.aspects.filter((x:any)=>typeof x==='string').slice(0,8).map((x:string)=>x.slice(0,80)):[];
  if(kind==='Work feedback'&&Array.isArray(body.aspects)&&body.aspects.length)return json({error:'Service feedback cannot include website aspects.'},400);
  if(body.publicConsent!==true)return json({error:'Please confirm that you understand your feedback may be displayed publicly. Your email will remain private.'},400);
  const reply=createFeedbackResponse(message,rating);
  const ip=req.headers.get('CF-Connecting-IP')||'unknown';
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(ip));
  const rateKey='feedback-rate/'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const current=Number(await env.MAP132_KV.get(rateKey)||0);
  if(current>=3)return json({error:'Too many submissions. Please try again later.'},429);
  await env.MAP132_KV.put(rateKey,String(current+1),{expirationTtl:600});
  const id=Date.now().toString(36)+'-'+crypto.randomUUID();
  const createdAt=new Date().toISOString();
  const cfCountry=(req as Request & {cf?:{country?:string}}).cf?.country;
  const countryCode=typeof cfCountry==='string'&&/^[A-Za-z]{2}$/.test(cfCountry)&&!['XX','T1'].includes(cfCountry.toUpperCase())?cfCountry.toUpperCase():undefined;
  const entry={id,kind,countryCode,service:service||undefined,aspects,rating,message,email,publicConsent:true,consentSource:'client',consentRecordedAt:createdAt,published:reply.publishable,publishedAt:reply.publishable?createdAt:null,responseType:reply.type,responseLanguage:reply.language,response:reply.reply,createdAt,status:reply.publishable?'published':reply.type};
  await env.MAP132_KV.put('feedback/'+id,JSON.stringify(entry));
  return json({submitted:true,id,reply:reply.reply,responseType:reply.type,responseLanguage:reply.language,published:reply.publishable},201);
}

if(path==='/api/enquiries'&&method==='POST'){
   if(!env.MAP132_KV)return json({error:'Enquiry storage is not configured.'},503);
   let body:any;try{body=await req.json();}catch{return json({error:'Invalid enquiry data.'},400);}
   const name=String(body.name||'').trim(),email=String(body.email||'').trim(),phone=String(body.phone||'').trim(),service=String(body.service||'').trim(),details=String(body.details||'').trim();
   if(!name||!email||!phone||!service)return json({error:'Please complete all required fields.'},400);
   if(name.length>120||email.length>254||phone.length>40||service.length>180||details.length>4000)return json({error:'One or more fields are too long.'},400);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Please enter a valid email address.'},400);
   const id=Date.now().toString(36)+'-'+crypto.randomUUID();
   const entry={id,name,email,phone,service,details,createdAt:new Date().toISOString(),status:'new'};
   await env.MAP132_KV.put('enquiries/'+id,JSON.stringify(entry));
   return json({submitted:true,id},201);
 }
if(path==='/api/translate'&&method==='POST'){
  if(!env.AI)return json({error:'Translation service is not available right now. Please try again later.'},503);
  let body:any;try{body=await req.json();}catch{return json({error:'Invalid translation request.'},400);}
  const sourceText=typeof body.text==='string'?body.text.trim():'';
  const targetLanguage=body.targetLanguage;
  if(!sourceText||sourceText.length>2000)return json({error:'Feedback text must be between 1 and 2000 characters.'},400);
  if(targetLanguage!=='te'&&targetLanguage!=='en')return json({error:'Choose Telugu or English translation.'},400);
  const sourceLanguage=/[\u0C00-\u0C7F]/.test(sourceText)?'te':/[\u0900-\u097F]/.test(sourceText)?'hi':'en';
  if(sourceLanguage===targetLanguage)return json({translatedText:sourceText,sourceLanguage,targetLanguage});
  try{
    const targetModelLanguage=targetLanguage==='te'?'tel_Telu':'eng_Latn';
    const result=await env.AI.run('@cf/ai4bharat/indictrans2-en-indic-1B',{text:sourceText,target_language:targetModelLanguage});
    const translatedText=Array.isArray(result.translations)?String(result.translations[0]||'').trim():'';
    if(!translatedText)return json({error:'The translation service returned an empty result. Please try again.'},502);
    return json({translatedText,sourceLanguage,targetLanguage});
  }catch{return json({error:'Translation could not be completed right now. Please try again.'},502);}
}
if(path==='/api/reviews'&&method==='GET'){if(!env.MAP132_KV)return json({reviews:[]});const listed=await env.MAP132_KV.list({prefix:'feedback/',limit:100});const entries=await Promise.all(listed.keys.filter(key=>!key.name.startsWith('feedback-rate/')).map(async key=>{const value=await env.MAP132_KV!.get(key.name);if(!value)return null;try{return JSON.parse(value);}catch{return null;}}));const reviews=entries.filter((item:any)=>item&&['Website Experience','Work feedback'].includes(item.kind)&&item.publicConsent===true&&item.responseType!=='enquiry').map((item:any)=>({id:item.id,kind:item.kind,service:item.kind==='Website Experience'?'Website Experience':item.service||'Video Editing',rating:item.rating,message:item.message,response:item.response||'',responseType:item.responseType||'general',responseLanguage:item.responseLanguage||'en',createdAt:item.createdAt})).sort((a:any,b:any)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({reviews});}
if(path==='/api/portfolio'&&method==='GET'){const content=await read(env);for(const item of content.items||[])if(item.path&&env.MAP132_MEDIA){item.mediaUrl='/media/'+encodeURIComponent(item.path);}content.logoUrl=content.logoPath?'/media/'+encodeURIComponent(content.logoPath):'/resources/Logo.png';return json({content});}
if(path==='/api/admin/session'&&method==='GET'){const authenticated=await validSession(req,env);return json({authenticated},authenticated?200:401);}
if(path==='/api/admin/login'&&method==='POST'){let stage='check admin secret';try{if(!env.ADMIN_PASSWORD)return json({error:'Admin password secret is not configured in Cloudflare.'},503);stage='parse login request';let body:any;try{body=await req.json();}catch{return json({error:'Invalid request.'},400);}stage='validate password';if(typeof body.password!=='string'||body.password!==env.ADMIN_PASSWORD)return json({error:'Incorrect admin password.'},401);stage='create session payload';const payload=toBase64Url(encoder.encode(JSON.stringify({exp:Date.now()+8*60*60*1000})));stage='sign session token';const signed=await signature(payload,env.ADMIN_PASSWORD);const token=payload+'.'+signed;stage='create login response';return json({authenticated:true},200,{ 'Set-Cookie':sessionCookie(token,8*60*60) });}catch(error){const detail=error instanceof Error?error.message:'Unknown error';const name=error instanceof Error?error.name:'Error';return json({error:'Admin login failed at stage "'+stage+'" ('+name+'): '+detail},500);}}
if(path==='/api/admin/logout'&&method==='POST'){const headers=await clearMyDriveSession(req,env);headers.append('Set-Cookie',sessionCookie('',0));headers.set('Content-Type','application/json; charset=utf-8');headers.set('Cache-Control','no-store');return new Response(JSON.stringify({signedOut:true}),{status:200,headers});}
if(!await validSession(req,env))return json({error:'Admin session required.'},401);

if(path==='/api/admin/feedback'&&method==='GET'){
  if(!env.MAP132_KV)return json({error:'Feedback storage is not configured.'},503);
  const responseMigrationKey='meta/feedback-topic-replies-v2';
  if(!(await env.MAP132_KV.get(responseMigrationKey))){
    let cursor:string|undefined;
    do{
      const page=await env.MAP132_KV.list({prefix:'feedback/',limit:1000,...(cursor?{cursor}:{})});
      for(const key of page.keys){
        const stored=await env.MAP132_KV.get(key.name);
        if(!stored)continue;
        let item:any;try{item=JSON.parse(stored);}catch{continue;}
        if(typeof item.message!=='string'||!Number.isFinite(Number(item.rating)))continue;
        const personalized=createFeedbackResponse(item.message,Number(item.rating));
        item.response=personalized.reply;
        item.responseType=personalized.type;
        item.responseLanguage=personalized.language;
        await env.MAP132_KV.put(key.name,JSON.stringify(item));
      }
      cursor=page.cursor;
    }while(cursor);
    await env.MAP132_KV.put(responseMigrationKey,new Date().toISOString());
  }
  const listed=await env.MAP132_KV.list({prefix:'feedback/',limit:100});
  const entries=await Promise.all(listed.keys.filter(key=>!key.name.startsWith('feedback-rate/')).map(async key=>{const value=await env.MAP132_KV!.get(key.name);if(!value)return null;try{return JSON.parse(value);}catch{return null;}}));
  return json({feedback:entries.filter(Boolean).sort((a:any,b:any)=>String(b.createdAt).localeCompare(String(a.createdAt)))});
}
if(path.startsWith('/api/admin/feedback/')&&method==='POST'){if(!env.MAP132_KV)return json({error:'Feedback storage is not configured.'},503);const parts=path.split('/').filter(Boolean),id=decodeURIComponent(parts[3]||''),action=parts[4];if(!/^[a-z0-9-]+$/i.test(id)||!['publish','publish-with-consent','unpublish'].includes(action))return json({error:'Invalid feedback publication action.'},400);const key='feedback/'+id,value=await env.MAP132_KV.get(key);if(!value)return json({error:'Feedback entry not found.'},404);let item:any;try{item=JSON.parse(value);}catch{return json({error:'Feedback entry is invalid.'},500);}if(action==='publish'&&(item.kind!=='Work feedback'||item.publicConsent!==true))return json({error:'This review does not have permission for public display.'},403);if(action==='publish-with-consent'){if(item.kind!=='Work feedback')return json({error:'Only service reviews can be published.'},400);item.publicConsent=true;item.consentSource='admin-confirmed';item.consentRecordedAt=new Date().toISOString();}item.published=action!=='unpublish';item.publishedAt=item.published?new Date().toISOString():null;await env.MAP132_KV.put(key,JSON.stringify(item));return json({published:item.published,publicConsent:item.publicConsent===true,consentSource:item.consentSource||'client'});}
if(path.startsWith('/api/admin/feedback/')&&method==='DELETE'){
  if(!env.MAP132_KV)return json({error:'Feedback storage is not configured.'},503);
  const id=decodeURIComponent(path.slice('/api/admin/feedback/'.length));
  if(!/^[a-z0-9-]+$/i.test(id))return json({error:'Invalid feedback id.'},400);
  await env.MAP132_KV.delete('feedback/'+id);
  return json({deleted:true});
}
if(path==='/api/admin/enquiries'&&method==='GET'){
   if(!env.MAP132_KV)return json({error:'Enquiry storage is not configured.'},503);
   const listed=await env.MAP132_KV.list({prefix:'enquiries/',limit:100});
   const entries=await Promise.all(listed.keys.map(async key=>{const value=await env.MAP132_KV!.get(key.name);if(!value)return null;try{return JSON.parse(value);}catch{return null;}}));
   return json({enquiries:entries.filter(Boolean).sort((a:any,b:any)=>String(b.createdAt).localeCompare(String(a.createdAt)))});
 }
 if(path.startsWith('/api/admin/enquiries/')&&method==='DELETE'){
   if(!env.MAP132_KV)return json({error:'Enquiry storage is not configured.'},503);
   const id=decodeURIComponent(path.slice('/api/admin/enquiries/'.length));
   if(!/^[a-z0-9-]+$/i.test(id))return json({error:'Invalid enquiry id.'},400);
   await env.MAP132_KV.delete('enquiries/'+id);
   return json({deleted:true});
 }
 if(path==='/api/admin/content'&&method==='PUT'){const body=await req.json() as any;if(!body.profile||!Array.isArray(body.skills)||!Array.isArray(body.items)||body.items.length>100||body.skills.length>80)return json({error:'Invalid portfolio content.'},400);if(body.logoPath!==undefined&&(typeof body.logoPath!=='string'||(body.logoPath!==''&&!body.logoPath.startsWith('portfolio/logos/'))||body.logoPath.length>220))return json({error:'Invalid logo image path.'},400);if(!env.MAP132_KV)return json({error:'Cloudflare KV binding MAP132_KV is not configured.'},503);const {logoUrl,...storedBody}=body;await env.MAP132_KV.put('portfolio/content',JSON.stringify(storedBody));return json({saved:true});}
if(path==='/api/admin/upload-logo'&&method==='POST'){if(!env.MAP132_MEDIA&&!env.MAP132_KV)return json({error:'Logo storage is not configured. Configure MAP132_KV or MAP132_MEDIA.'},503);const contentType=(req.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();if(!['image/png','image/jpeg','image/webp'].includes(contentType))return json({error:'Upload a PNG, JPG or WebP logo image.'},400);if(!req.body)return json({error:'No logo image was received.'},400);const bytes=await req.arrayBuffer();if(bytes.byteLength>5*1024*1024)return json({error:'Logo image must be 5 MB or smaller.'},413);if(!bytes.byteLength)return json({error:'The selected logo image is empty.'},400);const signatureBytes=new Uint8Array(bytes);const validPng=contentType==='image/png'&&signatureBytes.length>=8&&signatureBytes[0]===137&&signatureBytes[1]===80&&signatureBytes[2]===78&&signatureBytes[3]===71&&signatureBytes[4]===13&&signatureBytes[5]===10&&signatureBytes[6]===26&&signatureBytes[7]===10;const validJpeg=contentType==='image/jpeg'&&signatureBytes.length>=3&&signatureBytes[0]===255&&signatureBytes[1]===216&&signatureBytes[2]===255;const validWebp=contentType==='image/webp'&&signatureBytes.length>=12&&String.fromCharCode(...signatureBytes.slice(0,4))==='RIFF'&&String.fromCharCode(...signatureBytes.slice(8,12))==='WEBP';if(!validPng&&!validJpeg&&!validWebp)return json({error:'The file contents do not match a supported PNG, JPG or WebP image.'},400);let filename='logo';try{filename=decodeURIComponent(req.headers.get('X-File-Name')||'logo');}catch{}const safe=filename.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-70)||'logo';const key='portfolio/logos/'+Date.now()+'-'+crypto.randomUUID()+'-'+safe;if(env.MAP132_MEDIA)await env.MAP132_MEDIA.put(key,bytes,{httpMetadata:{contentType,cacheControl:'public, max-age=31536000, immutable'}});else await env.MAP132_KV!.put(key,bytes,{metadata:{contentType}});return json({path:key});}
if(path==='/api/admin/upload'&&method==='POST'){if(!env.MAP132_MEDIA)return json({error:'Cloudflare R2 media bucket is not configured yet.'},503);const allowed=['video/mp4','image/jpeg','image/png','image/webp'];const contentType=(req.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();if(!allowed.includes(contentType))return json({error:'Unsupported media type. Upload MP4, JPG, PNG or WebP.'},400);const maxBytes=90*1024*1024;const declared=Number(req.headers.get('Content-Length')||0);if(declared>maxBytes)return json({error:'File exceeds the 90 MB direct-upload limit. Use a YouTube or Google Drive link for larger videos.'},413);if(!req.body)return json({error:'No file was received.'},400);let filename='media';try{filename=decodeURIComponent(req.headers.get('X-File-Name')||'media');}catch{}const safe=filename.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-90)||'media';const key='portfolio/uploads/'+Date.now()+'-'+crypto.randomUUID()+'-'+safe;await env.MAP132_MEDIA.put(key,req.body,{httpMetadata:{contentType}});return json({path:key});}if(path==='/api/admin/delete-media'&&method==='POST'){if(!env.MAP132_MEDIA)return json({error:'Media bucket is not configured.'},503);const body=await req.json() as any;if(!String(body.path||'').startsWith('portfolio/uploads/'))return json({error:'Invalid path.'},400);await env.MAP132_MEDIA.delete(body.path);return json({deleted:true});}
if(path.startsWith('/media/')&&method==='GET'){const key=decodeURIComponent(path.slice(7));if(env.MAP132_MEDIA){const obj=await env.MAP132_MEDIA.get(key);if(obj)return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':obj.httpMetadata?.cacheControl||'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}if(key.startsWith('portfolio/logos/')&&env.MAP132_KV){const stored=await env.MAP132_KV.getWithMetadata(key,{type:'arrayBuffer'});if(stored.value)return new Response(stored.value as ArrayBuffer,{headers:{'Content-Type':(stored.metadata as any)?.contentType||'application/octet-stream','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}return new Response('Not found',{status:404});}
return json({error:'Not found'},404);}
export default {
  async fetch(req:Request,env:Env){
    const url=new URL(req.url);
    if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/media/')){
      try{return await api(req,env);}
      catch(error){
        const detail=error instanceof Error?error.message:'Unknown worker exception';
        const name=error instanceof Error?error.name:'Error';
        return json({error:'Worker API exception ('+name+'): '+detail},500,{'Cache-Control':'no-store'});
      }
    }
    try{return await env.ASSETS.fetch(req);}
    catch{return new Response('Website asset service unavailable.',{status:502});}
  },
  async scheduled(controller:ScheduledController,env:Env){
    if(controller.cron==='*/5 * * * *'){
      try{await syncDrivePortfolioFromFolder(env);}
      catch(error){console.error('Drive portfolio scheduled sync failed:',error instanceof Error?error.message:'Unknown error');}
      return;
    }
    if(controller.cron!=='35 18 * * *')return;
    const today=getIndiaDateKey(new Date(controller.scheduledTime));
    const festival=FESTIVAL_CALENDAR.find(item=>item.date===today);
    if(!festival||!env.AI||!env.MAP132_KV)return;
    const key='festival/greeting/'+today;
    if(await env.MAP132_KV.get(key))return;
    const prompt='Create a premium, elegant, cinematic festival background image for '+festival.name+
      ' in India. Theme: '+festival.theme+'. Visual elements: '+festival.emoji+
      '. Rich layered atmosphere, refined warm lighting, tasteful festive details, sophisticated gold accents, beautiful depth, high-end visual design for a professional video editing studio website. Wide composition with a clean central area for a separately overlaid logo and greeting. Absolutely no text, no letters, no words, no logos, no watermark.';
    const generated=await env.AI.run('@cf/black-forest-labs/flux-1-schnell',{
      prompt,steps:4
    });
    if(typeof generated?.image!=='string'||!generated.image)throw new Error('Workers AI returned no festival image.');
    await env.MAP132_KV.put(key,generated.image,{expirationTtl:259200});
  }
};
