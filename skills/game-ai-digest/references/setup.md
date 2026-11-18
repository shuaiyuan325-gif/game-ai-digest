# 初始化与迁移

Ask only for missing choices. Accept the archive location and preferences from the user's instruction directly. Do not ask again when already given. Defaults: Chinese, gaming across development/art/design/QA/publishing/operations, timezone Asia/Shanghai, desired schedule 09:00 daily. Scheduling remains disabled until requested. An archive directory has no universal default: the user selects it. A portable relative directory is resolved against the selected project and stored as an absolute path in personal config.

Check separately: skill load, live search, source fetch, directory read/write, native scheduler. A tool's name alone is not proof that its operation works. Report doc-supported versus tested capabilities distinctly. Never grant permissions or install unrelated programs automatically.

Instruction-only mode: use host file tools for configuration and archiving. Optional Node helper: `node <skill>/scripts/cli.mjs init --root <chosen-absolute-directory>`. It saves per-user config at GAME_AI_DIGEST_CONFIG if supplied, otherwise ~/.game-ai-digest/config.json. It creates the chosen library, performs a disposable write check and preserves existing configuration; it saves no news. `status` reads configuration without changing it. `guide` prints the installed rules. The host must itself have permissions to the target directory.

Personal config format: {"schemaVersion":1,"archiveRoot":"absolute path","language":"zh-CN","timezone":"Asia/Shanghai","focus":["game"],"schedule":{"enabled":false,"time":"09:00"}}. Additional user preferences may be retained. Do not put credentials in this file. On another computer, copy the library plus personal config, then resolve the new archive path and check access. Do not copy old account authentication or claim schedules migrated automatically.

Supported install paths are explained in docs/install.md in the distribution. For an unknown host, give the SKILL.md and required references to its file-reading or custom-instruction mechanism; do not call that native skill installation unless the host supports it.
