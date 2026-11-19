# claude-code-starter

A starter kit for Claude Code on Windows, built so Claude does the setup itself.

After installing Claude Code from Command Prompt and signing in, paste this into Claude. After each restart, type `continue setup`; the setup guard keeps it going.

```
/goal Download https://raw.githubusercontent.com/Gunshipz/claude-code-starter/main/SETUP.md with curl.exe, read all of it, and follow it to set up my computer, doing every step yourself. Done when every Part A box in the setup checklist is ticked and you've told me to restart.
```

| File | What it is |
|---|---|
| `SETUP.md` | Step-by-step instructions written for Claude: apps, an Obsidian second brain, browser helpers, skills, craft tools, house rules, with restart checkpoints and a resumable checklist |
| `CLAUDE-starter.md` | Starter house rules for `~/.claude/CLAUDE.md`, including "save to my second brain by default" |
| `statusline.js` | The ribbon: model, folder, context use, 5-hour and weekly limits with reset countdowns |
| `subagent-statusline.js` | Feeds the ribbon's running-agents counter |
| `hooks/diy-guard.mjs` | Stop hook that blocks Claude from handing the user work it could do itself. `node hooks/diy-guard.test.mjs` runs 45 cases |
| `hooks/diy-reminder.mjs` | Restates that rule on every prompt so the block rarely fires |
| `hooks/setup-guard.ps1` | Stop hook used only during setup: keeps Claude working while the setup checklist has unticked boxes, lets it stop for questions and restarts, gives up after 3 stops with no progress. `powershell -File hooks/setup-guard.test.ps1` runs 10 cases |

MIT licensed.
