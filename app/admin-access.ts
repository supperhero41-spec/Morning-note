import {getChatGPTUser} from './chatgpt-auth';
// The Worker strips incoming identity headers and sets this only after Basic authentication.
export async function isSiteAdmin(){const user=await getChatGPTUser();return user?.userId==='standalone-admin'&&user.email==='admin@market-note.local';}
