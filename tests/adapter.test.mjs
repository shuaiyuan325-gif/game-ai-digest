import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as core from '../skills/game-ai-digest/scripts/archive.mjs';
import { createDefinitions } from '../packages/harness-plugin/adapter.mjs';

async function setup(t) {
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'game-ai-digest-test-'));
  t.after(async()=>{assert.equal(path.dirname(path.resolve(directory)),path.resolve(os.tmpdir()));assert.ok(path.basename(directory).startsWith('game-ai-digest-test-'));await fs.rm(directory,{recursive:true,force:true});});
  let root=path.join(directory,'library');await fs.mkdir(root);
  let clock=Date.now();
  const tools=new Map(createDefinitions(core,{guide:async m=>m,getRoot:async()=>root,setRoot:async next=>{root=next;return {archiveRoot:root};},now:()=>clock}).map(d=>[d.name,d]));
  const context={agent:{id:'session-a'},signal:new AbortController().signal};
  const call=async(name,args={},exec=context)=>JSON.parse(await tools.get(`game_ai_digest_${name}`).execute(args,exec));
  const selectionJson=JSON.stringify({items:[{eventId:'synthetic-voice-v1',title:'合成语音测试',topic:'npc',sources:[{title:'合成来源',url:'https://example.org/voice'}],body:'测试资料：运行费用需要验证。'}]});
  return {directory,root,context,call,selectionJson,advance:ms=>{clock+=ms;}};
}
test('预览不写新闻，确认写入且重复提交被拒绝',async t=>{
  const {root,call,selectionJson}=await setup(t),plan=await call('prepare',{selectionJson});
  assert.deepEqual(await fs.readdir(root),[]);
  await assert.rejects(call('commit',{token:plan.token,userConfirmed:false}));
  const done=await call('commit',{token:plan.token,userConfirmed:true});assert.equal(done.written.length,1);
  await assert.rejects(call('commit',{token:plan.token,userConfirmed:true}));
  assert.equal((await call('search',{query:'费用'})).total,1);
});
test('其他会话不能使用预览 token',async t=>{
  const {root,call,selectionJson}=await setup(t),plan=await call('prepare',{selectionJson});
  await assert.rejects(call('commit',{token:plan.token,userConfirmed:true},{agent:{id:'session-b'}}));
  assert.deepEqual(await fs.readdir(root),[]);
});
test('目录变化后旧预览拒绝写入',async t=>{
  const {directory,root,call,selectionJson}=await setup(t),plan=await call('prepare',{selectionJson});
  const other=path.join(directory,'other');await fs.mkdir(other);await call('configure',{archiveRoot:other});
  await assert.rejects(call('commit',{token:plan.token,userConfirmed:true}));
  assert.deepEqual(await fs.readdir(root),[]);assert.deepEqual(await fs.readdir(other),[]);
});
test('取消的工具执行不会写入',async t=>{
  const {root,call,selectionJson,context}=await setup(t),abort=new AbortController();abort.abort();
  await assert.rejects(call('prepare',{selectionJson},{agent:context.agent,signal:abort.signal}));assert.deepEqual(await fs.readdir(root),[]);
});
test('过期预览不能提交',async t=>{
  const {root,call,selectionJson,advance}=await setup(t),plan=await call('prepare',{selectionJson});
  advance(16*60*1000);await assert.rejects(call('commit',{token:plan.token,userConfirmed:true}));
  assert.deepEqual(await fs.readdir(root),[]);
});
