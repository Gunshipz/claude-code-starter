const fs = require('fs');
const os = require('os');
const path = require('path');

process.stdin.resume();
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());

    const model = (data.model?.display_name || 'Claude').replace('Claude ', '');
    const ctxPct = data.context_window?.used_percentage ?? null;
    const rl5h = data.rate_limits?.five_hour;
    const rl7d = data.rate_limits?.seven_day;

    const cwd = data.workspace?.current_dir || data.cwd;
    const folder = cwd ? path.basename(cwd) : null;

    let agentCount = 0;
    try {
      const agentFile = path.join(os.tmpdir(), `claude-agent-count-${data.session_id}.json`);
      const stat = fs.statSync(agentFile);
      if (Date.now() - stat.mtimeMs < 15000) {
        agentCount = JSON.parse(fs.readFileSync(agentFile, 'utf8')).count || 0;
      }
    } catch {}

    // Count real user prompts in the transcript (not tool results, meta or sidechain lines).
    // Incremental: cache byte offset + count per session so a big transcript isn't re-read every 3 s.
    let promptCount = null;
    try {
      const tp = data.transcript_path;
      const cacheFile = path.join(os.tmpdir(), `claude-prompt-count-${data.session_id}.json`);
      let cache = { offset: 0, count: 0, rest: '' };
      try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch {}
      const size = fs.statSync(tp).size;
      if (size < cache.offset) cache = { offset: 0, count: 0, rest: '' };
      if (size > cache.offset) {
        const fd = fs.openSync(tp, 'r');
        const buf = Buffer.alloc(size - cache.offset);
        fs.readSync(fd, buf, 0, buf.length, cache.offset);
        fs.closeSync(fd);
        const lines = (cache.rest + buf.toString('utf8')).split('\n');
        cache.rest = lines.pop();
        for (const l of lines) {
          if (!l.includes('"type":"user"')) continue;
          let o; try { o = JSON.parse(l); } catch { continue; }
          if (o.type !== 'user' || o.isMeta || o.isSidechain) continue;
          const c = o.message?.content;
          if (typeof c === 'string' || (Array.isArray(c) && c.length && c.every(b => b.type === 'text'))) cache.count++;
        }
        cache.offset = size;
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
      }
      promptCount = cache.count;
    } catch {}

    const R = '\x1b[0m', G = '\x1b[32m', Y = '\x1b[33m', red = '\x1b[31m', dim = '\x1b[2m';

    function clr(pct) { return pct > 80 ? red : pct > 50 ? Y : G; }
    function bar(pct, len = 8) {
      const n = Math.min(len, Math.round((pct / 100) * len));
      return '[' + '█'.repeat(n) + '░'.repeat(len - n) + ']';
    }
    function timeUntil(ts) {
      if (!ts) return '';
      const mins = Math.round((ts * 1000 - Date.now()) / 60000);
      if (mins <= 0) return ' resetting';
      if (mins < 60) return ` ${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return ` ${hrs}h${String(mins % 60).padStart(2, '0')}m`;
      return ` ${Math.floor(hrs / 24)}d${hrs % 24}h`;
    }

    const cyan = '\x1b[36m', magenta = '\x1b[35m';

    const parts = [`${dim}${model}${R}`];

    if (folder)
      parts.push(`${cyan}📁 ${folder}${R}`);

    if (agentCount > 0)
      parts.push(`${magenta}🤖 ${agentCount} agent${agentCount === 1 ? '' : 's'}${R}`);

    if (ctxPct !== null)
      parts.push(`${clr(ctxPct)}ctx ${ctxPct.toFixed(0)}% ${bar(ctxPct)}${R}`);

    if (rl5h?.used_percentage != null)
      parts.push(`${clr(rl5h.used_percentage)}5h-limit ${rl5h.used_percentage.toFixed(0)}% ${bar(rl5h.used_percentage)}${timeUntil(rl5h.resets_at)}${R}`);

    if (rl7d?.used_percentage != null)
      parts.push(`${clr(rl7d.used_percentage)}7d-limit ${rl7d.used_percentage.toFixed(0)}% ${bar(rl7d.used_percentage)}${timeUntil(rl7d.resets_at)}${R}`);

    if (promptCount !== null)
      parts.push(`${cyan}💬 ${promptCount} prompt${promptCount === 1 ? '' : 's'}${R}`);

    if (data.session_id)
      parts.push(`${dim}🆔 ${data.session_id}${R}`);

    process.stdout.write(parts.join('  ') + '\n');
  } catch {
    process.stdout.write('\n');
  }
});
