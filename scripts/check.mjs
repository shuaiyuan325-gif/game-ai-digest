import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(root,'skills/game-ai-digest');
const content=await fs.readFile(path.join(skill,'SKILL.md'),'utf8');
if(!/^---\r?\nname: game-ai-digest\r?\ndescription: .+\r?\n/m.test(content)) throw new Error('SKILL frontmatter 不完整');
if(/\b(?:TODO|TBD|PLACEHOLDER)\b/.test(content)) throw new Error('技能含未完成占位');
for(const match of content.matchAll(/\]\((references\/[^)]+)\)/g)) await fs.access(path.join(skill,match[1]));
for(const file of ['package.json','packages/harness-plugin/package.json','config/defaults.json']) JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
async function visit(dir) {
  for(const e of await fs.readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,e.name);
    if(e.isSymbolicLink()) throw new Error('源代码不允许符号链接');
    if(e.isDirectory()) await visit(file);
    else if(e.name.endsWith('.mjs')) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  }
}
for(const d of ['scripts','skills','packages','tests']) await visit(path.join(root,d));
const plugin=JSON.parse(await fs.readFile(path.join(root,'packages/harness-plugin/package.json'),'utf8'));
if(plugin.dsh?.bundle?.patch!=='./cordis.patch.yml') throw new Error('Harness bundle 清单无效');
console.log('通过：技能元数据、引用文件、JSON 清单、JS 语法与 bundle 声明。');
