import {isSiteAdmin} from '../../admin-access';
import { env } from 'cloudflare:workers';
import { refreshAll,getSettings } from '../../../lib/data';
export const dynamic='force-dynamic';
// This shared writer is protected by Sites owner-private service access.
// Add explicit writer authorization before changing the Site to public.
export async function POST(request:Request){if(!await isSiteAdmin())return Response.json({error:'Chỉ quản trị viên được chỉnh sửa hoặc cập nhật dữ liệu.'},{status:403});const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Yêu cầu không hợp lệ'},{status:403});try{const body:any=await request.json().catch(()=>({}));const scope=['all','market','news'].includes(body.scope)?body.scope:'all';if(scope!=='market'&&!body.sourceId){const settings=await getSettings(env);return Response.json({sourceIds:settings.sources.filter(s=>s.enabled).map(s=>s.id)})}if(scope!=='market'&&typeof body.sourceId!=='string')return Response.json({error:'Nguồn không hợp lệ'},{status:400});return Response.json(await refreshAll(env,scope,body.sourceId,body.force===true),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Chưa cập nhật được dữ liệu. Vui lòng thử lại.'},{status:503})}}
