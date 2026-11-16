import handler from 'vinext/server/fetch-handler';
async function equal(a:string,b:string){
 const hash=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [x,y]=await Promise.all([hash(a),hash(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  const url=new URL(request.url),path=url.pathname;
  const protectedPath=path==='/admin'||path.startsWith('/admin/')||path.startsWith('/api/')&&path!=='/api/customer';
  let authorized=false;
  if(protectedPath){
   const auth=request.headers.get('authorization')||'';
   if(env.ADMIN_USERNAME&&env.ADMIN_PASSWORD&&auth.startsWith('Basic '))try{const decoded=atob(auth.slice(6));const colon=decoded.indexOf(':');if(colon>=0){const user=decoded.slice(0,colon),password=decoded.slice(colon+1);const [u,p]=await Promise.all([equal(user,env.ADMIN_USERNAME),equal(password,env.ADMIN_PASSWORD)]);authorized=u&&p;}}catch{}
   if(!authorized)return new Response('Đăng nhập quản trị bằng tài khoản đã cấu hình.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Market Note Admin", charset="UTF-8"','Cache-Control':'no-store'}});
  }
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-'))headers.delete(name);
  if(authorized){headers.set('oai-authenticated-user-id','standalone-admin');headers.set('oai-authenticated-user-email','admin@market-note.local');}
  const response=handler.fetch(new Request(request,{headers}),env,ctx);
  if(request.method==='POST'&&path==='/api/refresh')ctx.waitUntil(Promise.resolve(response).then(()=>undefined,()=>undefined));
  return response;
 }
};
