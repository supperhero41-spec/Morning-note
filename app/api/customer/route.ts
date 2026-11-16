import {env} from 'cloudflare:workers';
import {readSnapshot} from '../../../lib/data';
import {customerSnapshot} from '../../../lib/customer-snapshot';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(customerSnapshot(await readSnapshot(env)),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Chưa tải được bản tin. Vui lòng thử lại.'},{status:503})}}
