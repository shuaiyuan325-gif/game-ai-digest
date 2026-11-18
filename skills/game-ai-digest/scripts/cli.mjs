import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init,readConfig,prepare,commit,search,reindex } from './archive.mjs';

const [command,...rest]=process.argv.slice(2);
const options={};
for(let i=0;i<rest.length;i+=2){if(!rest[i].startsWith('--') || rest[i+1]===undefined) throw new Error('参数格式: --名称 值');options[rest[i].slice(2)]=rest[i+1];}
try {
  let result;
  if(command==='init') result=await init(options.root);
  else if(command==='status') result={config:await readConfig(),scheduling:'由宿主设置，helper 不注册定时任务'};
  else if(command==='guide') result=await fs.readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../SKILL.md'),'utf8');
  else if(command==='preview') result=prepare(JSON.parse(await fs.readFile(options.input,'utf8')));
  else {
    const config=await readConfig();if(!config?.archiveRoot) throw new Error('尚未初始化归档目录');
    if(command==='archive') result=await commit(config.archiveRoot,JSON.parse(await fs.readFile(options.input,'utf8')),options.confirm);
    else if(command==='search') result=await search(config.archiveRoot,{query:options.query||'',topic:options.topic,limit:Number(options.limit||20)});
    else if(command==='reindex') result=await reindex(config.archiveRoot);
    else throw new Error('命令: init --root 路径 | status | guide | preview --input 已选条目.json | archive --input 已选条目.json --confirm 指纹 | search --query 关键词 | reindex');
  }
  process.stdout.write(typeof result==='string'?result+'\n':JSON.stringify(result,null,2)+'\n');
} catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
