import { getMyDriveAccessToken } from '../src/modules/my-drive-resource-manager/driveOAuth.ts';
import { ensureMap132CategoryFolder } from './googleDriveStorage.ts';

export interface MyDriveQueueEnv {
  MAP132_KV?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MY_DRIVE_SESSION_SECRET?: string;
}

type QueueItem = {
  id: string; jobId: string; sourceFileId: string; name: string; sourcePath: string;
  category: string; mimeType: string; size: number;
  status: 'queued' | 'copying' | 'completed' | 'failed';
  progress: number; targetFileId?: string; error?: string; attempts?: number;
  createdAt: string; updatedAt: string;
};
type QueueJob = { id: string; rootFolderId: string; rootFolderName: string; status: string; total: number; completed: number; failed: number; createdAt: string; updatedAt: string };

const PREFIX = 'my-drive/queue/';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const allowed = new Set(['ttf','otf','woff','woff2','mp3','wav','aac','ogg','m4a','flac','mp4','webm','mov','m4v','jpg','jpeg','png','webp','gif','avif','svg','zip','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm']);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' } });
const keyJob = (id:string) => PREFIX + 'jobs/' + id;
const keyItem = (job:string,id:string) => PREFIX + 'items/' + job + '/' + id;
const safeName = (value:string) => value.replace(/[\\/\\\\]/g,'_').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120) || 'resource';

export function classifyMyDriveQueueResource(name:string, path:string): string | null {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!allowed.has(ext)) return null;
  const text = (path + ' ' + name).toLowerCase().replace(/[_-]+/g,' ');
  if (['sound effect','sound effects','sfx','whoosh','riser','impact','boom','transition','heartbeat','foley'].some(x=>text.includes(x))) return 'Sound Effects';
  if (['wedding','marriage','pelli'].some(x=>text.includes(x))) return 'Wedding';
  if (['birthday','bday','birth day'].some(x=>text.includes(x))) return 'Birthday';
  if (['trailer bgm','trailer music','trailer','background music','bgm','cinematic score'].some(x=>text.includes(x))) return 'Trailer BGMs';
  if (['aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm','zip'].includes(ext)) return 'Plugins';
  if (['ttf','otf','woff','woff2'].includes(ext)) return 'Fonts';
  if (['mp3','wav','aac','ogg','m4a','flac'].includes(ext)) return 'Sound Effects';
  if (['mp4','webm','mov','m4v'].includes(ext)) return 'Videos';
  if (['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)) return 'Images';
  return 'Other';
}

async function refreshToken(env:MyDriveQueueEnv):Promise<string|null> {
  if (!env.MAP132_KV || !env.MY_DRIVE_SESSION_SECRET || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  const stored = await env.MAP132_KV.get('my-drive/google-refresh-token');
  if (!stored) return null;
  try {
    const raw = stored.replace(/-/g,'+').replace(/_/g,'/');
    const bytes = Uint8Array.from(atob(raw + '='.repeat((4-raw.length%4)%4)), c=>c.charCodeAt(0));
    const secretHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.MY_DRIVE_SESSION_SECRET));
    const key = await crypto.subtle.importKey('raw', secretHash, 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},key,bytes.slice(12));
    const refresh = (JSON.parse(new TextDecoder().decode(plain)) as {refresh_token?:string}).refresh_token;
    if (!refresh) return null;
    const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:refresh,grant_type:'refresh_token'})});
    if (!response.ok) return null;
    const token = await response.json() as {access_token?:string};
    return token.access_token || null;
  } catch { return null; }
}

export async function handleMyDriveQueue(req:Request,env:MyDriveQueueEnv):Promise<Response|null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/api/my-drive/queue')) return null;
  if (!env.MAP132_KV) return json({error:'My Drive queue storage is not configured.'},503);
  if (url.pathname === '/api/my-drive/queue' && req.method === 'POST') {
    const token = await getMyDriveAccessToken(req,env as any);
    if (!token) return json({error:'Connect Google Drive before starting a background copy.'},401);
    const body = await req.json().catch(()=>({})) as {folderId?:string;folderName?:string;files?:Array<{id?:string;name?:string;path?:string;category?:string;mimeType?:string;size?:number}>};
    const rootId = String(body.folderId||'');
    const rootName = String(body.folderName||'Selected Drive folder').slice(0,160);
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(rootId)) return json({error:'Choose a valid Google Drive folder.'},400);
    if (!await env.MAP132_KV.get('my-drive/google-refresh-token')) return json({error:'Background copying needs Google Drive offline permission. Reconnect Google Drive and approve the requested access once.'},409);
    if (!Array.isArray(body.files) || body.files.length > 900) return json({error:'Queue accepts up to 900 scanned files per folder. Narrow the selected folder and retry.'},413);
    const categories=new Set(['Sound Effects','Wedding','Birthday','Trailer BGMs','Plugins','Fonts','Images','Videos','Other']);
    const files=body.files.map(file=>({
      id:String(file.id||''),name:safeName(String(file.name||'resource')),path:String(file.path||file.name||'resource').slice(0,500),
      category:categories.has(String(file.category||''))?String(file.category):'Other',
      mimeType:String(file.mimeType||'application/octet-stream').slice(0,120),size:Math.max(0,Number(file.size)||0)
    })).filter(file=>/^[a-zA-Z0-9_-]{1,256}$/.test(file.id)&&allowed.has((file.name.split('.').pop()||'').toLowerCase()));
    if (!files.length) return json({error:'No supported files were supplied for background copying.'},404);
    const jobId = crypto.randomUUID(), now = new Date().toISOString();
    const job:QueueJob = {id:jobId,rootFolderId:rootId,rootFolderName:rootName,status:'queued',total:files.length,completed:0,failed:0,createdAt:now,updatedAt:now};
    await env.MAP132_KV.put(keyJob(jobId),JSON.stringify(job));
    for (const file of files) {
      const id = crypto.randomUUID();
      const item:QueueItem = {id,jobId,sourceFileId:file.id,name:safeName(file.name),sourcePath:file.path,category:file.category,mimeType:file.mimeType,size:file.size,status:'queued',progress:0,createdAt:now,updatedAt:now};
      await env.MAP132_KV.put(keyItem(jobId,id),JSON.stringify(item));
    }
    return json({job,total:files.length,message:'Background copies queued. They continue on the Worker even when this website is closed.'},202);
  }
  if (url.pathname === '/api/my-drive/queue' && req.method === 'GET') {
    const listed = await env.MAP132_KV.list({prefix:PREFIX+'jobs/',limit:50});
    const jobs = await Promise.all(listed.keys.map(async key=>{const value=await env.MAP132_KV!.get(key.name);try{return value?JSON.parse(value) as QueueJob:null;}catch{return null;}}));
    const valid = jobs.filter(Boolean) as QueueJob[];
    valid.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const selected = valid.slice(0,10);
    const items = (await Promise.all(selected.map(async job=>{
      const list = await env.MAP132_KV!.list({prefix:PREFIX+'items/'+job.id+'/',limit:1000});
      return Promise.all(list.keys.map(async key=>{const value=await env.MAP132_KV!.get(key.name);try{return value?JSON.parse(value) as QueueItem:null;}catch{return null;}}));
    }))).flat().filter(Boolean) as QueueItem[];
    return json({jobs:selected,items:items.sort((a,b)=>a.createdAt.localeCompare(b.createdAt))});
  }
  return json({error:'Not found'},404);
}

export async function processMyDriveQueue(env:MyDriveQueueEnv):Promise<void> {
  if(!env.MAP132_KV)return;
  const token=await refreshToken(env);
  if(!token){
    const pending=await env.MAP132_KV.list({prefix:PREFIX+'jobs/',limit:50});
    for(const entry of pending.keys){const raw=await env.MAP132_KV.get(entry.name);if(!raw)continue;try{const job=JSON.parse(raw) as QueueJob;if(!['completed','completed-with-errors','failed','cancelled'].includes(job.status)){(job as any).status='paused';(job as any).lastError='Google Drive background authorization needs reconnecting.';job.updatedAt=new Date().toISOString();await env.MAP132_KV.put(entry.name,JSON.stringify(job));}}catch{}}
    return;
  }
  const jobs=await env.MAP132_KV.list({prefix:PREFIX+'jobs/',limit:50});
  for(const jobKey of jobs.keys){
    const jobValue=await env.MAP132_KV.get(jobKey.name);if(!jobValue)continue;
    let job:QueueJob;try{job=JSON.parse(jobValue);}catch{continue;}
    if(job.status==='cancelled'||job.status==='completed'||job.status==='completed-with-errors'||job.status==='failed')continue;
    const entries=await env.MAP132_KV.list({prefix:PREFIX+'items/'+job.id+'/',limit:1000});
    let next:{key:string;item:QueueItem}|null=null;
    for(const entry of entries.keys){
      const raw=await env.MAP132_KV.get(entry.name);if(!raw)continue;
      try{const item=JSON.parse(raw) as QueueItem;if(item.status==='queued'||item.status==='copying'){next={key:entry.name,item};break;}}catch{}
    }
    if(!next)continue;
    const {key,item}=next;
    item.status='copying';item.updatedAt=new Date().toISOString();await env.MAP132_KV.put(key,JSON.stringify(item));
    try{
      let copiedId=await env.MAP132_KV.get(PREFIX+'source-copy/'+item.sourceFileId);
      if(!copiedId){
        const q = "appProperties has { key='map132SourceFileId' and value='"+item.sourceFileId+"' } and trashed=false";
        const lookup = new URL('https://www.googleapis.com/drive/v3/files');
        lookup.searchParams.set('q',q);lookup.searchParams.set('pageSize','1');lookup.searchParams.set('fields','files(id,size)');
        const found = await fetch(lookup,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
        if(found.ok){const result=await found.json() as {files?:Array<{id:string;size?:string}>};copiedId=result.files?.[0]?.id||null;}
      }
      if(!copiedId){
        const parent=await ensureMap132CategoryFolder(token,env.MAP132_KV,item.category);
        const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(item.sourceFileId)+'/copy?fields=id,name,mimeType,size,parents',{
          method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({name:item.name,parents:[parent],appProperties:{map132SourceFileId:item.sourceFileId,map132QueueItemId:item.id}})
        });
        if(!response.ok)throw new Error(response.status===403?'Google Drive does not allow copying this source file.':response.status===404?'The source file is no longer available.':'Google Drive copy failed ('+response.status+').');
        const copied=await response.json() as {id?:string;size?:string};
        if(!copied.id)throw new Error('Google Drive did not confirm the copied file.');
        if(item.size>0&&Number(copied.size)!==item.size)throw new Error('Copied file size does not match the source. It will be retried.');
        copiedId=copied.id;
      }
      const verify=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(copiedId)+'?fields=id,size,trashed',{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
      if(!verify.ok)throw new Error('Could not verify the copied file in Google Drive.');
      const verified=await verify.json() as {id?:string;size?:string;trashed?:boolean};
      if(!verified.id||verified.trashed||(item.size>0&&Number(verified.size)!==item.size))throw new Error('Copied file failed size or availability verification. It will be retried.');
      item.targetFileId=copiedId;item.status='completed';item.progress=100;
      await env.MAP132_KV.put(PREFIX+'source-copy/'+item.sourceFileId,copiedId);
      const ext=(item.name.split('.').pop()||'').toLowerCase();
      const kind=['ttf','otf','woff','woff2'].includes(ext)?'font':['mp3','wav','aac','ogg','m4a','flac'].includes(ext)?'audio':['mp4','webm','mov','m4v'].includes(ext)?'video':['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)?'image':['aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'].includes(ext)?'template':'archive';
      const contentType=item.mimeType||'application/octet-stream';
      const asset={id:item.id,name:item.name,kind,category:item.category,sourcePath:item.sourcePath,size:item.size,contentType,storedAt:new Date().toISOString(),licenseStatus:'unverified',source:'google-drive-background-copy',originalDriveFileId:item.sourceFileId,driveFileId:copiedId};
      await env.MAP132_KV.put('my-drive/assets/'+item.id,JSON.stringify(asset));
      delete item.error;
    }catch(error){
      item.attempts=(item.attempts||0)+1;
      item.error=error instanceof Error?error.message:'Copy failed.';
      item.status=item.attempts>=5?'failed':'queued';
    }
    item.updatedAt=new Date().toISOString();await env.MAP132_KV.put(key,JSON.stringify(item));
    const allKeys=await env.MAP132_KV.list({prefix:PREFIX+'items/'+job.id+'/',limit:1000});
    const all=await Promise.all(allKeys.keys.map(async entry=>{const v=await env.MAP132_KV!.get(entry.name);try{return v?JSON.parse(v) as QueueItem:null;}catch{return null;}}));
    job.completed=all.filter(x=>x?.status==='completed').length;
    job.failed=all.filter(x=>x?.status==='failed').length;
    const pending=all.filter(x=>x&&x.status!=='completed'&&x.status!=='failed').length;
    job.status=pending?'running':job.failed?'completed-with-errors':'completed';
    job.updatedAt=new Date().toISOString();await env.MAP132_KV.put(keyJob(job.id),JSON.stringify(job));
    return;
  }
}
