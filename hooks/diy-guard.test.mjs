// Positive/negative control harness for diy-guard.mjs
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOOK = join(fileURLToPath(new URL(".", import.meta.url)), "diy-guard.mjs");
const dir = mkdtempSync(join(tmpdir(), "diy-"));

const SHOULD_BLOCK = [
  "Can you run `npm test` and paste the output?",
  "You'll need to install ffmpeg before this works.",
  "Please check whether that file exists on disk.",
  "Let me know what the error says.",
  "Go ahead and run the migration script.",
  "Run this: node build.js",
  "I need you to open the config and edit line 12.",
  "Type `! gcloud projects list` in the prompt.",
  "If you could paste the output here, I'll take it from there.",
  "The rest has to happen on your end.",
  "Would you mind running the test suite?",
  "Send me the log so I can see the failure.",
  // how-to hand-offs with no question mark
  "## How to run it",
  "It's one command, run from `C:\\Users\\me\\projects\\studio`:",
  "Drop `--mutations` for a faster run of about 5 minutes.",
  "`uv run python scripts/regress.py --mutations`",
  "To run it yourself: `npm test`.",
  "You'll need to install Inkscape from inkscape.org first.",
  "Can you check whether Python is installed?",
  "Please open the Craft Studio folder and rename the file.",
  "Go to obsidian.md and download the installer.",
];

const SHOULD_PASS = [
  "I ran the test suite and 14 of 14 passed.",
  "Let me run the migration and report back.",
  "I'll check whether that file exists.",
  "You'll need to enter your 2FA code — I can't generate it.",
  "Can you approve the deploy? Only you can sign off on a production push.",
  "Please confirm which of these two vendors you want before I order.",
  "This one is blocked by Cloudflare, so it needs a manual browser session.",
  "Open /hooks once so the settings watcher reloads — that's a UI menu I can't open.",
  "Do you want option A or option B?",
  "Want me to go ahead and wire up the rest?",
  "The bracket needs to be physically unplugged before I can re-flash it.",
  "I created the file at C:\\Users\\me\\notes.md and verified the contents.",
  "Here is the summary of what changed across the three files.",
  "I'm going to run the pipeline now; it takes about 8 minutes.",
  "I ran `uv run python scripts/regress.py --mutations` and it passed.",
  "The command I ran was `pytest -q`, which reported 190 passed.",
  "## How it works",
  "When Windows asks to allow this app to make changes, click **Yes**.",
  "Now close this window with the X, reopen Command Prompt, type claude and then continue setup.",
  "Click Add to Chrome, then pin it with the puzzle-piece icon.",
  "Type /chrome and choose Enabled by default.",
  "Log in with your Claude account and click Authorize.",
  "I saved it to your vault at Documents\\Second Brain\\Crafts\\fox-shirt.md and opened it.",
  "- **Hook:** `diy-guard.mjs` now blocks messages that tell you how to do something yourself: a how-to heading, a pitch that it's just one command, a bare command on its own line, or advice to add or remove an option.",
];

function run(text) {
  const tp = join(dir, "t.jsonl");
  writeFileSync(
    tp,
    JSON.stringify({
      type: "assistant",
      isSidechain: false,
      message: { role: "assistant", content: [{ type: "text", text }] },
    }) + "\n"
  );
  const out = execFileSync("node", [HOOK], {
    input: JSON.stringify({
      session_id: "test-" + Math.random(),
      transcript_path: tp,
      stop_hook_active: false,
    }),
    encoding: "utf8",
  });
  return out.trim().length > 0 && out.includes('"decision":"block"');
}

let fails = 0;
console.log("=== POSITIVE CONTROLS (must block) ===");
for (const t of SHOULD_BLOCK) {
  const blocked = run(t);
  if (!blocked) fails++;
  console.log(`${blocked ? "  ok  " : "  MISS"} | ${t}`);
}
console.log("\n=== NEGATIVE CONTROLS (must pass) ===");
for (const t of SHOULD_PASS) {
  const blocked = run(t);
  if (blocked) fails++;
  console.log(`${blocked ? "  FALSE+" : "  ok   "} | ${t}`);
}
console.log(`\n${fails === 0 ? "ALL PASS" : fails + " FAILURES"}`);
process.exit(fails === 0 ? 0 : 1);
