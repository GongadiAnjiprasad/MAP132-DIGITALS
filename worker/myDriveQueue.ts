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
  progress: number; targetFileId?: string; error?: string;
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

function classify(name:string, path:string): string | null {
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

async function scanFolder(token:string, rootId:string, rootName:string):Promise<Array<{id:string;name:string;path:string;category:string;mimeType:string;size:number}>> {
  const folders = [{id:rootId,path:rootName}];
  const visited = new Set<string>();
  const files:Array<{id:string;name:string;path:string;category:string;mimeType:string;size:number}> = [];
  let scanned = 0;
  while (folders.length && visited.size < 500 && scanned < 1500 && files.length < 1200) {
    const folder = folders.shift()!;
    if (visited.has(folder.id)) continue;
    visited.add(folder.id);
    let pageToken = '';
    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', "'" + folder.id.replace(/'/g,"\\'") + "' in parents and trashed = false");
      url.searchParams.set('pageSize','100');
      url.searchParams.set('orderBy','folder,name');
      url.searchParams.set('fields','nextPageToken,files(id,name,mimeType,size,capabilities(canCopy))');
      if (pageToken) url.searchParams.set('pageToken',pageToken);
      const response = await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
      if (!response.ok) throw new Error('Google Drive folder scan failed ('+response.status+').');
      const page = await response.json() as {nextPageToken?:string;files?:Array<{id:string;name:string;mimeType:string;size?:string;capabilities?:{canCopy?:boolean}}>};
      for (const file of page.files || []) {
        scanned++;
        const path = folder.path + '/' + file.name;
        if (file.mimeType === FOLDER_MIME) {
          if (folders.length + visited.size < 500) folders.push({id:file.id,path});
        } else {
          const category = classify(file.name,path);
          if (category && file.capabilities?.canCopy !== false) files.push({id:file.id,name:file.name,path,category,mimeType:file.mimeType||'application/octet-stream',size:Number(file.size||0)});
        }
        if (scanned >= 1500 || files.length >= 1200) break;
      }
      pageToken = page.nextPageToken || '';
    } while (pageToken && scanned < 1500 && files.length < 1200);
  }
  return files;
}

export async function handleMyDriveQueue(req:Request,env:MyDriveQueueEnv):Promise<Response|null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/api/my-drive/queue')) return null;
  if (!env.MAP132_KV) return json({error:'My Drive queue storage is not configured.'},503);
  if (url.pathname === '/api/my-drive/queue' && req.method === 'POST') {
    const token = await getMyDriveAccessToken(req,env as any);
    if (!token) return json({error:'Connect Google Drive before starting a background copy.'},401);
    const body = await req.json().catch(()=>({})) as {folderId?:string;folderName?:string};
    const rootId = String(body.folderId||'');
    const rootName = String(body.folderName||'Selected Drive folder').slice(0,160);
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(rootId)) return json({error:'Choose a valid Google Drive folder.'},400);
    const files = await scanFolder(token,rootId,rootName);
    if (!files.length) return json({error:'No supported, copyable files were found in the selected folder.'},404);
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
  if (url.pathname === '/api/my-drive/queue/cancel' && req.method === 'POST') {
    const body=await req.json().catch(()=>({})) as {jobId?:string};
    const jobId=String(body.jobId||'');
    if(!/^[a-z0-9-]{36}$/i.test(jobId))return json({error:'Invalid queue job.'},400);
    const value=await env.MAP132_KV.get(keyJob(jobId));
    if(!value)return json({error:'Queue job not found.'},404);
    const job=JSON.parse(value) as QueueJob;
    if(job.status==='completed')return json({error:'Completed copies cannot be cancelled.'},409);
    job.status='cancelled';job.updatedAt=new Date().toISOString();
    await env.MAP132_KV.put(keyJob(jobId),JSON.stringify(job));
    return json({cancelled:true});
  }
  return json({error:'Not found'},404);
}

export async function processMyDriveQueue(env:MyDriveQueueEnv):Promise<void> {
  if(!env.MAP132_KV)return;
  const token=await refreshToken(env);
  if(!token)return;
  const jobs=await env.MAP132_KV.list({prefix:PREFIX+'jobs/',limit:50});
  for(const jobKey of jobs.keys){
    const jobValue=await env.MAP132_KV.get(jobKey.name);if(!jobValue)continue;
    let job:QueueJob;try{job=JSON.parse(jobValue);}catch{continue;}
    if(job.status==='cancelled'||job.status==='completed'||job.status==='failed')continue;
    const entries=await env.MAP132_KV.list({prefix:PREFIX+'items/'+job.id+'/',limit:1000});
    const queued=entries.keys[0];if(!queued)continue;
    const raw=await env.MAP132_KV.get(queued.name);if(!raw)continue;
    let item:QueueItem;try{item=JSON.parse(raw);}catch{continue;}
    if(item.status==='completed'||item.status==='failed')continue;
    item.status='copying';item.updatedAt=new Date().toISOString();await env.MAP132_KV.put(queued.name,JSON.stringify(item));
    try{
      const duplicate=await env.MAP132_KV.get(PREFIX+'source-copy/'+item.sourceFileId);
      if(duplicate){
        item.targetFileId=duplicate;item.status='completed';item.progress=100;
      }else{
        const parent=await ensureMap132CategoryFolder(token,env.MAP132_KV,item.category);
        const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(item.sourceFileId)+'/copy?fields=id,name,mimeType,size,parents',{
          method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({name:item.name,parents:[parent],appProperties:{map132SourceFileId:item.sourceFileId,map132QueueItemId:item.id}})
        });
        if(!response.ok)throw new Error(response.status===403?'Google Drive does not allow copying this source file.':response.status===404?'The source file is no longer available.':'Google Drive copy failed ('+response.status+').');
        const copied=await response.json() as {id?:string};
        if(!copied.id)throw new Error('Google Drive did not confirm the copied file.');
        item.targetFileId=copied.id;item.status='completed';item.progress=100;
        await env.MAP132_KV.put(PREFIX+'source-copy/'+item.sourceFileId,copied.id);
      }
      delete item.error;
    }catch(error){
      item.status='failed';item.error=error instanceof Error?error.message:'Copy failed.';
    }
    item.updatedAt=new Date().toISOString();await env.MAP132_KV.put(queued.name,JSON.stringify(item));
    const allKeys=await env.MAP132_KV.list({prefix:PREFIX+'items/'+job.id+'/',limit:1000});
    const all=await Promise.all(allKeys.keys.map(async key=>{const v=await env.MAP132_KV!.get(key.name);try{return v?JSON.parse(v) as QueueItem:null;}catch{return null;}}));
    job.completed=all.filter(x=>x?.status==='completed').length;
    job.failed=all.filter(x=>x?.status==='failed').length;
    job.status=job.completed+job.failed>=job.total?(job.failed?'completed-with-errors':'completed'):'running';
    job.updatedAt=new Date().toISOString();await env.MAP132_KV.put(keyJob(job.id),JSON.stringify(job));
    return;
  }
}
