# 安装与环境

## 通用 skill

复制整个 `skills/game-ai-digest` 文件夹到所选 Agent 的项目级技能目录（不要只复制 SKILL.md）。项目是你在该 Agent 中打开的工作文件夹：

| Agent | 项目内目的地 |
|---|---|
| Codex | `.agents/skills/game-ai-digest` |
| Claude Code | `.claude/skills/game-ai-digest` |
| Cursor | `.cursor/skills/game-ai-digest` |
| Gemini CLI | `.gemini/skills/game-ai-digest` |
| DeepSeek Harness，技能方式 | `.dsh/skills/game-ai-digest` |

不需要同时复制到多个目录，否则某些宿主可能显示重名技能。新建会话/重新加载后，用技能名或自然语言调用。各宿主菜单和自动发现范围可能随版本变化；先检查实际加载结果。

你可以让有文件操作能力的 Agent 完成复制，不必手动操作。已安装 Node.js 22+ 时，也可从解压目录运行可选安装器：

```sh
node scripts/install-skill.mjs --agent claude --project "你的绝对项目路径"
```

替换 claude 为 codex/cursor/gemini/harness。已有安装需明确升级并加 `--upgrade true`；旧技能备份放在项目 `.game-ai-digest-install-backups`，个人配置和知识库不会被替换。安装器不安装 Agent、不处理账号登录、不授予目录权限、不启用调度。说明型 skill 本身不依赖 Node.js；Node 仅用于可选安装器/归档 helper。

## Harness 插件

请阅读插件包 README。它是可执行 JS bundle，已包含 skill。勿另外重复安装同名 skill，除非需要项目规则覆盖插件规则。目标 API 是 Harness 0.2.2 系列，真实宿主联调尚未完成；旧版本会被清单拒绝，其他版本需先适配。安装预构建 TGZ 不需本地编译，不需把本项目装成 npm 开发环境。

## 能力与权限

最新消息需要搜索和打开原始来源；本地归档需要用户选定目录的访问权限；定时任务需宿主支持。账户、套餐、企业策略和网络会影响这些能力。首次只检查本任务所需能力，保留公司的权限边界。

宿主云端任务不能自动看到本机技能和资料目录。定时任务由所在宿主配置，不能通过复制本地文件保证恢复。参考技能 references/schedule.md。

官方依据（2026-11-18 核对）：
- https://agentskills.io/specification
- https://learn.chatgpt.com/docs/build-skills
- https://code.claude.com/docs/en/skills
- https://cursor.com/docs/skills
- https://geminicli.com/docs/cli/skills/
- https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/skills
