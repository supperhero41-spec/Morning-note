import fs from 'node:fs';
const id=process.argv[2]||process.env.D1_DATABASE_ID;
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||''))throw Error('Provide a valid D1 database UUID');
const config=JSON.parse(fs.readFileSync('wrangler.json','utf8'));config.d1_databases[0].database_id=id;fs.writeFileSync('wrangler.json',JSON.stringify(config,null,2)+'\n');console.log('D1 configured');
