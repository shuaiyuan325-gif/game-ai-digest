import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import * as core from './skill/scripts/archive.mjs';
import { createDefinitions } from './adapter.mjs';

export const name='game-ai-digest';
export const inject=['tools','skills'];
export const Config=Schema.object({archiveRoot:Schema.string().default('')});
const base=path.join(path.dirname(fileURLToPath(import.meta.url)),'skill');
const modes=new Set(['setup','research','archive','schedule']);

export async function apply(ctx,config) {
  let currentRoot=config.archiveRoot || null;
  const content=await fs.readFile(path.join(base,'SKILL.md'),'utf8');
  const guide=async mode=>{
    if(!modes.has(mode)) throw new Error('未知 mode；支持 setup/research/archive/schedule');
    return content+'\n\n'+await fs.readFile(path.join(base,'references',`${mode}.md`),'utf8')+'\n\n当前个人偏好：\n'+JSON.stringify(await core.readConfig());
  };
  const getRoot=async required=>{
    const root=currentRoot || (await core.readConfig())?.archiveRoot || null;
    if(required && !root) throw new Error('请先通过 configure 设置用户选择的归档目录');
    return root;
  };
  const setRoot=async root=>{const config=await core.init(root);currentRoot=config.archiveRoot;return config;};
  ctx.skills.register({name:'game-ai-digest',description:'全球 AI 日报，游戏优先；用户确认后分类归档、检索知识库。',content:content.replace(/^---[\s\S]*?---\s*/,''),source:'runtime',resourceBase:{kind:'directory',path:base}});
  for(const definition of createDefinitions(core,{guide,getRoot,setRoot})) ctx.tools.register(defineTool(definition));
}
