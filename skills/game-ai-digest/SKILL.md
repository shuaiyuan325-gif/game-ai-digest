---
name: game-ai-digest
description: Research a Chinese daily briefing on global AI developments with detailed game-industry analysis; archive only explicitly selected items into a user-chosen local topic library; search that library. Use for game AI news, selective archiving, and retrieval, not general game news.
compatibility: Requires current web search and source retrieval for news. Local archive/retrieval requires file access to the selected directory. Native scheduling is optional and host-specific. Optional helper scripts require Node.js 22+; the instruction workflow has no runtime dependency.
metadata:
  version: "0.1.0"
---

# 游戏 AI 日报

Read the reference for the requested operation, not every reference on each invocation.

- First use, change agent/computer/directory: [setup](references/setup.md).
- Generate or refresh a briefing: [research](references/research.md), including the report format and source policy.
- User selects items to save: [archive](references/archive.md).
- Search saved knowledge: follow the retrieval section of [archive](references/archive.md).
- Set up a schedule: [schedule](references/schedule.md). A skill does not itself run on a clock.

Honor these shared rules:

1. Use the current clock and Asia/Shanghai unless the user's configuration says otherwise. Never assume today's date from an example.
2. Prioritize direct game developments, then transferable AI capabilities, then consequential general AI news. Explain game uses in more depth than general headlines. Do not pad quiet days.
3. Search and open primary sources. Distinguish publication date, event date, current availability, vendor claims and your analysis. Explicitly label older background and uncertain timestamps. Do not turn an announcement into a tested production claim.
4. Display the briefing in chat first. Do not save report text, candidate news, or a local archive automatically. Only archive the exact report/items the user chooses after review. Initialization may save preferences and test directory access; it must not save news.
5. Use each person's chosen archive directory. Never hardcode the original user's drive, username, account, model, agent tool name or credentials. Preserve preferences and library contents on upgrade.
6. Store canonical topic cards, tags, sources, dates and the user's notes. Dates are filters, not the only retrieval route. See the archive reference for the shared format.
7. If web access, local writes or scheduling is unavailable, state the specific unavailable function and keep useful supported functions. Never fabricate tool success, current news or completed archives.

For a future code iteration, first state the proposed change and its effect on data/configuration; implement after the user confirms the plan. Do not alter unrelated agent configuration.
