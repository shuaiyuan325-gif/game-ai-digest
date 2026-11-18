import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';

export const TOPICS = Object.freeze({art:'美术与资产',npc:'智能NPC与交互',development:'研发工具与引擎',worlds:'AI原生玩法与世界模型',qa:'测试与质量保障',publishing:'发行与运营',models:'模型与基础设施'});
export const configPath = () => process.env.GAME_AI_DIGEST_CONFIG || path.join(os.homedir(), '.game-ai-digest', 'config.json');
const sha = value => createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values)];
const strings = (value, name) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(x => typeof x !== 'string')) throw new Error(`${name} 必须是字符串数组`);
  return unique(value.map(x=>x.trim()).filter(Boolean));
};
function text(value, name, max=100000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${name} 必须是非空文本（最多 ${max} 字符）`);
  return value.trim();
}
function date(value, name) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) throw new Error(`${name} 日期无效`);
  return value;
}
export function normalizeItems(input) {
  if (!input || !Array.isArray(input.items) || !input.items.length || input.items.length>100) throw new Error('items 应包含 1–100 条已选择情报');
  const items = input.items.map(item => {
    const eventId=text(item.eventId,'eventId',240);
    if (!TOPICS[item.topic] || !Object.hasOwn(TOPICS,item.topic)) throw new Error('topic 不在分类表中');
    if (!Array.isArray(item.sources) || !item.sources.length) throw new Error('每条情报需要原始来源');
    const sources=item.sources.map(s=>{
      const url = new URL(s.url);
      if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new Error('来源需要无凭据的 http/https URL');
      return {title:text(s.title || url.hostname,'source title',1000),url:url.href};
    });
    return {eventId,id:sha(eventId).slice(0,24),title:text(item.title,'title',300),topic:item.topic,tags:strings(item.tags,'tags'),companies:strings(item.companies,'companies'),products:strings(item.products,'products'),eventDate:date(item.eventDate,'eventDate'),publishedDate:date(item.publishedDate,'publishedDate'),sources,body:text(item.body,'body'),notes:strings(item.notes,'notes')};
  });
  if (new Set(items.map(i=>i.eventId)).size !== items.length) throw new Error('同一批次包含重复 eventId');
  return items;
}
export function prepare(input) {
  const items=normalizeItems(input);
  return {token:sha(JSON.stringify(items)),items,preview:items.map(({id,title,topic,tags,notes})=>({id,title,topic:TOPICS[topic],tags,notes}))};
}
export async function readConfig(file=configPath()) {
  try { return JSON.parse(await fs.readFile(file,'utf8')); }
  catch(e) { if(e.code==='ENOENT') return null; throw new Error(`个人配置无法读取: ${e.message}`); }
}
async function atomic(file,data) {
  const temp=`${file}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temp,data,{flag:'wx'}); await fs.rename(temp,file); }
  finally { await fs.rm(temp,{force:true}).catch(()=>{}); }
}
async function ensureDirectory(directory) {
  // Resolve each existing ancestor to reject a junction/symlink below the chosen root.
  try { const stat=await fs.lstat(directory); if(stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`目录不是普通文件夹: ${directory}`); }
  catch(e) { if(e.code!=='ENOENT') throw e; await fs.mkdir(directory); }
}
async function rootPath(root,create=false) {
  if (!root || !path.isAbsolute(root)) throw new Error('请先设置绝对路径 archiveRoot');
  if(create) await fs.mkdir(root,{recursive:true});
  const resolved=await fs.realpath(root);
  if(!(await fs.stat(resolved)).isDirectory()) throw new Error('归档根目录不是文件夹');
  return resolved;
}
async function safeFile(root,relative) {
  const full=path.resolve(root,relative), rel=path.relative(root,full);
  if(!rel || rel==='..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error('文件路径超出归档根目录');
  let cursor=root;
  for(const segment of rel.split(path.sep).slice(0,-1)) {cursor=path.join(cursor,segment); await ensureDirectory(cursor);}
  try {const stat=await fs.lstat(full); if(stat.isSymbolicLink() || !stat.isFile()) throw new Error(`目标不是普通文件: ${relative}`);}
  catch(e){if(e.code!=='ENOENT') throw e;}
  return full;
}
export async function init(root,file=configPath()) {
  const archiveRoot=await rootPath(root,true);
  const probe=path.join(archiveRoot,`.access-check-${randomUUID()}`);
  await fs.writeFile(probe,'test',{flag:'wx'}); await fs.unlink(probe);
  const old=await readConfig(file);
  const config={schemaVersion:1,language:'zh-CN',timezone:'Asia/Shanghai',focus:['game'],schedule:{enabled:false,time:'09:00'},...old,archiveRoot};
  await fs.mkdir(path.dirname(file),{recursive:true}); await atomic(file,JSON.stringify(config,null,2)+'\n');
  return config;
}
async function locked(root,fn) {
  const lock=path.join(root,'.game-ai-digest.lock');
  let handle;
  try {handle=await fs.open(lock,'wx');}
  catch(e){if(e.code==='EEXIST') throw new Error('知识库正在写入，或上次中断留下锁文件；确认没有写入进程后再恢复');throw e;}
  try {await handle.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()})); return await fn();}
  finally {await handle.close(); await fs.unlink(lock);}
}
function readCard(content,relative) {
  const line=content.split('\n',1)[0];
  const match=/^<!-- game-ai-digest: (.*) -->$/.exec(line);
  if(!match) throw new Error(`情报卡元数据缺失: ${relative}`);
  const metadata=JSON.parse(match[1]);
  if(!metadata.id || !TOPICS[metadata.topic]) throw new Error(`情报卡元数据无效: ${relative}`);
  return {...metadata,path:relative};
}
async function scan(root) {
  const rows=[]; const base=path.join(root,'cards');
  try {const s=await fs.lstat(base);if(s.isSymbolicLink() || !s.isDirectory()) throw new Error('cards 必须是普通文件夹');}
  catch(e){if(e.code==='ENOENT') return rows;throw e;}
  for(const dir of await fs.readdir(base,{withFileTypes:true})) {
    if(dir.isSymbolicLink()) throw new Error('不读取知识库中的符号链接');
    if(!dir.isDirectory()) continue;
    for(const file of await fs.readdir(path.join(base,dir.name),{withFileTypes:true})) {
      if(file.isSymbolicLink()) throw new Error('不读取知识库中的符号链接');
      if(!file.isFile() || !file.name.endsWith('.md')) continue;
      const relative=path.posix.join('cards',dir.name,file.name);
      rows.push(readCard(await fs.readFile(path.join(base,dir.name,file.name),'utf8'),relative));
    }
  }
  if(new Set(rows.map(r=>r.id)).size!==rows.length) throw new Error('发现重复情报 ID，需先人工整理');
  return rows.sort((a,b)=>a.path.localeCompare(b.path));
}
async function writeIndex(root,rows) {
  const index=await safeFile(root,'index.jsonl');
  await atomic(index,rows.map(r=>JSON.stringify(r)).join('\n')+(rows.length?'\n':''));
  const lines=['# 游戏 AI 情报目录','',`已归档 ${rows.length} 条；可按主题、标签、公司、产品和日期检索。`,''];
  for(const [key,label] of Object.entries(TOPICS)) {
    const subset=rows.filter(r=>r.topic===key); if(!subset.length) continue;
    lines.push(`## ${label}`,'');
    for(const r of subset) lines.push(`- [${r.title.replace(/[\[\]\r\n]/g,' ')}](<${r.path}>) — ${r.tags.join('、')}；事件日期 ${r.eventDate || '未确定'}`);
    lines.push('');
  }
  await atomic(await safeFile(root,'主题目录.md'),lines.join('\n'));
}
export async function reindex(root) {
  root=await rootPath(root);
  return locked(root,async()=>{const rows=await scan(root);await writeIndex(root,rows);return {count:rows.length};});
}
export async function commit(root,input,confirmedToken) {
  const plan=prepare(input);
  if(!confirmedToken || confirmedToken!==plan.token) throw new Error('确认指纹缺失或内容已变化，请重新预览并确认');
  root=await rootPath(root);
  return locked(root,async()=>{
    const rows=await scan(root), written=[], now=new Date().toISOString();
    for(const item of plan.items) {
      const existing=rows.find(r=>r.id===item.id);
      if(existing && existing.eventId!==item.eventId) throw new Error('情报 ID 冲突');
      const slug=item.title.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/[. ]+$/g,'').slice(0,70) || '情报';
      const relative=existing?.path || path.posix.join('cards',TOPICS[item.topic],`${slug}--${item.id}.md`);
      const file=await safeFile(root,relative);
      const previous=existing ? await fs.readFile(file,'utf8') : null;
      const metadata={...item,body:undefined,topic:existing?.topic || item.topic,tags:unique([...(existing?.tags||[]),...item.tags]),notes:unique([...(existing?.notes||[]),...item.notes]),archivedAt:existing?.archivedAt || now,updatedAt:now};
      const block=[`## ${existing?'更新':'收录'} · ${now}`,'',item.body,'','### 来源','',...item.sources.map(s=>`- [${s.title.replace(/[\[\]\r\n]/g,' ')}](<${s.url}>)`),'','### 用户备注','',...(item.notes.length?item.notes.map(n=>`- ${n}`):['无']), ''].join('\n');
      const previousBody=previous ? previous.slice(previous.indexOf('\n')+1) : `# ${item.title}\n\n`;
      // Avoid exact repeated requests generating duplicate revisions.
      if(existing && existing.lastSelection===sha(JSON.stringify(item))) {written.push({id:item.id,path:relative,status:'unchanged'});continue;}
      metadata.lastSelection=sha(JSON.stringify(item));
      await atomic(file,`<!-- game-ai-digest: ${JSON.stringify(metadata)} -->\n${previousBody}\n${block}`);
      written.push({id:item.id,path:relative,status:existing?'updated':'created'});
    }
    await writeIndex(root,await scan(root));
    return {root,written};
  });
}
export async function search(root,{query='',topic=null,limit=20}={}) {
  root=await rootPath(root);
  if(topic && !Object.hasOwn(TOPICS,topic)) throw new Error('未知 topic');
  if(!Number.isInteger(limit) || limit<1 || limit>100) throw new Error('limit 需要为 1–100');
  // Scan canonical cards too: an interrupted index update must not hide saved knowledge.
  const rows=await scan(root), results=[], terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  for(const row of rows) {
    if(topic && row.topic!==topic) continue;
    const body=await fs.readFile(await safeFile(root,row.path),'utf8');
    const haystack=(JSON.stringify(row)+'\n'+body).toLocaleLowerCase();
    if(terms.every(t=>haystack.includes(t))) results.push({...row,body});
  }
  return {total:results.length,results:results.slice(0,limit),truncated:results.length>limit};
}
