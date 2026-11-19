#!/usr/bin/env node
// Stop hook: enforces house rule 1 in ~/.claude/CLAUDE.md (never ask the user to do what Claude can do).
// From github.com/Gunshipz/claude-code-starter. Test: node diy-guard.test.mjs
//
// Reads the final assistant message from the transcript. If it hands the user an action
// that Claude could have performed with a tool call, and the sentence names no real
// blocker (credentials, physical world, a decision, harness UI), the turn is blocked
// and the offending sentence is handed back.
//
// Loop safety: never blocks when stop_hook_active is set, and caps blocks per session.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const MAX_BLOCKS_PER_SESSION = 5;
const STATE_PATH = join(homedir(), ".claude", "state", "diy-guard.json");

// ---------------------------------------------------------------- detection

// A sentence that pushes an action onto the user.
const ASK_PATTERNS = [
  /\b(can|could|would)\s+you\s+(please\s+)?(run|execute|check|open|go\b|paste|copy|send|try|install|download|navigate|click|grab|pull|fetch|look|find|search|create|add|edit|update|delete|remove|move|rename|start|stop|restart|kill|verify|test)\b/,
  /\bplease\s+(run|execute|paste|copy|open|navigate|click|install|download|grab|pull|fetch|create|add|edit|update|delete|remove|move|rename|start|stop|restart|kill|check|verify|test|try)\b/,
  /\byou(\s+will|'ll|'d)?\s+(need|have)\s+to\s+(run|execute|open|install|download|navigate|click|create|add|edit|update|delete|remove|move|rename|paste|copy|check|grab|fetch)\b/,
  /\byou\s+(should|can|could|may\s+want\s+to|might\s+want\s+to)\s+(run|execute|paste|install|download|kick\s+off)\b/,
  /\b(go\s+ahead\s+and|feel\s+free\s+to)\s+(run|execute|paste|open|install|kick\s+off)\b/,
  /\blet\s+me\s+know\s+((what|how|whether)\s+(?!you\b)|the\s+(output|result|error|response)\b)/,
  /\b(paste|drop)\s+(the\s+|it\s+|that\s+|them\s+)?(output|result|error|log|response|back|here)\b/,
  /\b(send|share|give)\s+me\s+the\s+(output|result|log|error|response|contents?)\b/,
  // imperative only: "Run this ...", "Then run these ..." — not "you already run that pattern"
  /(^|[.;:]\s*|\b(then|now|first|next|also|finally|so|just)\s+)run\s+(this|that|these|it|the\s+following)\b/,
  /\b(type|enter|paste)\s+`?!\s*[a-z]/,
  /(^|[.;:]\s*|\b(then|now|so|just|please)\s+)(run|type|open|paste|click|check|try)\b[^.]{0,30}\bin\s+your\s+(terminal|shell|browser|console)\b/,
  /\bif\s+you\s+(can|could)\s+(run|check|paste|open|grab|send|share)\b/,
  /\bwould\s+you\s+mind\s+(running|checking|opening|pasting|sending)\b/,
  /\bi(\s+will|'ll|'d)?\s+need\s+you\s+to\s+(run|execute|open|install|check|paste|create|edit|update|delete)\b/,
  // hand-off framing only — not "the script runs on your machine"
  /\b(you'?ll|you\s+will|has\s+to|have\s+to|needs\s+to|rest\s+is|that'?s)\b[^.]{0,40}\bon\s+your\s+(end|machine|side)\b/,
  // 2026-09-29: the "how-to" hand-off. No "can you" in it, so every pattern above missed it:
  //   "## How to run it" / "It's one command, run from X:" / a bare `command` line /
  //   "Drop `--flag` for a faster run".
  /^#{1,6}\s*(how\s+to\s+(run|use|start|launch|test|install|reproduce|rerun|re-run)|to\s+run\s+it|running\s+it(\s+yourself)?)\b/,
  /\b(it'?s|it\s+is|that'?s)\s+(just\s+)?(one|a\s+single)\s+command(\s*:|\s*,\s*(run|from|in)\b)/,
  /\bto\s+run\s+(it|this|that|them)\s+yourself\b/,
  /(^|[.;:]\s*)(drop|add|pass|append|leave\s+off|omit)\s+`?--[a-z]/,
  // "Go to obsidian.md and download the installer" — sending the user off to fetch something
  /(^|[.;:]\s*|\b(then|now|first|next|just)\s+)(go\s+to|visit|head\s+(over\s+)?to)\s+\S+\s+(and\s+)?(download|install|get|grab)\b/,
  // a line that is nothing but a runnable command in backticks is a command handed over
  /^`[^`]*\b(uv|python|py|npm|npx|node|pytest|git|docker|bash|pwsh|powershell|pip|make|cargo|go)\s[^`]*`\s*[:.]?$/,
];

// Real blockers. A sentence naming one of these is a legitimate ask.
const EXEMPT_PATTERNS = [
  // credentials / interactive auth
  /\b(password|passphrase|credential|api[-\s]?key|secret|access\s+token|2fa|mfa|otp|one[-\s]time|authenticator|log\s?in|login|sign[-\s]?in|signin|oauth|sso|captcha|recaptcha|hcaptcha|verification\s+code|authenticate|auth\s+flow|consent\s+screen)\b/,
  // physical world
  /\b(physically|plug|unplug|power[-\s]cycle|hardware|cable|usb|press\s+the|button\s+on|camera|photograph|take\s+a\s+(photo|picture)|in\s+person|solder|breaker|thermostat|your\s+phone|the\s+(actual\s+)?screen|screen\s+sharing|boot|bios|keyboard\s+combo)\b/,
  // decisions that are the user's to make
  /\b(approve|approval|confirm|decide|decision|prefer|preference|which\s+(one|of|do|would)|do\s+you\s+want|would\s+you\s+like|want\s+me\s+to|pick|choose|sign\s+off|your\s+call|ok(ay)?\s+to|green\s+light|permission|thoughts\?|say\s+the\s+word|let\s+me\s+know\s+if\s+you)\b/,
  // harness UI only the user can touch
  /(\/hooks|\/chrome|\/config|\/clear|\/model|\/login|\/mcp|\/code-review|restart\s+claude|reopen\s+claude|slash\s+command)/,
  // Windows pop-ups, terminal restarts and browser-extension steps only the user can do
  /\b(pop[-\s]?up|allow\s+this\s+app|user\s+account\s+control|uac|click\s+\**yes|restart\s+the\s+terminal|close\s+this\s+window|reopen|open\s+(windows\s+)?(powershell|command\s+prompt)\s+again|type\s+\**claude|continue\s+setup|add\s+to\s+chrome|puzzle[-\s]piece|authorize)\b/,
  // known automation blockers
  /\b(cloudflare|manual\s+browser|bot\s+fight|bot[-\s]block\w*|blocked\s+by|403|429)\b/,
  // explicit, named incapacity
  /\b(only\s+you\s+can|requires\s+your|needs\s+your|i\s+(can'?t|cannot)\s+(do|run|access|reach|complete|fix|execute|see|touch|reproduce)\b|i\s+don'?t\s+have\s+(access|credentials|permission)|not\s+something\s+i\s+can|from\s+inside\s+this\s+session)\b/,
];

// "run this" etc. is fine when I am the one running it — but only when the self-marker
// comes BEFORE the ask ("Let me run this"), not after ("If you could paste it, I'll take it").
const SELF_ACTING = /\b(i'?ll|i\s+will|let\s+me(?!\s+know)|i'?m\s+going\s+to|i\s+just|i'?ve|i\s+ran|i\s+am|i\s+can\s+run)\b/;

// Fenced blocks and blockquotes are quoted material, not me talking to the user — drafted
// messages, emails, and Reddit replies live there. Inline backticks are kept: the
// `! cmd` hand-off pattern lives inside them.
function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .split("\n")
    .filter((l) => !/^\s*>/.test(l))
    .join("\n");
}

// Split on newlines and on sentence-final punctuation that is actually ending a sentence
// (next token starts a new one). A bare "!" inside a command must not split the line.
function sentences(text) {
  return stripCode(text)
    .split(/(?<=[.!?])\s+(?=["'*\-\d(]|[A-Z])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function findOffense(text) {
  for (const raw of sentences(text)) {
    const s = raw.toLowerCase();
    if (EXEMPT_PATTERNS.some((re) => re.test(s))) continue;

    let askAt = -1;
    for (const re of ASK_PATTERNS) {
      const m = s.match(re);
      if (m && (askAt === -1 || m.index < askAt)) askAt = m.index;
    }
    if (askAt === -1) continue;

    const self = s.match(SELF_ACTING);
    if (self && self.index < askAt) continue; // "Let me run this" — I'm the actor

    return raw.length > 300 ? raw.slice(0, 300) + "…" : raw;
  }
  return null;
}

// ---------------------------------------------------------------- transcript

function finalAssistantText(transcriptPath) {
  let lines;
  try {
    lines = readFileSync(transcriptPath, "utf8").split("\n");
  } catch {
    return "";
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.type !== "assistant" || entry.isSidechain === true) continue;
    const content = entry.message && entry.message.content;
    if (!Array.isArray(content)) continue;
    const text = content
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (text) return text;
    // an assistant entry of pure tool_use means the turn is still mid-flight
  }
  return "";
}

// -------------------------------------------------------------------- state

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  try {
    mkdirSync(dirname(STATE_PATH), { recursive: true });
    writeFileSync(STATE_PATH, JSON.stringify(state));
  } catch {
    /* state is best-effort */
  }
}

// --------------------------------------------------------------------- main

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    process.exit(0);
  }

  if (input.stop_hook_active) process.exit(0); // already continuing from a block

  const transcript = input.transcript_path;
  if (!transcript) process.exit(0);

  const text = finalAssistantText(transcript);
  if (!text) process.exit(0);

  const offense = findOffense(text);
  if (!offense) process.exit(0);

  const sessionId = String(input.session_id || "unknown");
  const state = readState();
  const count = (state[sessionId] || 0) + 1;
  if (count > MAX_BLOCKS_PER_SESSION) process.exit(0); // never hard-lock a session
  writeState({ [sessionId]: count, _updated: new Date().toISOString() });

  const reason = [
    "[diy-guard] The user's standing rule: never ask them to do something you can do yourself",
    "(house rule 1 in ~/.claude/CLAUDE.md). This sentence hands them an action:",
    "",
    `  "${offense}"`,
    "",
    "Do one of two things before ending the turn:",
    "1. Go do it — Bash, PowerShell, Read/Edit/Write, Playwright, MCP. Permission prompts,",
    "   UAC, and first failures are not reasons to hand it back. Then report the result.",
    "2. If it genuinely requires him — credentials/2FA/captcha, something physical, a decision",
    "   only they can make, or harness UI like /hooks — rewrite the sentence so it NAMES that",
    "   blocker in the sentence itself.",
    "",
    "Do not simply restate the request more politely.",
  ].join("\n");

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason,
      systemMessage: `diy-guard: blocked a hand-off to you — "${offense.slice(0, 90)}${offense.length > 90 ? "…" : ""}"`,
    })
  );
  process.exit(0);
}

// Run only when executed as a hook; importing the module (tests, scans) just gets findOffense.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
