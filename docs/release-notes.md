# v0.1.0 预览包

两个安装入口共用研究规则和归档格式。下载 skill ZIP 用于各 Agent；下载 dsh-plugin TGZ 用于 Harness。source ZIP 是完整源代码，不是 Harness 安装包。SHA256SUMS.txt 用于核对下载完整性。

已在 Windows / Node.js 22.23.2 验证核心单元测试、适配层合约测试、静态检查和打包。GitHub Actions 配置了 Windows/Linux 与 Node.js 22/24 检查，但远程工作流尚未运行，不能将配置视为通过记录。

真实 Harness 加载、其他 Agent 安装和宿主定时任务待现场验收。目标 Harness API 系列为 0.2.2；不声明其他系列兼容。不自动归档任何未选择的信息，也不自动创建定时任务。

个人设置与知识库独立保存。升级前保留备份；此版本不迁移任何已有真实资料。
