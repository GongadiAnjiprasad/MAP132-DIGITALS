import { getMyDriveAccessToken } from '../src/modules/my-drive-resource-manager/driveOAuth.ts';
import { uploadMap132DriveFile, downloadMap132DriveFile, deleteMap132DriveFile, ensureMap132ZipBackupFolder, uploadMap132DriveFileToFolder } from './googleDriveStorage.ts';
interface AssetEnv { MAP132_KV?: KVNamespace; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; MY_DRIVE_SESSION_SECRET?: string; ADMIN_PASSWORD?: string; }
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowedExt=new Set(['ttf','otf','woff','woff2','mp3','wav','aac','ogg','m4a','flac','mp4','webm','mov','m4v','jpg','jpeg','png','webp','gif','avif','svg','zip','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm']);
const allowedCategories=new Set(['Sound Effects','Wedding','Birthday','Trailer BGMs','Plugins','Fonts','Images','Videos','Other']);
const allowedSoundSubcategories=new Set(['Whoosh','Riser','Impact','Boom','Transition','Cinematic Hit','Logo Reveal','Swipe','Punch','Heartbeat','Suspense','Ambient','Action','Horror','Foley','Footsteps','Gunshots','Nature','Crowd','Vehicle','UI','Animal','Water','Fire','Other Effects']);
const maxBytes=100*1024*1024;
function safeName(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'asset';}
async function authorized(req:Request,env:AssetEnv){
 if(!env.ADMIN_PASSWORD)return false;
 const raw=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('map132_admin='))?.slice('map132_admin='.length);
 if(!raw)return false;
 const parts=raw.split('.');
 if(parts.length!==2)return false;
 try{
  const base64=parts[0].replace(/-/g,'+').replace(/_/g,'/');
  const padded=base64+'='.repeat((4-(base64.length%4))%4);
  const payload=JSON.parse(atob(padded));
  if(!Number.isFinite(payload.exp)||payload.exp<Date.now())return false;
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signatureBytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(parts[0])));
  let binary='';for(const byte of signatureBytes)binary+=String.fromCharCode(byte);
  const signature=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
  return signature===parts[1];
 }catch{return false;}
}
/** Durable private My Drive resource storage. Source Drive files remain read-only. */
export async function handleMyDriveAssets(req:Request,env:AssetEnv):Promise<Response|null>{
 const url=new URL(req.url),path=url.pathname;
 if(!path.startsWith('/api/my-drive/assets')&&!path.startsWith('/api/my-drive/zip-backups'))return null;
 if(!env.MAP132_KV)return json({error:'My Drive metadata storage is not configured. Bind MAP132_KV.'},503);
 if(!await authorized(req,env))return json({error:'MAP132 Admin login required.'},401);
 const accessToken=await getMyDriveAccessToken(req,env);
 if(!accessToken)return json({error:'Google Drive session expired. Reconnect Google Drive and try again.'},401);
 if(path==='/api/my-drive/zip-backups'&&req.method==='GET'){
  const listed=await env.MAP132_KV.list({prefix:'my-drive/zip-backups/',limit:100});
  const records=await Promise.all(listed.keys.map(async key=>{const value=await env.MAP132_KV!.get(key.name);if(!value)return null;try{return JSON.parse(value);}catch{return null;}}));
  const backups=records.filter(Boolean).sort((a:any,b:any)=>String(b.storedAt||'').localeCompare(String(a.storedAt||'')));
  return json({backups});
 }
 if(path==='/api/my-drive/zip-backups'&&req.method==='POST'){
  const filename=safeName(decodeURIComponent(req.headers.get('X-Archive-Name')||'backup.zip'));
  if(!filename.toLowerCase().endsWith('.zip'))return json({error:'Only ZIP archives can be saved as backups.'},415);
  const declared=Number(req.headers.get('Content-Length')||0);
  if(declared>100*1024*1024)return json({error:'ZIP archive exceeds the 100 MB backup limit.'},413);
  if(!req.body)return json({error:'No ZIP archive bytes received.'},400);
  const bytes=await req.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>100*1024*1024)return json({error:'ZIP archive is empty or exceeds the 100 MB backup limit.'},413);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const sha=[...digest].map(b=>b.toString(16).padStart(2,'0')).join('');
  const duplicateId=await env.MAP132_KV.get('my-drive/zip-backup-sha/'+sha);
  if(duplicateId){
   const existing=await env.MAP132_KV.get('my-drive/zip-backups/'+duplicateId);
   if(existing)return json({saved:false,duplicate:true,backup:JSON.parse(existing)});
  }
  try{
   const folderId=await ensureMap132ZipBackupFolder(accessToken,env.MAP132_KV);
   const driveFile=await uploadMap132DriveFileToFolder(accessToken,folderId,filename,'application/zip',bytes);
   const id=crypto.randomUUID();
   const backup={id,name:filename,size:bytes.byteLength,sha256:sha,driveFileId:driveFile.id,storedAt:new Date().toISOString(),contentType:'application/zip',storage:'Google Drive · MAP132 Workspace / ZIP Backups'};
   await env.MAP132_KV.put('my-drive/zip-backups/'+id,JSON.stringify(backup));
   await env.MAP132_KV.put('my-drive/zip-backup-sha/'+sha,id);
   return json({saved:true,backup},201);
  }catch(error){return json({error:error instanceof Error?error.message:'Could not save the original ZIP archive to Google Drive.'},502);}
 }
 const backupDownload=path.match(/^\/api\/my-drive\/zip-backups\/([a-z0-9-]+)\/download$/i);
 if(backupDownload&&req.method==='GET'){
  const meta=await env.MAP132_KV.get('my-drive/zip-backups/'+backupDownload[1]);
  if(!meta)return json({error:'ZIP backup not found.'},404);
  let backup:any;try{backup=JSON.parse(meta);}catch{return json({error:'ZIP backup metadata is invalid.'},500);}
  if(!backup.driveFileId)return json({error:'ZIP backup has no Google Drive file reference.'},404);
  const object=await downloadMap132DriveFile(accessToken,backup.driveFileId);
  if(!object.ok||!object.body)return json({error:'Google Drive could not retrieve this ZIP backup.'},object.status===404?404:502);
  return new Response(object.body,{headers:{'Content-Type':'application/zip','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'attachment; filename="'+safeName(String(backup.name||'backup.zip'))+'"'}});
 }
 if(path==='/api/my-drive/assets'&&req.method==='GET'){
  const page=Math.max(1,Math.min(100,Number(url.searchParams.get('limit')||50)));
  const cursor=url.searchParams.get('cursor')||undefined;
  const listed=await env.MAP132_KV.list({prefix:'my-drive/assets/',limit:page,...(cursor?{cursor}:{})});
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
  const categoryHeader=req.headers.get('X-Asset-Category')||'Other';
  const category=allowedCategories.has(categoryHeader)?categoryHeader:'Other';
  const kind=['ttf','otf','woff','woff2'].includes(ext)?'font':['mp3','wav','aac','ogg','m4a','flac'].includes(ext)?'audio':['mp4','webm','mov','m4v'].includes(ext)?'video':['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)?'image':['aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'].includes(ext)?'template':'archive';
  const requestedSubcategory=req.headers.get('X-Asset-Subcategory')||'';
  const subcategory=category==='Sound Effects'&&allowedSoundSubcategories.has(requestedSubcategory)?requestedSubcategory:(category==='Sound Effects'?'Other Effects':undefined);
  let sourcePath=filename;
  try{sourcePath=decodeURIComponent(req.headers.get('X-Asset-Source-Path')||filename).slice(0,500);}catch{}
  const duplicateId=await env.MAP132_KV.get('my-drive/asset-sha/'+sha);
  if(duplicateId){
   const existingValue=await env.MAP132_KV.get('my-drive/assets/'+duplicateId);
   if(existingValue){
    const existing=JSON.parse(existingValue);
    let updated=false;
    if(category==='Sound Effects'&&existing.category==='Sound Effects'&&!existing.subcategory&&subcategory){existing.subcategory=subcategory;updated=true;}
    if(!existing.sourcePath&&sourcePath){existing.sourcePath=sourcePath;updated=true;}
    if(updated)await env.MAP132_KV.put('my-drive/assets/'+duplicateId,JSON.stringify(existing));
    return json({saved:false,duplicate:true,asset:existing},200);
   }
  }
  const id=crypto.randomUUID(),key='my-drive/assets/'+id;
  const asset={id,name:filename,kind,category,...(subcategory?{subcategory}:{}),sourcePath,size:bytes.byteLength,sha256:sha,contentType:contentType||'application/octet-stream',storedAt:new Date().toISOString(),licenseStatus:'unverified',source:'user-import'};
  const driveFile=await uploadMap132DriveFile(accessToken,env.MAP132_KV,filename,asset.contentType,bytes,category);
  (asset as typeof asset & {driveFileId?:string}).driveFileId=driveFile.id;
  await env.MAP132_KV.put(key,JSON.stringify(asset));
  await env.MAP132_KV.put('my-drive/asset-sha/'+sha,id);
  return json({saved:true,asset},201);
 }
 const match=path.match(/^\/api\/my-drive\/assets\/([a-z0-9-]+)(?:\/(preview|download))?$/i);
 if(match&&req.method==='GET'){
  const id=match[1],action=match[2]||'preview',key='my-drive/assets/'+id;
  const meta=await env.MAP132_KV.get(key);if(!meta)return json({error:'Saved resource not found.'},404);
  let asset:any;try{asset=JSON.parse(meta);}catch{return json({error:'Resource metadata is invalid.'},500);}
  if(!asset.driveFileId)return json({error:'Saved resource has no Google Drive file reference.'},404);
  const object=await downloadMap132DriveFile(accessToken,asset.driveFileId);if(!object.ok||!object.body)return json({error:'Google Drive could not retrieve this resource.'},object.status===404?404:502);
  const headers=new Headers({'Content-Type':asset.contentType||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
  if(action==='download')headers.set('Content-Disposition','attachment; filename="'+safeName(asset.name)+'"');
  return new Response(object.body,{headers});
 }
 if(match&&req.method==='DELETE'){
  const key='my-drive/assets/'+match[1],meta=await env.MAP132_KV.get(key);if(!meta)return json({error:'Saved resource not found.'},404);
  let asset:any;try{asset=JSON.parse(meta);}catch{return json({error:'Resource metadata is invalid.'},500);}
  if(!asset.driveFileId)return json({error:'Saved resource has no Google Drive file reference; metadata was kept.'},409);
  if(asset.driveFileId){
   try {
    const removed=await deleteMap132DriveFile(accessToken,asset.driveFileId);
    if(!removed)return json({error:'Google Drive could not delete this resource. Metadata was kept; retry after checking Drive permissions.'},502);
   } catch {
    return json({error:'Google Drive deletion failed. Metadata was kept; retry after checking the connection.'},502);
   }
  }
  await env.MAP132_KV.delete(key);
  if(asset.sha256)await env.MAP132_KV.delete('my-drive/asset-sha/'+asset.sha256);
  return json({deleted:true});
 }
 return json({error:'Not found'},404);
}
