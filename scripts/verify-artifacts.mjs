import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {version}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const tar=gunzipSync(await fs.readFile(path.join(root,'dist',`dsh-plugin-game-ai-digest-${version}.tgz`)));
const entries=new Map();let offset=0;
while(offset<tar.length && tar[offset]) {
  const head=tar.subarray(offset,offset+512),name=head.subarray(0,100).toString().replace(/\0.*$/s,'');
  const size=parseInt(head.subarray(124,136).toString().replace(/\0.*$/s,''),8);
  const checksum=parseInt(head.subarray(148,156).toString().trim().replace(/\0.*$/s,''),8);
  assert.equal(head.reduce((sum,b,i)=>sum+(i>=148 && i<156?32:b),0),checksum);
  assert.ok(name.startsWith('package/') && !name.split('/').includes('..'));
  entries.set(name,tar.subarray(offset+512,offset+512+size));offset+=512+Math.ceil(size/512)*512;
}
for(const name of ['index.mjs','adapter.mjs','cordis.patch.yml','skill/SKILL.md','skill/references/research.md','skill/scripts/archive.mjs']) assert.ok(entries.has('package/'+name),name);
const manifest=JSON.parse(entries.get('package/package.json').toString());assert.equal(manifest.version,version);assert.ok(manifest.dsh.bundle.patch);
for(const name of [`game-ai-digest-skill-${version}.zip`,`game-ai-digest-source-${version}.zip`]) {
  const zip=await fs.readFile(path.join(root,'dist',name));assert.equal(zip.readUInt32LE(),0x04034b50);assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);
}
console.log(`安装包检查通过：TGZ 校验和、${entries.size} 个包文件、入口/资源齐全、ZIP 目录标记。`);
