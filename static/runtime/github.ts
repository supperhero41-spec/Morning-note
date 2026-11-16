// GitHub is the backend: data lives on the `data` branch, the scraper is a workflow.
const TOKEN_KEY='mn-gh-token',REPO_KEY='mn-gh-repo';
export const DATA_BRANCH='data',WORKFLOW='update-data.yml';

const store={get:(k:string)=>{try{return localStorage.getItem(k)||''}catch{return ''}},set:(k:string,v:string)=>{try{v?localStorage.setItem(k,v):localStorage.removeItem(k)}catch{}}};
export const getToken=()=>store.get(TOKEN_KEY);
export const setToken=(v:string)=>store.set(TOKEN_KEY,v.trim());
// owner/name: saved value, else derived from <owner>.github.io/<repo>/
export function getRepo(){const saved=store.get(REPO_KEY);if(saved)return saved;if(location.hostname.endsWith('.github.io')){const repo=location.pathname.split('/').filter(Boolean)[0];if(repo)return location.hostname.split('.')[0]+'/'+repo}return ''}
export const setRepo=(v:string)=>store.set(REPO_KEY,v.trim());

// Repository "local" = offline preview: reads ./local-data/, keeps writes in memory, cannot scrape.
const isLocal=()=>getRepo()==='local';
const localFiles=new Map<string,string>();

export class GitHubError extends Error{constructor(message:string,readonly status:number){super(message)}}

async function api(path:string,init:{method?:string;body?:unknown;accept?:string}={}){
 const token=getToken(),repo=getRepo();if(!token||!repo)throw new GitHubError('Chưa nhập GitHub token hoặc repository.',401);
 const r=await fetch('https://api.github.com/repos/'+repo+path,{method:init.method||'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,Accept:init.accept||'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(init.body!==undefined?{'Content-Type':'application/json'}:{})},body:init.body===undefined?undefined:JSON.stringify(init.body)});
 if(!r.ok){const text=await r.text().catch(()=>'');throw new GitHubError(r.status===401?'GitHub token không hợp lệ hoặc đã hết hạn.':r.status===403?'Token thiếu quyền (cần Contents và Actions: Read and write) hoặc bị giới hạn lượt gọi.':r.status===404?'Không tìm thấy repository/tệp, hoặc token không có quyền với repository này.':'GitHub trả lỗi '+r.status+(text?': '+text.slice(0,160):''),r.status)}
 return r;
}

const b64=(text:string)=>{const bytes=new TextEncoder().encode(text);let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)};

/** Raw bytes of a file on the data branch, or null when it does not exist yet. */
export async function readRaw(path:string):Promise<ArrayBuffer|null>{
 if(isLocal()){const mem=localFiles.get(path);if(mem!==undefined)return new TextEncoder().encode(mem).buffer as ArrayBuffer;const r=await fetch('local-data/'+path,{cache:'no-store'});return r.ok?await r.arrayBuffer():null}
 try{return await (await api('/contents/'+path+'?ref='+DATA_BRANCH,{accept:'application/vnd.github.raw+json'})).arrayBuffer()}
 catch(e){if(e instanceof GitHubError&&e.status===404)return null;throw e}
}
/** Blob sha of a file on the data branch (needed to update it), or null. */
export async function fileSha(path:string):Promise<string|null>{
 if(isLocal())return 'local:'+path+':'+(localFiles.get(path)?.length??0);
 try{return ((await (await api('/contents/'+path+'?ref='+DATA_BRANCH)).json()) as any).sha||null}
 catch(e){if(e instanceof GitHubError&&e.status===404)return null;throw e}
}
export async function writeText(path:string,text:string,sha:string|null,message:string):Promise<string>{
 if(isLocal()){localFiles.set(path,text);console.info('[local] '+message);return 'local:'+path+':'+text.length}
 const r=await api('/contents/'+path,{method:'PUT',body:{message,content:b64(text),branch:DATA_BRANCH,...(sha?{sha}:{})}});
 return ((await r.json()) as any).content.sha;
}
export async function branchHead():Promise<string|null>{
 try{return ((await (await api('/branches/'+DATA_BRANCH)).json()) as any).commit.sha}
 catch(e){if(e instanceof GitHubError&&e.status===404)return null;throw e}
}
export async function defaultBranch():Promise<string>{
 const r=await fetch('https://api.github.com/repos/'+getRepo(),{cache:'no-store',headers:{Authorization:'Bearer '+getToken(),Accept:'application/vnd.github+json'}});
 return r.ok?((await r.json()) as any).default_branch||'main':'main';
}
export async function dispatchScrape(){if(isLocal())throw new Error('Bản chạy thử local không cào tin qua GitHub.');await api('/actions/workflows/'+WORKFLOW+'/dispatches',{method:'POST',body:{ref:await defaultBranch()}})}
export async function gunzipText(buffer:ArrayBuffer){const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));return await new Response(stream).text()}
