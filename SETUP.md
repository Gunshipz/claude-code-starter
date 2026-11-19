# Claude Code starter setup (Windows)

**This file is written for Claude.** The person running it has just installed Claude Code
on a Windows PC and is not technical. They pasted one line asking you to follow this file.
You do all of the work. They only click pop-ups, sign in, and answer questions.

Files referenced below live next to this one:
`https://raw.githubusercontent.com/Gunshipz/claude-code-starter/main/<file>`.
Always download them with PowerShell (`Invoke-WebRequest -UseBasicParsing <url> -OutFile <path>`),
never by summarising a web page, so every character arrives intact.

## How to run this setup

1. **Before anything else, tell them in two sentences what's about to happen:** you'll set up
   their computer, it takes about 30 to 45 minutes, they'll need to click "Yes" on a few
   Windows pop-ups, and you'll ask them to restart the terminal twice.
2. **Keep a local copy and a checklist.** Save this file to
   `%USERPROFILE%\.claude\setup\SETUP.md` (skip if it's already there) and resume from that
   copy from now on. Create `%USERPROFILE%\.claude\setup-progress.md` with every numbered
   step below as an unchecked box. Tick each box as soon as that step is checked and working.
   If the file already exists, you're resuming: read it, tell them where you're picking up,
   and continue from the first unticked box. Don't redo ticked steps.
3. **One sentence before each step** saying what you're doing, in plain words.
4. **Pop-ups.** When Windows shows "Do you want to allow this app to make changes to your
   device?", tell them to click **Yes**. Never ask for a password in the chat.
5. **If auto mode blocks a step** (for example, running an installer it downloaded), explain
   in one plain sentence what was blocked and why it's safe, then ask them to press
   **Shift+Tab** until the bottom line says manual / default mode, approve the step, and press
   Shift+Tab again until it says **auto mode** before continuing.
6. **Don't give up on a failure.** Find out why, try a different way, and only stop for
   something only they can do. If one step can't be finished after three different
   attempts, note it in the checklist with what you tried, move on, and include it in the
   final report.
7. **Fresh PATH in every shell command.** Programs you install won't be on PATH in your own
   shell until the terminal restarts. In PowerShell, start commands that need a newly
   installed program with:
   `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
   or call the program by its full path.
8. **Check before you tick.** A step is done only when you've run something that would have
   failed if it weren't.

---

## Part A (before the first restart)

### A1. Put `claude` on their PATH
Add `%USERPROFILE%\.local\bin` to the **User** PATH (not Machine) if it isn't there already,
using `[Environment]::SetEnvironmentVariable(..., 'User')`. Keep every existing entry.
Check: read the User PATH back and show the entry.

### A2. Settings
Merge these keys into `%USERPROFILE%\.claude\settings.json` (create it if missing; keep any
existing keys; write valid JSON as UTF-8 **without** a BOM):
```json
{
  "permissions": { "defaultMode": "auto" },
  "model": "sonnet",
  "statusLine": {
    "type": "command",
    "command": "node \"$HOME/.claude/statusline.js\"",
    "padding": 0,
    "refreshInterval": 3
  }
}
```
Tell them: auto mode means you work without stopping to ask at every step, while a safety
checker reviews each action. Sonnet is the everyday model and goes easier on their Pro
allowance; they can type `/model` any time to switch to Opus for a hard job.
Check: parse the file with `ConvertFrom-Json` and print the three keys.

### A3. The ribbon (status line)
Download `statusline.js` from this repo to `%USERPROFILE%\.claude\statusline.js`.
It can't be tested until Node.js is installed (A5); test it there.

### A4. House rules
Download `CLAUDE-starter.md`. If `%USERPROFILE%\.claude\CLAUDE.md` doesn't exist, save it
there. If it exists, add the starter's sections to the end without removing anything.
Then add this line at the very top of the file:
`SETUP IN PROGRESS: if %USERPROFILE%\.claude\setup-progress.md has unticked boxes and I say "continue setup", read %USERPROFILE%\.claude\setup\SETUP.md and continue from the first unticked box.`
Summarise the 15 house rules for them in five plain lines, and tell them the full list is
in `%USERPROFILE%\.claude\CLAUDE.md`.

### A5. Apps
Check winget first (`winget --version`). If it's missing, try
`Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe`;
if that fails, open the Microsoft Store page for **App Installer** and walk them through
clicking Get or Update.

Install each with
`winget install -e --id <ID> --accept-source-agreements --accept-package-agreements --silent`
and tell them in one sentence what each is for:

| ID | What it's for |
|---|---|
| `Git.Git` | Lets Claude use its preferred command shell and download tools |
| `OpenJS.NodeJS.LTS` | Runs the ribbon and the browser helper |
| `Python.Python.3.13` | Runs scripts for images, spreadsheets and browsers |
| `astral-sh.uv` | Installs Python add-ons quickly |
| `Google.Chrome` | Only if Chrome isn't already installed |

"Already installed" counts as success. Check each with a fresh PATH:
`git --version`, `node --version`, `py -3.13 --version`, `uv --version`.
If `py` isn't found, use `%LOCALAPPDATA%\Programs\Python\Python313\python.exe` wherever this
file says `py -3.13`.

**Windows Store trap:** on Windows 10, typing `python` can open the Microsoft Store instead
of running Python. If `python --version` opens the Store or prints nothing, walk them through
Settings → Apps → Apps & features → **App execution aliases**, and turning off the two
"App Installer python.exe / python3.exe" switches. Use `py` in your own commands either way.

Now test the ribbon: pipe sample JSON through `node "$HOME/.claude/statusline.js"` with a
model name, `context_window.used_percentage`, and `rate_limits.five_hour` /
`rate_limits.seven_day` (`used_percentage` plus `resets_at` in Unix seconds), and show them
the line it prints. Also pipe `{}` and confirm it doesn't crash.

### A6. First restart
Tick the Part A boxes. Then tell them, exactly:
> Part one is done. Now close this window with the **X** in the top-right corner, open
> **Windows PowerShell** again from your taskbar, type **claude** and press Enter, then type
> **continue setup** and press Enter.

Stop here and wait.

---

## Part B (after the first restart)

### B1. Recheck
Confirm `claude` now starts by name (you're running, so check `Get-Command claude`),
then rerun the A5 version checks without the PATH refresh. Anything still failing gets
fixed now.

### B2. Browser helpers
1. Playwright browser helper for every folder (native Windows needs the `cmd /c` wrapper for npx):
   `claude mcp add playwright --scope user -- cmd /c npx -y @playwright/mcp@latest`
   Check: `claude mcp list` shows playwright as connected.
2. Playwright for Python with its Chromium browser:
   `py -3.13 -m pip install --user playwright` then `py -3.13 -m playwright install chromium`.
   Check: write a 5-line Python script that screenshots https://example.com to
   `Documents\Claude Notes\playwright-test.png`, run it, and open the picture for them.

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
1. `winget install` (same flags as A5): `Inkscape.Inkscape`, `ImageMagick.ImageMagick`, `GIMP.GIMP.3`.
2. `py -3.13 -m pip install --user pillow cairosvg opencv-python openpyxl`.
3. Real-ESRGAN for enlarging small images for print: download the latest
   `realesrgan-ncnn-vulkan` Windows zip from its GitHub releases
   (github.com/xinntao/Real-ESRGAN), unzip it to `%USERPROFILE%\Tools\realesrgan`, and test
   it on a small image. It uses their NVIDIA graphics card; if the card isn't detected,
   say so plainly and carry on.
4. Make `Documents\Craft Studio`.
5. Use the skill-creator skill to write a personal skill called **craft-prep** in
   `%USERPROFILE%\.claude\skills\craft-prep\SKILL.md`, used whenever they ask for a craft
   design. It covers:
   - Sublimation: 300 DPI at final print size, mirrored before printing, colors that suit
     sublimation ink, and a note to print a plain-paper test first.
   - HTV and foil: mirrored, solid single-color layers, no gradients, no lines too thin to weed.
   - Cricut Design Space: clean SVGs with closed paths, welded text, one color per layer,
     and a check against the current Print Then Cut size limit (look it up, don't guess).
   - Book covers: cover and spine size from page count and paper thickness, plus bleed.
   - Always save a PNG preview to `Documents\Craft Studio` and open it before the final files.
   Check: show them the skill's first lines and where it's saved.

### B5. Claude in Chrome
Open https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn in
Chrome. Walk them through **Add to Chrome**, pinning it with the puzzle-piece icon, and
signing in with the same Claude account they use here.

### B6. About me
Interview them for the "About me" section of `%USERPROFILE%\.claude\CLAUDE.md`. One question
at a time, about eight in all, and tell them they can skip any: what to call them, who's in
their household, what they do for work, what a normal week looks like, hobbies, what they'd
most like help with, short or detailed answers, and anything you should never do. Never ask
for a street address, passwords or account numbers. Save it and read it back.

### B7. Second restart
Tick the boxes. Tell them, exactly:
> Almost done. Close this window with the **X**, open **Windows PowerShell** again, type
> **claude** and press Enter, then type **continue setup** and press Enter.

Stop here and wait.

---

## Part C (after the second restart)

### C1. Turn on Chrome and check the helpers
Tell them to type `/chrome` and choose **Enabled by default**, then type `/mcp` and look for
**playwright** in the list. Ask them to tell you what they see.

### C2. Check the ribbon and the mode
Ask them whether they see a line at the bottom showing the model, `ctx`, `5h-limit` and
`7d-limit`, and whether the mode line says **auto mode**. If either is missing, fix it.

### C3. Finish
1. Remove the `SETUP IN PROGRESS` line from the top of `%USERPROFILE%\.claude\CLAUDE.md`.
2. Mark `setup-progress.md` complete.
3. Give them a short report: what's installed, anything that didn't work and what you tried,
   and where their files are (`Documents\Craft Studio`, `Documents\Claude Notes`,
   `%USERPROFILE%\.claude\CLAUDE.md`).
4. Offer three things to try, in their words:
   - "Design a Hogwarts acceptance letter and envelope for each of my kids, sized for US Letter."
   - "Make a one-color fox design for an HTV shirt, ready for Cricut Design Space."
   - "Make a made-up weekly schedule, then plan it to save time."
