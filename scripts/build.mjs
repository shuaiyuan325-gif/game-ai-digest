import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const plugin=JSON.parse(await fs.readFile(path.join(root,'packages/harness-plugin/package.json'),'utf8'));
if(pkg.version!==plugin.version) throw new Error('核心与插件版本不一致');
await fs.mkdir(dist,{recursive:true});
async function files(directory,prefix='') {
  const result=[];
  for(const entry of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(entry.isSymbolicLink()) throw new Error('安装包不能包含符号链接');
    const name=path.posix.join(prefix,entry.name),full=path.join(directory,entry.name);
    if(entry.isDirectory()) result.push(...await files(full,name));
    else if(entry.isFile()) result.push({name,data:await fs.readFile(full)});
  }
  return result;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++) n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=data=>{let n=0xffffffff;for(const b of data)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
export function zip(entries) {
  const local=[],central=[];let offset=0;
  for(const entry of entries) {
    const name=Buffer.from(entry.name),data=entry.data,crc=crc32(data);
    const head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(33,12);head.writeUInt32LE(crc,14);head.writeUInt32LE(data.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(name.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
    local.push(head,name,data);central.push(c,name);offset+=head.length+name.length+data.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
function tar(entries) {
  const blocks=[];
  for(const {name,data} of entries) {
    if(Buffer.byteLength(name)>100) throw new Error(`tar 路径过长: ${name}`);
    const head=Buffer.alloc(512);
    const string=(s,at,len)=>head.write(s,at,len,'ascii');
    const octal=(n,at,len)=>string(n.toString(8).padStart(len-1,'0')+'\0',at,len);
    string(name,0,100);octal(0o644,100,8);octal(0,108,8);octal(0,116,8);octal(data.length,124,12);octal(0,136,12);head.fill(32,148,156);head[156]=48;string('ustar\0',257,6);string('00',263,2);
    const sum=head.reduce((a,b)=>a+b,0);string(sum.toString(8).padStart(6,'0')+'\0 ',148,8);
    blocks.push(head,data,Buffer.alloc((512-data.length%512)%512));
  }
  return Buffer.concat([...blocks,Buffer.alloc(1024)]);
}
const core=await files(path.join(root,'skills/game-ai-digest'),'skills/game-ai-digest');
const portable=[...core,...await files(path.join(root,'docs'),'docs'),...await files(path.join(root,'config'),'config'),{name:'开始使用.md',data:await fs.readFile(path.join(root,'docs/start.md'))},{name:'scripts/install-skill.mjs',data:await fs.readFile(path.join(root,'scripts/install-skill.mjs'))}];
const skillName=`game-ai-digest-skill-${pkg.version}.zip`;
await fs.writeFile(path.join(dist,skillName),zip(portable.map(e=>({...e,name:'game-ai-digest/'+e.name}))));
const pluginEntries=[...await files(path.join(root,'packages/harness-plugin')),...core.map(e=>({...e,name:e.name.replace('skills/game-ai-digest/','skill/')}))];
const pluginName=`dsh-plugin-game-ai-digest-${pkg.version}.tgz`;
await fs.writeFile(path.join(dist,pluginName),gzipSync(tar(pluginEntries.map(e=>({...e,name:'package/'+e.name})))));
// A separate source archive is useful when the repository isn't accessible yet.
const sourceEntries=[];
for(const name of ['skills','packages','docs','scripts','tests','.github']) sourceEntries.push(...await files(path.join(root,name),name));
sourceEntries.push({name:'config/defaults.json',data:await fs.readFile(path.join(root,'config/defaults.json'))});
for(const name of ['package.json','README.md','AGENTS.md','CHANGELOG.md','.gitignore']) sourceEntries.push({name,data:await fs.readFile(path.join(root,name))});
const sourceName=`game-ai-digest-source-${pkg.version}.zip`;
await fs.writeFile(path.join(dist,sourceName),zip(sourceEntries.map(e=>({...e,name:'game-ai-digest/'+e.name}))));
const hashes=[];
for(const name of [skillName,pluginName,sourceName]) hashes.push(`${createHash('sha256').update(await fs.readFile(path.join(dist,name))).digest('hex')}  ${name}`);
await fs.writeFile(path.join(dist,'SHA256SUMS.txt'),hashes.join('\n')+'\n');
console.log(JSON.stringify({version:pkg.version,artifacts:[skillName,pluginName,sourceName,'SHA256SUMS.txt'],dist},null,2));
