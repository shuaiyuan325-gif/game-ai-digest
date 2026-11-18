# 选择归档、分类与检索

Archive only explicit selected items and user notes. “生成日报”“阅读了”“以后需要归档” are not selection. A scheduled run never receives advance blanket permission to archive news. Full-report export is a separate explicit request.

Use these primary topics, adding tags for cross-topic discovery: art=美术与资产, npc=智能NPC与交互, development=研发工具与引擎, worlds=AI原生玩法与世界模型, qa=测试与质量保障, publishing=发行与运营, models=模型与基础设施. One canonical card per stable eventId (product/version/event; not today's report row). Store source and event dates as metadata. Index fields: id, eventId, title, topic, tags, companies, products, eventDate, publishedDate, archivedAt, sources, notes, relative path. Do not save full copyrighted articles.

Library layout: cards/<Chinese-topic>/<readable-title>--<stable-id>.md, index.jsonl and 主题目录.md. Internal paths are relative. Each card begins with a one-line `<!-- game-ai-digest: {...JSON metadata...} -->` then readable Markdown. Include facts, game analysis, limitations, recommendation and the user's notes in the body. Keep facts and interpretation distinguishable. The helper retains revisions when updating a stable event; changing topic does not create a second canonical copy.

Optional Node helper stages a plan in memory or prints it without saving news. CLI `preview --input <user-approved-local-json>` prints a SHA256 fingerprint; `archive --input <same-json> --confirm <fingerprint>` writes after the user explicitly approves the preview and selects the items. Do not create the local input JSON with news until the user has selected those news items. Harness tools hold the preview in memory and return a token; call commit only after the user's explicit confirmation. A flag or token does not replace conversational consent.

Payload: {"items":[{"eventId":"product-version-release","title":"Title","topic":"art","tags":["3D"],"companies":[],"products":[],"eventDate":"YYYY-MM-DD or null","publishedDate":"YYYY-MM-DD or null","sources":[{"title":"Original source","url":"https://..."}],"body":"Markdown facts, game analysis, limitations and recommendation","notes":["user note"]}]}. Each event needs at least one http/https source. Reject duplicate eventIds in a single selection. Never use an arbitrary title as an unchecked filesystem path.

Writes are confined to the configured root; do not follow symlinks inside it. The optional helper uses a library lock and atomically replaces individual files. If an interrupted operation leaves a stale lock, verify no writer is running before manually removing it. If card writing succeeded but index update failed, run `reindex`. Do not report whole-operation success if a write failed.

## Retrieval

Read index.jsonl, filter by tags/topic/company/product/date, then read matching cards before answering with source links and relative card locations. Search the full body as needed; metadata-only matches may miss useful facts. Optional helper: `search --query "关键词" --topic npc`, `reindex`. Distinguish no result, unavailable folder, and unreadable/corrupted index. Index rebuild scans cards and preserves historical revisions. Use archived dates as filters, not an assumption that saved model prices or access conditions are still current; browse to verify current claims when required.
