import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig,normalizePath,type Plugin} from 'vite';

// Static admin for GitHub Pages: the app/api route handlers run in the browser
// against sql.js, and GitHub (data branch + Actions) replaces the Worker and D1.
const shims=path.resolve(__dirname,'static/shims');
const adminAccess=path.resolve(__dirname,'app/admin-access.ts');
function browserShims():Plugin{
 return {name:'market-note-browser-shims',enforce:'pre',
  async resolveId(id,importer,options){
   if(id==='cloudflare:workers')return normalizePath(path.join(shims,'cloudflare-workers.ts'));
   if(importer&&/admin-access$/.test(id)){const r=await this.resolve(id,importer,{...options,skipSelf:true});if(r&&path.resolve(r.id)===adminAccess)return normalizePath(path.join(shims,'admin-access.ts'))}
   return null;
  }};
}
export default defineConfig({
 root:'static',base:'./',publicDir:'../public',
 plugins:[browserShims(),react()],
 define:{'import.meta.env.VITE_STATIC':JSON.stringify('1')},
 build:{outDir:'../dist-static',emptyOutDir:true,chunkSizeWarningLimit:2000},
});
