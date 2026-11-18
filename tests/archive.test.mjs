import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { init,readConfig,prepare,commit,search,reindex } from '../skills/game-ai-digest/scripts/archive.mjs';

async function fixture(t) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'game-ai-digest-test-'));
  t.after(async()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('game-ai-digest-test-'));await fs.rm(dir,{recursive:true,force:true});});
  const root=path.join(dir,'library'),configFile=path.join(dir,'settings','config.json');
  await init(root,configFile);return {dir,root,configFile};
}
const payload=(overrides={})=>({items:[{eventId:'synthetic-model-v1-release',title:'测试角色工具',topic:'art',tags:['角色一致性'],companies:['测试公司'],products:['测试产品'],eventDate:'2026-11-18',sources:[{title:'合成测试来源',url:'https://example.org/release'}],body:'合成测试资料：用于角色立绘，尚未进行游戏运行时测试。',notes:['用户选择的测试备注'],...overrides}]});

test('初始化只保存配置，保留已有偏好且不写新闻',async t=>{
  const {root,configFile}=await fixture(t);
  assert.deepEqual(await fs.readdir(root),[]);
  const config=await readConfig(configFile);config.language='en';await fs.writeFile(configFile,JSON.stringify(config));
  await init(root,configFile);assert.equal((await readConfig(configFile)).language,'en');
});
test('未确认或确认后内容变化均不写入',async t=>{
  const {root}=await fixture(t),input=payload(),plan=prepare(input);
  await assert.rejects(commit(root,input,''));
  await assert.rejects(commit(root,payload({body:'changed'}),plan.token));
  assert.deepEqual(await fs.readdir(root),[]);
});
test('按主题保存，全文检索跨过标题，重复收录幂等',async t=>{
  const {root}=await fixture(t),input=payload(),plan=prepare(input);
  const first=await commit(root,input,plan.token);
  assert.match(first.written[0].path,/cards\/美术与资产\//);
  const before=await fs.readFile(path.join(root,first.written[0].path),'utf8');
  assert.equal((await search(root,{query:'立绘 用户选择'})).total,1);
  assert.equal((await search(root,{query:'立绘',topic:'npc'})).total,0);
  assert.equal((await commit(root,input,plan.token)).written[0].status,'unchanged');
  assert.equal(await fs.readFile(path.join(root,first.written[0].path),'utf8'),before);
});
test('更新同一事件保留旧正文和用户备注，不复制为另一个主题卡',async t=>{
  const {root}=await fixture(t),first=payload();await commit(root,first,prepare(first).token);
  const second=payload({body:'新测试结论：导出能力改善。',notes:['第二条备注'],topic:'development'});
  await commit(root,second,prepare(second).token);
  const found=await search(root,{query:'导出'});assert.equal(found.total,1);assert.equal(found.results[0].topic,'art');
  assert.ok(found.results[0].body.includes('角色立绘'));assert.deepEqual(found.results[0].notes,['用户选择的测试备注','第二条备注']);
});
test('迁移整个资料目录后检索有效，索引可从卡片恢复',async t=>{
  const {dir,root}=await fixture(t),input=payload();await commit(root,input,prepare(input).token);
  const moved=path.join(dir,'moved');await fs.rename(root,moved);await fs.unlink(path.join(moved,'index.jsonl'));
  assert.equal((await search(moved,{query:'测试产品'})).total,1);
  assert.equal((await reindex(moved)).count,1);
  const row=JSON.parse((await fs.readFile(path.join(moved,'index.jsonl'),'utf8')).trim());assert.equal(path.isAbsolute(row.path),false);
});
test('文件名中的穿越字符被处理，分类与日期必须合法',async t=>{
  const {root}=await fixture(t),input=payload({title:'../../outside\\evil'});const out=await commit(root,input,prepare(input).token);
  assert.ok(!path.relative(root,path.resolve(root,out.written[0].path)).startsWith('..'));
  assert.throws(()=>prepare(payload({topic:'../../other'})));
  assert.throws(()=>prepare(payload({eventDate:'2026-02-30'})));
  assert.throws(()=>prepare(payload({sources:[{url:'file:///secret'}]})));
});
test('已有写入锁时不覆盖文件',async t=>{
  const {root}=await fixture(t),input=payload();await fs.writeFile(path.join(root,'.game-ai-digest.lock'),'busy');
  await assert.rejects(commit(root,input,prepare(input).token));assert.deepEqual(await fs.readdir(root),['.game-ai-digest.lock']);
});
test('不跟随知识库内部的目录链接',async t=>{
  const {dir,root}=await fixture(t),outside=path.join(dir,'outside');await fs.mkdir(outside);
  try {await fs.symlink(outside,path.join(root,'cards'),process.platform==='win32'?'junction':'dir');}
  catch(e){if(['EPERM','EACCES'].includes(e.code)){t.skip('当前环境不允许创建链接');return;}throw e;}
  const input=payload();await assert.rejects(commit(root,input,prepare(input).token));assert.deepEqual(await fs.readdir(outside),[]);
});
