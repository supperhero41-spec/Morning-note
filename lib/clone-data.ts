import snapshot from '../data/clone-snapshot.json';
import config from '../data/clone-config.json';

// Bootstrap only this new Site's D1. No requests or writes to the source Site.
export async function initializeClone(env: any) {
  const database: D1Database = env.DB;
  if (await database.prepare('SELECT key FROM site_config WHERE key=?').bind('clone-initialized-v1').first()) return;
  const statements = [...config, {key:'settings', value:JSON.stringify(snapshot.settings)}].map(row =>
    database.prepare('INSERT OR IGNORE INTO site_config (key,value) VALUES (?,?)').bind(row.key,row.value));
  for (const source of snapshot.sources) {
    statements.push(database.prepare('INSERT OR IGNORE INTO feed_cache (key,payload,attempted_at,succeeded_at,error) VALUES (?,?,?,?,NULL)').bind('news:'+source.id,JSON.stringify(snapshot.stories.filter(s=>s.sourceId===source.id)),source.attemptedAt,source.succeededAt));
  }
  for (const quote of snapshot.quotes) {
    statements.push(database.prepare('INSERT OR IGNORE INTO feed_cache (key,payload,attempted_at,succeeded_at,error) VALUES (?,?,?,?,NULL)').bind('market:'+quote.id,JSON.stringify([quote]),snapshot.checkedAt,snapshot.checkedAt));
  }
  statements.push(database.prepare('INSERT OR IGNORE INTO site_config (key,value) VALUES (?,?)').bind('clone-initialized-v1','2026-10-09'));
  await database.batch(statements);
}
