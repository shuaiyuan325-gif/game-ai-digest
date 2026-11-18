# DeepSeek Harness 游戏 AI 日报插件

这是 v0.1.0 预览版。按官方 0.2.2 系列 API 编写，完成归档核心及适配层测试；尚未在真实 DSH 进程完成安装联调。宿主须提供 tools、skills、联网搜索/来源获取能力。调度使用宿主的 Scheduled tasks 功能，插件不自行注册后台任务。

下载 Releases 中预构建的 dsh-plugin-game-ai-digest-0.1.0.tgz。已有 dsh CLI 的使用者可运行：

```sh
dsh plugin --profile default add ./dsh-plugin-game-ai-digest-0.1.0.tgz
```

将 default 替换为实际正在使用的 profile，不要新建一个不使用的 profile。桌面版使用插件管理中的添加本地包入口（以安装版本界面为准）；如果该版不支持此入口，使用官方 CLI 安装方式。安装后开启插件；若要求重启，重启并新建会话。

在聊天中说：“使用游戏 AI 日报，归档目录设置为我指定的绝对路径，检查能力并生成一份日报。”configure 会保存个人目录；也可在插件配置 archiveRoot 中指定。请不要把个人目录、API key 或知识库提交到源代码仓库。

guide 提供研究规则；搜索、打开网页和撰写日报由宿主 Agent 执行。prepare/commit 负责已选择条目的确认归档；search 负责正文检索；reindex 修复索引。未选择的新闻不会保存到磁盘。插件使用配置目录执行文件操作，受宿主进程文件权限限制；安装时只选择你允许写入的位置。

不要把 .tgz 解压后重新上传成一个空技能包。它包含可执行 JS、dsh.bundle 清单和完整 skill 资源，无需使用者本地编译。包不内置模型密钥或独立搜索服务。

官方依据：
- https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish
- https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/tool
- https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/skills
