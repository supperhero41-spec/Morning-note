import Dashboard from '../dashboard';
import { env } from 'cloudflare:workers';
import { readSnapshot } from '../../lib/data';
import { customerSnapshot } from '../../lib/customer-snapshot';
export const dynamic='force-dynamic';
export const metadata={title:'FinSuccess | Bản tin dành cho khách hàng'};
export default async function Page(){let initial=null;try{initial=customerSnapshot(await readSnapshot(env))}catch{}return <Dashboard initial={initial} readOnly/>}
