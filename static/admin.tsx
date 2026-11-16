import {createRoot} from 'react-dom/client';
import {useState,type CSSProperties} from 'react';
import '../app/globals.css';
import Dashboard from '../app/dashboard';
import {load,installFetchShim,refreshViaGitHub,syncView} from './runtime/api';
import {getRepo,getToken,setRepo,setToken} from './runtime/github';

const box:CSSProperties={maxWidth:560,margin:'64px auto',padding:'28px 32px',background:'#fff',border:'1px solid #e4e9f1',borderRadius:14,font:'14px/1.55 Arial,sans-serif',color:'#17263f'};
const input:CSSProperties={width:'100%',padding:'9px 11px',border:'1px solid #cfd7e6',borderRadius:8,font:'14px monospace',marginTop:4};
const button:CSSProperties={background:'#265ee9',color:'#fff',border:0,borderRadius:8,padding:'9px 18px',fontWeight:600,cursor:'pointer'};

function Setup({message}:{message?:string}){
 const [token,setT]=useState(getToken()),[repo,setR]=useState(getRepo());
 return <div style={box}>
  <h2 style={{margin:'0 0 6px',fontSize:22}}>Đăng nhập quản trị</h2>
  <p style={{margin:'0 0 16px',color:'#5b677a'}}>Trang quản trị dùng GitHub làm nơi lưu dữ liệu. Token chỉ lưu trong trình duyệt này.</p>
  {message&&<p style={{background:'#fff4f4',border:'1px solid #f3c4cc',borderRadius:8,padding:'8px 12px',color:'#a3243b'}}>{message}</p>}
  <label>Repository (owner/tên)<input style={input} value={repo} onChange={e=>setR(e.target.value)} placeholder="ten-tai-khoan/market-note"/></label>
  <div style={{height:12}}/>
  <label>GitHub token<input style={input} type="password" value={token} onChange={e=>setT(e.target.value)} placeholder="github_pat_…"/></label>
  <p style={{fontSize:13,color:'#79849a'}}>Tạo tại GitHub → Settings → Developer settings → Fine-grained tokens. Chỉ chọn repository này, cấp quyền <b>Contents: Read and write</b> và <b>Actions: Read and write</b>.</p>
  <button style={button} onClick={()=>{setRepo(repo);setToken(token);location.reload()}} disabled={!token.trim()||!(/^[\w.-]+\/[\w.-]+$/.test(repo.trim())||repo.trim()==='local')}>Vào trang quản trị</button>
 </div>;
}

function AccountBar(){
 return <div style={{position:'fixed',left:12,bottom:12,zIndex:60,background:'#fff',border:'1px solid #e4e9f1',borderRadius:999,padding:'5px 12px',font:'12px Arial,sans-serif',color:'#79849a',boxShadow:'0 4px 16px rgba(16,43,92,.12)'}}>
  GitHub: {getRepo()} · <button onClick={()=>{setToken('');location.reload()}} style={{background:'none',border:0,color:'#265ee9',cursor:'pointer',padding:0,font:'inherit'}}>Đăng xuất</button>
 </div>;
}

const root=createRoot(document.getElementById('root')!);
async function start(){
 if(!getToken()||!getRepo()){root.render(<Setup/>);return}
 root.render(<div style={{...box,textAlign:'center'}}>Đang tải dữ liệu từ GitHub…</div>);
 try{
  installFetchShim();
  const info=await load();
  (globalThis as any).__marketNoteRefresh=refreshViaGitHub;
  setInterval(()=>{void syncView().catch(()=>{})},180000);
  const snapshot=(await (await fetch("/api/data")).json()) as any;
  root.render(<>
   {!info.hasData&&<div style={{background:'#fff8e6',borderBottom:'1px solid #f0d9a0',padding:'10px 16px',font:'14px Arial,sans-serif',color:'#6b5310',textAlign:'center'}}>Chưa có dữ liệu cào tin trên nhánh <b>data</b>. Bấm <b>Cập nhật</b> để GitHub cào tin lần đầu.</div>}
   <Dashboard initial={snapshot}/>
   <AccountBar/>
  </>);
 }catch(e){root.render(<Setup message={e instanceof Error?e.message:'Không tải được dữ liệu từ GitHub.'}/>)}
}
void start();
