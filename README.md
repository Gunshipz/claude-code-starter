# claude-code-starter

A starter kit for Claude Code on Windows, built so Claude does the setup itself.

After installing Claude Code from Command Prompt and signing in, paste this into Claude:

```
Download https://raw.githubusercontent.com/Gunshipz/claude-code-starter/main/SETUP.md and read all of it, then follow it to set up my computer. Do every step yourself.
```

| File | What it is |
|---|---|
| `SETUP.md` | Step-by-step instructions written for Claude: apps, an Obsidian second brain, browser helpers, skills, craft tools, house rules, with restart checkpoints and a resumable checklist |
| `CLAUDE-starter.md` | Starter house rules for `~/.claude/CLAUDE.md`, including "save to my second brain by default" |
| `statusline.js` | The ribbon: model, folder, context use, 5-hour and weekly limits with reset countdowns |
| `hooks/diy-guard.mjs` | Stop hook that blocks Claude from handing the user work it could do itself. `node hooks/diy-guard.test.mjs` runs 45 cases |
| `hooks/diy-reminder.mjs` | Restates that rule on every prompt so the block rarely fires |

MIT licensed.
