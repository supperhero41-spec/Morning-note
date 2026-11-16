// Minimal Cloudflare D1 API over sql.js (SQLite in WASM), enough for the SQL used in lib/ and app/api/.
import type {Database} from 'sql.js';

const norm=(v:unknown)=>v===undefined?null:typeof v==='boolean'?(v?1:0):v as any;

class Statement{
 constructor(private db:Database,readonly sql:string,readonly params:unknown[]=[]){}
 bind(...params:unknown[]){return new Statement(this.db,this.sql,params)}
 private rows(){const s=this.db.prepare(this.sql);try{s.bind(this.params.map(norm));const out:Record<string,unknown>[]=[];while(s.step())out.push(s.getAsObject());return out}finally{s.free()}}
 async first<T=Record<string,unknown>>(column?:string):Promise<T|null>{const row=this.rows()[0];if(!row)return null;return (column?row[column]:row) as T}
 async all<T=Record<string,unknown>>(){return {results:this.rows() as T[],success:true,meta:{}}}
 runSync(){this.db.run(this.sql,this.params.map(norm));return {success:true,results:[],meta:{changes:this.db.getRowsModified()}}}
 async run(){return this.runSync()}
}

export function createD1(db:Database){
 return {
  prepare:(sql:string)=>new Statement(db,sql),
  async batch(statements:Statement[]){db.run('BEGIN');try{const out=statements.map(s=>s.runSync());db.run('COMMIT');return out}catch(e){db.run('ROLLBACK');throw e}},
  async exec(sql:string){db.exec(sql);return {count:0,duration:0}},
 };
}
