interface Env { ASSETS: Fetcher; MAP132_KV?: KVNamespace; MAP132_MEDIA?: R2Bucket; ADMIN_PASSWORD?: string; FREESOUND_API_KEY?: string; }
const DEFAULTS={profile:{name:'MAP132 DIGITALS',headline:'Every frame has a story.',intro:'Cinematic edits. Powerful stories. Visuals that stay with you.',about:'I turn raw footage into purposeful visual stories through thoughtful editing, rhythm, colour, motion and sound.',location:'India',seasonalEffect:'none',whatsapp:'',instagram:'',youtube:'',email:'',facebook:'',telegram:'',linkedin:''},skills:['Adobe Premiere Pro','After Effects','DaVinci Resolve','Cinematic Editing','Colour Grading','Motion Graphics','Sound Design','Storytelling'],items:[]};
const json=(body:unknown,status=200,headers:HeadersInit={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...Object.fromEntries(new Headers(headers))}});
const COOKIE='map132_admin';
const encoder=new TextEncoder();
function toBase64Url(bytes:Uint8Array){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}
function fromBase64Url(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function signature(payload:string,password:string){const key=await crypto.subtle.importKey('raw',encoder.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign']);return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload))));}
async function validSession(req:Request,env:Env){if(!env.ADMIN_PASSWORD)return false;const cookie=req.headers.get('Cookie')||'',match=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));if(!match)return false;const token=match.slice(COOKIE.length+1),parts=token.split('.');if(parts.length!==2)return false;try{const payload=atob(parts[0].replace(/-/g,'+').replace(/_/g,'/'));const data=JSON.parse(payload);if(!Number.isFinite(data.exp)||data.exp<Date.now())return false;return parts[1]===await signature(parts[0],env.ADMIN_PASSWORD);}catch{return false;}}
function sessionCookie(value:string,maxAge:number){return COOKIE+'='+value+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+maxAge;}

async function read(env:Env){if(!env.MAP132_KV)return DEFAULTS;try{return {...DEFAULTS,...JSON.parse(await env.MAP132_KV.get('portfolio/content')||'{}')};}catch{return DEFAULTS;}}
async function api(req:Request,env:Env){const url=new URL(req.url),path=url.pathname,method=req.method;
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
if(path==='/api/_healthcheck')return json({message:'Success'});
if(path==='/api/portfolio'&&method==='GET'){const content=await read(env);for(const item of content.items||[])if(item.path&&env.MAP132_MEDIA){item.mediaUrl='/media/'+encodeURIComponent(item.path);}return json({content});}
if(path==='/api/admin/session'&&method==='GET'){const authenticated=await validSession(req,env);return json({authenticated},authenticated?200:401);}
if(path==='/api/admin/login'&&method==='POST'){if(!env.ADMIN_PASSWORD)return json({error:'Admin password secret is not configured in Cloudflare.'},503);let body:any;try{body=await req.json();}catch{return json({error:'Invalid request.'},400);}if(typeof body.password!=='string'||body.password!==env.ADMIN_PASSWORD)return json({error:'Incorrect admin password.'},401);const payload=btoa(JSON.stringify({exp:Date.now()+8*60*60*1000})).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');const token=payload+'.'+await signature(payload,env.ADMIN_PASSWORD);return json({authenticated:true},200,{ 'Set-Cookie':sessionCookie(token,8*60*60) });}
if(path==='/api/admin/logout'&&method==='POST')return json({signedOut:true},200,{'Set-Cookie':sessionCookie('',0)});
if(!await validSession(req,env))return json({error:'Admin session required.'},401);

if(path==='/api/admin/content'&&method==='PUT'){const body=await req.json() as any;if(!body.profile||!Array.isArray(body.skills)||!Array.isArray(body.items)||body.items.length>100||body.skills.length>80)return json({error:'Invalid portfolio content.'},400);if(!env.MAP132_KV)return json({error:'Cloudflare KV binding MAP132_KV is not configured.'},503);await env.MAP132_KV.put('portfolio/content',JSON.stringify(body));return json({saved:true});}
if(path==='/api/admin/upload'&&method==='POST'){if(!env.MAP132_MEDIA)return json({error:'Cloudflare R2 media bucket is not configured yet.'},503);const allowed=['video/mp4','image/jpeg','image/png','image/webp'];const contentType=(req.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();if(!allowed.includes(contentType))return json({error:'Unsupported media type. Upload MP4, JPG, PNG or WebP.'},400);const maxBytes=90*1024*1024;const declared=Number(req.headers.get('Content-Length')||0);if(declared>maxBytes)return json({error:'File exceeds the 90 MB direct-upload limit. Use a YouTube or Google Drive link for larger videos.'},413);if(!req.body)return json({error:'No file was received.'},400);let filename='media';try{filename=decodeURIComponent(req.headers.get('X-File-Name')||'media');}catch{}const safe=filename.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-90)||'media';const key='portfolio/uploads/'+Date.now()+'-'+crypto.randomUUID()+'-'+safe;await env.MAP132_MEDIA.put(key,req.body,{httpMetadata:{contentType}});return json({path:key});}if(path==='/api/admin/delete-media'&&method==='POST'){if(!env.MAP132_MEDIA)return json({error:'Media bucket is not configured.'},503);const body=await req.json() as any;if(!String(body.path||'').startsWith('portfolio/uploads/'))return json({error:'Invalid path.'},400);await env.MAP132_MEDIA.delete(body.path);return json({deleted:true});}
if(path.startsWith('/media/')&&method==='GET'&&env.MAP132_MEDIA){const key=decodeURIComponent(path.slice(7)),obj=await env.MAP132_MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public, max-age=3600'}});}
return json({error:'Not found'},404);}
export default {async fetch(req:Request,env:Env){const url=new URL(req.url);if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/media/'))return api(req,env);return env.ASSETS.fetch(req);}};
