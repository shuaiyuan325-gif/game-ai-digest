# 定时任务

The skill is the workflow, not a background scheduler. Prefer the selected host's native scheduler. Check version, time zone, account/tool availability, project/skill visibility and app uptime requirements. Check for an existing matching task before creating another. Do not modify an old computer's schedule unless the user asks. Activate scheduling only when requested.

Suggested saved task prompt:

> 使用 game-ai-digest 生成今天的全球 AI 日报，优先并详细分析游戏行业相关信息。读取当前时间及我的个人设置，过去24小时为主，明确标注补充背景和来源。日报展示在任务结果中；不要保存任何新闻或自动归档。只有我读完并选定具体条目后，才通过交互会话分类归档。缺少联网或来源核验能力时明确说明。不要修改定时任务本身。

Default suggested time is 09:00 Asia/Shanghai daily, weekends included. This file does not register a task. Cloud scheduling must have access to the packaged skill itself; a local skill directory is not automatically visible in cloud runs. Cloud cannot directly write a user's local library. Local schedulers require the host/runtime and machine available as their product specifies. Do not promise missed-run catch-up without testing that host's behavior.

For DeepSeek Harness, use its installed Scheduled tasks capability if available; this v0.1 bundle supplies the prompt and workflow, not a second independent scheduler. Verify one manual run before scheduling. For a host lacking scheduling, keep manual generation available and explain that automatic triggering needs a separate supported integration.
