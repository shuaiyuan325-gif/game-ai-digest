# 上传与发布

仓库同时管理共享 skill 和 Harness 插件。代码提交后，Check and package 工作流检查并上传构建附件；仓库管理员可在 Actions 中选择 Prepare draft release → Run workflow，构建带版本号的草稿 Release。检查草稿说明和附件后再发布。

工作流读取 package.json 版本，创建对应 vX.Y.Z 标签及草稿；同一版本只创建一次。迭代时同步更新根 package.json、插件 package.json、skill metadata.version、CHANGELOG 和 release-notes。不要在已发布版本下替换不兼容内容。

私有仓库的代码和 Release 附件需要访问权限；同事可获授权后下载，也可由维护者将安装包直接发给他们。下载包运行不需要持续关联维护者的 GitHub 账号。

正式发布前，应完成目标 Agent 的真实加载、生成、选择归档、重启检索和调度验收。v0.1 是预览包，远程 CI 或真实宿主未验证的部分应保留状态说明。不要提交个人配置、凭据或真实知识库。
