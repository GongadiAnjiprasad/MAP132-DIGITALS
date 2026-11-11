interface AssetEnv { MAP132_KV?: KVNamespace; MAP132_MEDIA?: R2Bucket; }
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowedExt=new Set(['ttf','otf','woff','woff2','mp3','wav','ogg','m4a','mp4','webm','mov','jpg','jpeg','png','webp','gif','zip']);
const maxBytes=100*1024*1024;
function safeName(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'asset';}
async function authorized(req:Request,env:AssetEnv){
 const cookies=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim());
 const unlock=cookies.find(x=>x.startsWith('map132_drive_unlock='))?.slice('map132_drive_unlock='.length);
 const drive=cookies.find(x=>x.startsWith('map132_drive_session='))?.slice('map132_drive_session='.length);
 if(!unlock||!drive||!env.MAP132_KV)return false;
 try {const u=decodeURIComponent(unlock),d=decodeURIComponent(drive);return Boolean(await env.MAP132_KV.get('my-drive/unlock/'+u)&&await env.MAP132_KV.get('my-drive/session/'+d));}catch{return false;}
}
/** Durable private My Drive resource storage. Source Drive files remain read-only. */
export async function handleMyDriveAssets(req:Request,env:AssetEnv):Promise<Response|null>{
 const url=new URL(req.url),path=url.pathname;
 if(!path.startsWith('/api/my-drive/assets'))return null;
 if(!env.MAP132_KV||!env.MAP132_MEDIA)return json({error:'Persistent My Drive storage is not configured. Bind MAP132_KV and MAP132_MEDIA.'},503);
 if(!await authorized(req,env))return json({error:'Unlock My Drive and connect Google Drive before accessing saved resources.'},423);
 if(path==='/api/my-drive/assets'&&req.method==='GET'){
  const page=Math.max(1,Math.min(100,Number(url.searchParams.get('limit')||50)));
  const listed=await env.MAP132_KV.list({prefix:'my-drive/assets/',limit:page});
  const records=await Promise.all(listed.keys.map(async key=>{const value=await env.MAP132_KV!.get(key.name);if(!value)return null;try{return JSON.parse(value);}catch{return null;}}));
  return json({assets:records.filter(Boolean),cursor:listed.cursor||null});
 }
 if(path==='/api/my-drive/assets'&&req.method==='POST'){
  const contentType=(req.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
  const filename=safeName(decodeURIComponent(req.headers.get('X-Asset-Name')||'asset'));
  const ext=filename.split('.').pop()?.toLowerCase()||'';
  if(!allowedExt.has(ext))return json({error:'Unsupported resource file extension.'},415);
  const declared=Number(req.headers.get('Content-Length')||0);
  if(declared>maxBytes)return json({error:'Resource exceeds the 100 MB limit.'},413);
  if(!req.body)return json({error:'No resource bytes received.'},400);
  const bytes=await req.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>maxBytes)return json({error:'Resource size is empty or exceeds the 100 MB limit.'},413);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const sha=[...digest].map(b=>b.toString(16).padStart(2,'0')).join('');
  const id=crypto.randomUUID(),key='my-drive/assets/'+id;
  const kind=['ttf','otf','woff','woff2'].includes(ext)?'font':['mp3','wav','ogg','m4a'].includes(ext)?'audio':['mp4','webm','mov'].includes(ext)?'video':['jpg','jpeg','png','webp','gif'].includes(ext)?'image':'archive';
  const asset={id,name:filename,kind,size:bytes.byteLength,sha256:sha,contentType:contentType||'application/octet-stream',storedAt:new Date().toISOString(),licenseStatus:'unverified',source:'user-import'};
  await env.MAP132_MEDIA.put(key,bytes,{httpMetadata:{contentType:asset.contentType,cacheControl:'private, no-store'}});
  await env.MAP132_KV.put(key,JSON.stringify(asset));
  return json({saved:true,asset},201);
 }
 const match=path.match(/^\/api\/my-drive\/assets\/([a-z0-9-]+)(?:\/(preview|download))?$/i);
 if(match&&req.method==='GET'){
  const id=match[1],action=match[2]||'preview',key='my-drive/assets/'+id;
  const meta=await env.MAP132_KV.get(key);if(!meta)return json({error:'Saved resource not found.'},404);
  let asset:any;try{asset=JSON.parse(meta);}catch{return json({error:'Resource metadata is invalid.'},500);}
  const object=await env.MAP132_MEDIA.get(key);if(!object)return json({error:'Resource bytes are missing.'},404);
  const headers=new Headers({'Content-Type':asset.contentType||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
  if(action==='download')headers.set('Content-Disposition','attachment; filename="'+safeName(asset.name)+'"');
  return new Response(object.body,{headers});
 }
 if(match&&req.method==='DELETE'){
  const key='my-drive/assets/'+match[1];if(!await env.MAP132_KV.get(key))return json({error:'Saved resource not found.'},404);
  await env.MAP132_MEDIA.delete(key);await env.MAP132_KV.delete(key);return json({deleted:true});
 }
 return json({error:'Not found'},404);
}
