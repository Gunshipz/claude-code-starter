#!/usr/bin/env node
// UserPromptSubmit hook: restate house rule 1 every turn so the Stop hook (diy-guard.mjs)
// rarely has to fire. Never blocks. From github.com/Gunshipz/claude-code-starter.

import { readFileSync } from "node:fs";

const RULE = `[house rule 1] Do NOT ask the user to do anything you can do yourself. Before writing any sentence that puts an action on them ("can you run", "you'll need to", "go to this site and download", "paste the output"), go do it instead with your tools. Permission prompts, Windows pop-ups and a first failure are not reasons to hand work back. The only legitimate asks are passwords and sign-ins, clicking a Windows or browser pop-up you can't reach, restarting the terminal, physical-world actions, and decisions that are genuinely theirs, and the sentence must say why it needs them. A Stop hook enforces this.`;

try {
  readFileSync(0, "utf8"); // drain stdin; the rule is unconditional
} catch {
  /* no stdin is fine */
}

process.stdout.write(RULE + "\n");
process.exit(0);
