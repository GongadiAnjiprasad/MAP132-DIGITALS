type ApiResult={data:any};
async function readResponse(response:Response,operation:string):Promise<ApiResult>{
  const contentType=response.headers.get('content-type')||'';
  const raw=await response.text();
  let data:any={};
  if(raw){
    try{data=JSON.parse(raw);}catch{
      const detail=raw.replace(/\s+/g,' ').slice(0,180);
      if(!response.ok)throw new Error(`${operation} failed (HTTP ${response.status}). Server returned a non-JSON response${detail?`: ${detail}`:'.'}`);
      throw new Error(`${operation} failed: server returned an unreadable response.`);
    }
  }
  if(!response.ok){
    const message=data?.error||data?.message||`${operation} failed (HTTP ${response.status}${contentType?`, ${contentType.split(';')[0]}`:''}).`;
    throw new Error(message);
  }
  return {data};
}
async function call(method:string,path:string,body?:unknown):Promise<ApiResult>{
  let response:Response;
  try{
    response=await fetch(path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  }catch(error){
    const detail=error instanceof Error?error.message:'Network error';
    throw new Error(`Could not reach the server for ${path}. ${detail}`);
  }
  return readResponse(response,`API request ${path}`);
}
async function upload(path:string,file:File):Promise<ApiResult>{
  let response:Response;
  try{
    response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});
  }catch(error){
    const detail=error instanceof Error?error.message:'Network error';
    throw new Error(`Could not reach the server for upload. ${detail}`);
  }
  return readResponse(response,'Upload');
}
export const api={get:(path:string)=>call('GET',path),post:(path:string,body:unknown)=>call('POST',path,body),put:(path:string,body:unknown)=>call('PUT',path,body),upload};
