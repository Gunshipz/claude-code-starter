const fs = require('fs');
const os = require('os');
const path = require('path');

process.stdin.resume();
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    const tasks = data.tasks || [];
    const running = tasks.filter(t => t.status === 'running').length;
    const file = path.join(os.tmpdir(), `claude-agent-count-${data.session_id}.json`);
    fs.writeFileSync(file, JSON.stringify({ count: running, ts: Date.now() }));
  } catch {}
  // Emit nothing so every row keeps its default rendering.
  process.stdout.write('');
});
