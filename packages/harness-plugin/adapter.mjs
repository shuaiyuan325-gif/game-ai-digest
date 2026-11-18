import { randomUUID } from 'node:crypto';

// Pure adapter: receives real archive functions; tests exercise the same definitions.
export function createDefinitions(core,{guide,getRoot,setRoot,readPreferences=()=>core.readConfig(),now=Date.now}) {
  const pending=new Map();
  const string={type:'string'};
  const output={schema:{type:'string'},render:(_args,value)=>[{type:'text',text:value}]};
  const stringify=fn=>async(args,exec)=>{
    exec?.signal?.throwIfAborted();
    const result=await fn(args,exec);
    return typeof result==='string'?result:JSON.stringify(result,null,2);
  };
  const tool=(name,description,parameters,execute)=>({name,description,parameters,output,execute:stringify(execute)});
  return [
    tool('game_ai_digest_guide','加载游戏 AI 日报规则。先读取规则，再使用当前宿主的联网搜索与来源获取能力研究；本工具不伪造新闻，也不自行联网。',{mode:{...string,description:'setup / research / archive / schedule，默认 research'}},async({mode='research'})=>guide(mode)),
    tool('game_ai_digest_status','读取个人偏好、归档目录与运行说明，不写文件。',{},async()=>({preferences:await readPreferences(),archiveRoot:await getRoot(false),scheduling:'请使用宿主的原生定时任务；本插件未创建任务'})),
    tool('game_ai_digest_configure','仅在用户明确选择或更改归档位置时调用。保存个人配置、检查目录读写，不保存新闻。',{archiveRoot:{...string,required:true,description:'用户选择的绝对归档路径'}},async({archiveRoot})=>setRoot(archiveRoot)),
    tool('game_ai_digest_prepare','仅对用户已明确选定收录的情报生成归档预览。数据只保留在当前进程内存，15分钟过期。不要对未选择的整份日报调用。',{selectionJson:{...string,required:true,description:'包含 items 的 JSON；字段遵循 archive 规则'}},async({selectionJson},exec)=>{
      if(selectionJson.length>2_000_000) throw new Error('选择内容过大，请分批归档');
      if(!exec?.agent) throw new Error('需要带当前会话身份的工具执行上下文');
      for(const [key,value] of pending) if(value.expires<now()) pending.delete(key);
      if(pending.size>=30) throw new Error('待确认批次过多，请先完成现有批次');
      const plan=core.prepare(JSON.parse(selectionJson));
      const token=randomUUID(),root=await getRoot(true);
      pending.set(token,{plan,root,owner:exec.agent,expires:now()+15*60*1000});
      return {token,archiveRoot:root,items:plan.preview,instruction:'仅在用户已明确选定这些条目后提交；已确认的相同选择无需重复询问。内容变化时重新预览。'};
    }),
    tool('game_ai_digest_commit','写入用户已明确确认的归档条目。token 不是用户同意的替代；必须核对对话中的具体选择。未确认、其他会话、过期或目录变化均拒绝。',{token:{...string,required:true},userConfirmed:{type:'boolean',required:true,description:'用户在对话中已明确选择本批次内容才可为 true'}},async({token,userConfirmed},exec)=>{
      const item=pending.get(token);
      if(!userConfirmed || !item || item.owner!==exec?.agent || item.expires<now()) throw new Error('没有可提交的本会话已确认预览');
      if(await getRoot(true)!==item.root) throw new Error('归档目录已变化，请重新预览');
      const result=await core.commit(item.root,{items:item.plan.items},item.plan.token);
      pending.delete(token);return result;
    }),
    tool('game_ai_digest_search','检索已归档情报的元数据和正文；返回包含来源的情报卡，不将归档旧消息冒充当前状态。',{query:{...string,description:'空格分隔的关键词，所有词均需匹配'},topic:{...string,description:'可选 art/npc/development/worlds/qa/publishing/models'}},async({query='',topic})=>core.search(await getRoot(true),{query,topic,limit:20})),
    tool('game_ai_digest_reindex','用户要求修复索引时，从原始情报卡重建索引；保留卡片和历史。',{},async()=>core.reindex(await getRoot(true))),
  ];
}
