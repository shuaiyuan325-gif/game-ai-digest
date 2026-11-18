import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args={};for(let i=2;i<process.argv.length;i+=2) args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const hosts={codex:'.agents',claude:'.claude',cursor:'.cursor',gemini:'.gemini',harness:'.dsh'};
if(!hosts[args.agent] || !args.project || !path.isAbsolute(args.project)) throw new Error('用法: node scripts/install-skill.mjs --agent codex|claude|cursor|gemini|harness --project 绝对项目路径 [--upgrade true]');
const project=await fs.realpath(args.project);
const target=path.join(project,hosts[args.agent],'skills','game-ai-digest');
if(!path.relative(project,target) || path.relative(project,target).startsWith('..')) throw new Error('安装路径检查失败');
let cursor=project;
for(const segment of [hosts[args.agent],'skills']) {
  cursor=path.join(cursor,segment);
  try {const stat=await fs.lstat(cursor);if(stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('安装路径含符号链接或不是文件夹');}
  catch(e){if(e.code!=='ENOENT') throw e;await fs.mkdir(cursor);}
}
let existing=false;
try {const stat=await fs.lstat(target);if(stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('目标不是普通技能文件夹');existing=true;}
catch(e){if(e.code!=='ENOENT') throw e;}
if(existing) {
  if(args.upgrade!=='true') throw new Error('已安装；确认升级后加 --upgrade true。知识库和个人设置不在安装目录中。');
  const backupRoot=path.join(project,'.game-ai-digest-install-backups');await fs.mkdir(backupRoot,{recursive:true});
  if((await fs.lstat(backupRoot)).isSymbolicLink()) throw new Error('备份目录不能是符号链接');
  await fs.rename(target,path.join(backupRoot,`game-ai-digest-${Date.now()}`));
}
await fs.cp(path.join(root,'skills/game-ai-digest'),target,{recursive:true,errorOnExist:true,force:false});
console.log(JSON.stringify({agent:args.agent,target,next:'重新加载技能或新建会话，然后按 docs/start.md 初始化。安装没有启用定时任务。'},null,2));
