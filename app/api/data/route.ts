import {isSiteAdmin} from '../../admin-access';
import { env } from 'cloudflare:workers';
import { readSnapshot } from '../../../lib/data';
export const dynamic='force-dynamic';
export async function GET(){if(!await isSiteAdmin())return Response.json({error:'Chỉ quản trị viên được xem dữ liệu quản trị.'},{status:403});try{return Response.json(await readSnapshot(env),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Bộ nhớ dữ liệu chưa sẵn sàng. Vui lòng thử lại.'},{status:503})}}
