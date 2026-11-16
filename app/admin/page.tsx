import Dashboard from '../dashboard';
import {env} from 'cloudflare:workers';
import {readSnapshot} from '../../lib/data';
export const dynamic='force-dynamic';
export const metadata={title:'FinSuccess | Quản trị bản tin'};
export default async function AdminPage(){let initial=null;try{initial=await readSnapshot(env)}catch{}return <Dashboard initial={initial}/>;}
