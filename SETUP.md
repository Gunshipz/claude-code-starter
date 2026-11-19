# Claude Code starter setup (Windows)

**This file is written for Claude.** The person running it has just installed Claude Code
on a Windows PC from **Command Prompt** and is not technical. They pasted one line asking you
to follow this file. You do all of the work. They only click pop-ups, sign in, restart the
terminal, and answer questions.

Files referenced below live next to this one:
`https://raw.githubusercontent.com/Gunshipz/claude-code-starter/main/<file>`.
Download them byte for byte (`curl.exe -fsSL <url> -o <path>`, or PowerShell
`Invoke-WebRequest -UseBasicParsing <url> -OutFile <path>`), never by summarising a web page.

## How to run this setup

1. **Before anything else, tell them in two sentences what's about to happen:** you'll set up
   their computer, it takes about 30 to 45 minutes, they'll need to click "Yes" on a few
   Windows pop-ups, and you'll ask them to restart the terminal twice.
2. **Keep a local copy and a checklist.** Save this file to
   `%USERPROFILE%\.claude\setup\SETUP.md` (skip if it's already there) and resume from that
   copy from now on. Create `%USERPROFILE%\.claude\setup-progress.md` with every numbered
   step below as an unchecked box, and tick each box as soon as that step is checked and
   working. If the checklist already exists, you're resuming: read it, tell them where
   you're picking up, and continue from the first unticked box. Don't redo ticked steps.
3. **One sentence before each step** saying what you're doing, in plain words.
4. **Never ask them to do anything you can do yourself.** That includes opening websites,
   downloading, installing, creating folders and changing settings. The only things that
   are theirs: Windows "allow this app to make changes?" pop-ups (tell them to click
   **Yes**), signing in, restarting the terminal, and clicking inside Chrome's extension
   page. Never ask for a password in the chat. Every website you mention gets a full
   clickable `https://` link.
5. **If auto mode blocks a step** (for example, running an installer it downloaded), explain
   in one plain sentence what was blocked and why it's safe, then ask them to press
   **Shift+Tab** until the line under the input box shows the manual / default mode, approve
   the step, and press **Shift+Tab** again until it says **auto mode** before continuing.
6. **Waiting on them.** If an install sits waiting for more than a minute, its Windows pop-up
   may be hidden: tell them to click the flashing shield icon on the taskbar, then **Yes**.
   If you hit the Pro usage limit, tell them when it resets and that they can type
   **continue setup** after that; the checklist keeps your place.
7. **Don't give up on a failure.** Find out why, try a different way, and only stop for
   something only they can do. If one step can't be finished after three different
   attempts, note it in the checklist with what you tried, move on, and include it in the
   final report.
8. **Fresh PATH in every shell command.** Programs you install won't be on PATH in your own
   shell until the terminal restarts. In PowerShell, start commands that need a newly
   installed program with:
   `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
   or call the program by its full path.
9. **Check before you tick.** A step is done only when you've run something that would have
   failed if it weren't.
10. **Which shell.** The PowerShell snippets in this file (`$env:Path`, `[Environment]`,
   `ConvertFrom-Json`) must run in PowerShell: use your PowerShell tool, or wrap them in
   `powershell.exe -NoProfile -Command "..."` from Bash. Run `claude mcp add` (B2) from
   PowerShell too, because Git Bash rewrites `/c` into a drive path.
11. **Paths in settings.json** are absolute with forward slashes, for example
   `C:/Users/Name/.claude/statusline.js`. Don't rely on `$HOME` or `%USERPROFILE%` there.

---

## Part A (before the first restart)

### A1. Put `claude` on their PATH
Add `%USERPROFILE%\.local\bin` to the **User** PATH (not Machine) if it isn't there already,
using `[Environment]::SetEnvironmentVariable('Path', ..., 'User')`. Keep every existing entry.
Check: read the User PATH back and show the entry.

### A2. Settings
Merge these keys into `%USERPROFILE%\.claude\settings.json` (create it if missing; keep any
existing keys; write valid JSON as UTF-8 **without** a BOM):
```json
{
  "permissions": { "defaultMode": "auto" },
  "model": "sonnet"
}
```
Tell them: auto mode means you work without stopping to ask at every step, while a safety
checker reviews each action. Sonnet is the everyday model and goes easier on their Pro
allowance; they can type `/model` any time to switch to Opus for a hard job.
Check: parse the file with `ConvertFrom-Json` and print both keys.

### A3. Apps
Check winget first (`winget --version`). If it's missing, try
`Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe`;
if that fails, open the Microsoft Store page for **App Installer**
(`ms-windows-store://pdp/?productid=9NBLGGH4NNS1`) and tell them to click Get or Update.

Install each with
`winget install -e --id <ID> --accept-source-agreements --accept-package-agreements --silent`
and tell them in one sentence what each is for:

| ID | What it's for |
|---|---|
| `Git.Git` | Lets Claude use its preferred command shell and download tools |
| `OpenJS.NodeJS.LTS` | Runs the ribbon, the house-rule guard and the browser helper |
| `Python.Python.3.13` | Runs scripts for images, spreadsheets and browsers |
| `astral-sh.uv` | Installs Python add-ons quickly |
| `Obsidian.Obsidian` | Their second brain: a notes app that keeps plain files on their own PC |
| `Google.Chrome` | Only if Chrome isn't already installed |

"Already installed" counts as success. Check each with a fresh PATH:
`git --version`, `node --version`, `py -3.13 --version`, `uv --version`, and that
`%LOCALAPPDATA%\Programs\Obsidian\Obsidian.exe` (or wherever winget put it) exists.
If `py` isn't found, use `%LOCALAPPDATA%\Programs\Python\Python313\python.exe` wherever this
file says `py -3.13`.

**Windows Store trap:** on Windows 10, typing `python` can open the Microsoft Store instead
of running Python. If `python --version` opens the Store or prints nothing, open
Settings → Apps → **App execution aliases** for them (`ms-settings:appsfeatures-app`) and
tell them to turn off the two "App Installer python.exe / python3.exe" switches.

### A4. The ribbon and the house-rule hook
Download into `%USERPROFILE%\.claude\`:
- `statusline.js` → `.claude\statusline.js`
- `hooks/diy-guard.mjs` → `.claude\hooks\diy-guard.mjs`
- `hooks/diy-reminder.mjs` → `.claude\hooks\diy-reminder.mjs`
- `hooks/diy-guard.test.mjs` → `.claude\hooks\diy-guard.test.mjs`

Don't switch them on yet: your own process can't see Node.js until the terminal restarts,
so the settings go in at B1. Run the checks below now, calling node by its full path
(`C:\Program Files\nodejs\node.exe`, or wherever `Get-Command node` finds it after a fresh PATH).

The settings B1 will merge into settings.json, with `<HOME>` replaced by their real home
folder in forward slashes:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"<HOME>/.claude/statusline.js\"",
    "padding": 0,
    "refreshInterval": 3
  },
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node \"<HOME>/.claude/hooks/diy-guard.mjs\"", "timeout": 10 } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "node \"<HOME>/.claude/hooks/diy-reminder.mjs\"", "timeout": 5 } ] }
    ]
  }
}
```
Tell them: the ribbon is the status line along the bottom, and the hook is a small guard
that stops you from handing them work you could do yourself.

Checks:
- Pipe sample JSON through `statusline.js` with a model name,
  `context_window.used_percentage`, and `rate_limits.five_hour` / `rate_limits.seven_day`
  (`used_percentage` plus `resets_at` in Unix seconds), and show them the line it prints.
  Also pipe `{}` and confirm it doesn't crash.
- Run `diy-guard.test.mjs` and confirm it ends with `ALL PASS`.

### A5. Second brain (Obsidian vault)
1. Create the vault folder `<Documents>\Second Brain`, where `<Documents>` is
   `[Environment]::GetFolderPath('MyDocuments')` (it may be inside OneDrive), with these folders:
   `Family`, `Home`, `Work`, `Crafts`, `Recipes`, `Trips`, `Health`, `People`, `Claude`.
2. Create these notes:
   - `Start Here.md`: a short plain-English explanation that this is their second brain,
     that every note is a plain file on their own PC, that Claude saves things here by
     default and reads it before asking about their life, and the phrases that work:
     "save this to my vault", "put this in my Crafts folder", "what do my notes say
     about…", "add this to my Inbox", "make a note called…", "search my vault for…".
   - `About Me.md`: a heading and "(Claude fills this in during setup.)"
   - `Inbox.md`: a heading and one line saying quick, unsorted notes go here.
   - `Claude/Changes.md`: a heading, then a log of every change you've made to their
     computer so far in this setup and how to undo each one. Keep it updated from now on.
3. Register the vault with Obsidian so it opens straight into it. Make sure Obsidian is not
   running, then write `%APPDATA%\obsidian\obsidian.json` (merge if it exists) as
   `{"vaults": {"<16 random hex chars>": {"path": "<vault path>", "ts": <now in ms>, "open": true}}}`.
4. Launch Obsidian. Tell them: if it shows a welcome screen instead of the vault, click
   **Open folder as vault** and pick `Documents\Second Brain`. If it asks about trusting the
   vault, click **Trust**. Ask them whether they can see `Start Here` in the left sidebar.
5. Check: list the vault folder and print `obsidian.json`.

### A6. House rules
Download `CLAUDE-starter.md`. Replace `SECOND_BRAIN_PATH` with the vault path from A5
(`<Documents>\Second Brain`). If
`%USERPROFILE%\.claude\CLAUDE.md` doesn't exist, save it there. If it exists, add the starter's
sections to the end without removing anything. Then add this line at the very top:

`SETUP IN PROGRESS: if %USERPROFILE%\.claude\setup-progress.md has unticked boxes and I say "continue setup", read %USERPROFILE%\.claude\setup\SETUP.md and continue from the first unticked box.`

Summarise the house rules for them in five plain lines, and tell them the full list is in
`%USERPROFILE%\.claude\CLAUDE.md`.

### A7. First restart
Tick the Part A boxes. Then tell them, exactly:
> Part one is done. Now close this window with the **X** in the top-right corner, open
> **Command Prompt** again from your taskbar, type **claude** and press Enter, then type
> **continue setup** and press Enter.

Stop here and wait.

---

## Part B (after the first restart)

### B1. Recheck, then switch on the ribbon and the hook
Confirm `claude` now starts by name (`where.exe claude`), then rerun the A3 version checks
without the PATH refresh. Anything still failing gets fixed now.
Then merge the `statusLine` and `hooks` settings from A4 into settings.json, parse it with
`ConvertFrom-Json` to prove it's valid, and tell them the ribbon and the guard switch on at
the next restart.

### B2. Browser helpers
1. Playwright browser helper for every folder (native Windows needs the `cmd /c` wrapper for npx):
   `claude mcp add playwright --scope user -- cmd /c npx -y @playwright/mcp@latest`
   Check: `claude mcp list` shows playwright as connected.
2. Playwright for Python with its Chromium browser:
   `py -3.13 -m pip install --user playwright` then `py -3.13 -m playwright install chromium`.
   Check: write a 5-line Python script that screenshots https://example.com into the vault's
   `Claude` folder, run it, and open the picture for them.

### B3. Skills
```
claude plugin install superpowers@claude-plugins-official
claude plugin marketplace add anthropics/skills
claude plugin install document-skills@anthropic-agent-skills
claude plugin install example-skills@anthropic-agent-skills
```
Check: `claude plugin list` shows all three plugins enabled. Then tell them in plain words,
one line each, what these are good for: superpowers, canvas-design, algorithmic-art,
theme-factory, frontend-design, pdf, xlsx, docx, pptx, skill-creator.

### B4. Craft studio
This person makes crafts.
1. `winget install` (same flags as A3): `Inkscape.Inkscape`, `ImageMagick.ImageMagick`, `GIMP.GIMP.3`.
2. `py -3.13 -m pip install --user pillow opencv-python openpyxl`. For SVG to PNG, use
   Inkscape's command line (`inkscape file.svg --export-type=png`), not cairosvg, which needs
   libraries Windows doesn't have.
3. Real-ESRGAN for enlarging small images for print: download the latest
   `realesrgan-ncnn-vulkan` Windows zip from https://github.com/xinntao/Real-ESRGAN/releases,
   unzip it to `%USERPROFILE%\Tools\realesrgan`, and test it on a small image. It uses their
   NVIDIA graphics card; if the card isn't detected, say so plainly and carry on.
4. Make `<Documents>\Craft Studio` for design files.
5. Write a personal skill called **craft-prep** (plugins from B3 load only after a restart, so
   write it directly: a `SKILL.md` with `name` and `description` frontmatter, then the steps) in
   `%USERPROFILE%\.claude\skills\craft-prep\SKILL.md`, used whenever they ask for a craft
   design. It covers:
   - Sublimation: 300 DPI at final print size, mirrored before printing, colors that suit
     sublimation ink, and a note to print a plain-paper test first.
   - HTV and foil: mirrored, solid single-color layers, no gradients, no lines too thin to weed.
   - Cricut Design Space: clean SVGs with closed paths, welded text, one color per layer,
     and a check against the current Print Then Cut size limit (look it up, don't guess).
   - Book covers: cover and spine size from page count and paper thickness, plus bleed.
   - Always save a PNG preview to `Craft Studio` and open it before the final files.
   - Save the settings that worked for each project as a note in the vault's `Crafts` folder.
   Check: show them the skill's first lines and where it's saved.

### B5. Claude in Chrome
Open https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn in
Chrome for them. Tell them to click **Add to Chrome**, pin it with the puzzle-piece icon, and
sign in with the same Claude account they use here.

### B6. About Me
Interview them for `About Me.md` in the vault, replacing the placeholder line you wrote in A5. One question at a time, about eight in all,
and tell them they can skip any: what to call them, who's in their household, what they do
for work, what a normal week looks like, hobbies, what they'd most like help with, short or
detailed answers, and anything you should never do. Never ask for a street address,
passwords or account numbers. Save it, open it in Obsidian (`obsidian://open?path=<url-encoded
note path>`), and tell them they can edit it any time.

### B7. Second restart
Tick the boxes. Tell them, exactly:
> Almost done. Close this window with the **X**, open **Command Prompt** again, type
> **claude** and press Enter, then type **continue setup** and press Enter.

Stop here and wait.

---

## Part C (after the second restart)

### C1. Turn on Chrome and check the helpers
Tell them to type `/chrome` and choose **Enabled by default**, then type `/mcp` and look for
**playwright** in the list. Ask them what they see.

### C2. Check the ribbon and the mode
Ask them whether they see a line at the bottom showing the model, `ctx`, `5h-limit` and
`7d-limit`, and whether the line under the input box says **auto mode**. The limit bars can
stay blank until after your first reply in a session; that's normal. If the ribbon or auto
mode is missing, fix it.

### C3. Test the second brain
Add a line to `Inbox.md` in the vault saying setup finished today, then
search the vault for "About Me" and quote one line from it back to them. This proves you can
write and read the vault.

### C4. Finish
1. Remove the `SETUP IN PROGRESS` line from the top of `%USERPROFILE%\.claude\CLAUDE.md`.
2. Mark `setup-progress.md` complete.
3. Save a short setup report to the vault as `Claude/Setup Report.md`: what's installed,
   anything that didn't work and what you tried, and where things live. Open it in Obsidian.
4. Tell them, in plain words, the difference between the three places you remember things:
   their **second brain** (the Obsidian vault: their life and projects, theirs to read and
   edit), the **house rules** (`CLAUDE.md`: how you should work), and your own **memory
   notebook** (notes you keep for yourself about working with them).
5. Offer three things to try, in their words:
   - "Design a Hogwarts acceptance letter and envelope for each of my kids, sized for US Letter."
   - "Make a one-color fox design for an HTV shirt, ready for Cricut Design Space."
   - "Make a made-up weekly schedule, then plan it to save time."
