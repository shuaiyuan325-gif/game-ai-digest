# 游戏 AI 日报 · Game AI Digest

一套规则，两种交付：跨 Agent 通用 skill，以及 DeepSeek Harness 原生插件。全球 AI 动态使用中文汇报，详细分析游戏行业相关进展。日报先在聊天中阅读；只有用户明确选择的条目才分类归档。知识库按主题、标签、公司、产品和日期检索。

当前版本 **0.1.0 预览版**。核心归档和适配层有自动测试；真实 Agent 安装、实时研究质量和原生调度仍需在使用者环境验收，详见 [兼容性](docs/compatibility.md)。

## 普通使用者

1. 下载 Releases 中 skill `.zip` 或 Harness `.tgz` 附件，不要把 GitHub 的 Source code 压缩包当成插件。
2. 阅读 [开始使用](docs/start.md) 和 [安装指南](docs/install.md)。
3. 用自己的账号和模型，选择自己的归档目录。
4. 先手动生成日报，再根据宿主支持情况开启定时任务。

不支持原生 skill 的 Agent 可以读取通用说明运行支持的功能；无法联网就不能核验最新消息，不能写本地文件就不能完成自动本地归档。包不内置模型账号、搜索密钥或独立爬虫。

## 维护者

Node.js 22+ 可运行仓库校验、测试、打包和可选的归档 helper；Harness 自身运行时按其版本要求（本插件目标系列要求 Node.js 24.9+ 或桌面内置运行时）。构建不下载 npm 依赖。

```sh
node --test tests/*.test.mjs
node scripts/check.mjs
node scripts/build.mjs
```

`dist/` 输出 skill ZIP、Harness TGZ、完整源代码 ZIP 和 SHA256 校验值。`skills/game-ai-digest` 是共享规则的唯一源，构建时复制到插件包。

个人设置、已归档新闻、备注和凭据不进入这个仓库。参考 [迁移与迭代](docs/migration.md) 和 [更新记录](CHANGELOG.md)。暂未授予额外开源许可。
