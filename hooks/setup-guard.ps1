# Stop hook: keep Claude working through SETUP.md until the checklist is finished.
# From github.com/Gunshipz/claude-code-starter. Written in Windows PowerShell 5.1 so it runs
# before Node.js is installed. Test: powershell -NoProfile -File setup-guard.test.ps1
#
# Lets Claude stop when: there's no checklist, every box is ticked, Claude's last message is
# waiting on the user (ends with a question, or tells them to restart / continue setup), or
# it has already blocked 3 times in a row without a single new tick (never traps the user).
param([string]$Progress = (Join-Path $env:USERPROFILE ".claude\setup-progress.md"),
      [string]$State = (Join-Path $env:USERPROFILE ".claude\setup-guard-state.json"))

$ErrorActionPreference = "Stop"
function Allow { exit 0 }

try {
    $raw = [Console]::In.ReadToEnd()
    $hook = if ($raw) { $raw | ConvertFrom-Json } else { $null }
} catch { Allow }

if (-not (Test-Path $Progress)) { Allow }
$lines = Get-Content -Path $Progress -Encoding UTF8
$open = @($lines | Where-Object { $_ -match '^\s*[-*]\s*\[ \]' })
if ($open.Count -eq 0) { Allow }

# Last assistant text from the transcript.
$last = ""
try {
    if ($hook -and $hook.transcript_path -and (Test-Path $hook.transcript_path)) {
        $rows = @(Get-Content -Path $hook.transcript_path -Encoding UTF8 -Tail 400)
        for ($i = $rows.Count - 1; $i -ge 0; $i--) {
            try { $e = $rows[$i] | ConvertFrom-Json } catch { continue }
            if ($e.type -ne "assistant" -or $e.isSidechain) { continue }
            $texts = @($e.message.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text })
            if ($texts.Count -gt 0) { $last = ($texts -join "`n").Trim(); break }
        }
    }
} catch { }

# Waiting on the user: a question, or a restart / continue-setup instruction.
if ($last -match '\?\s*(\S{0,3})\s*$' -or $last -match '(?i)continue setup|restart the terminal|close this window') { Allow }

# Loop safety: count consecutive blocks with no new ticks.
$session = if ($hook -and $hook.session_id) { [string]$hook.session_id } else { "unknown" }
$st = @{ session = ""; open = -1; strikes = 0 }
try { if (Test-Path $State) { $j = Get-Content $State -Raw | ConvertFrom-Json; $st.session = $j.session; $st.open = [int]$j.open; $st.strikes = [int]$j.strikes } } catch { }
if ($st.session -ne $session -or $open.Count -lt $st.open) { $st.strikes = 0 }
$st.strikes++
$st.session = $session; $st.open = $open.Count
try { $st | ConvertTo-Json -Compress | Set-Content -Path $State -Encoding ASCII } catch { }
if ($st.strikes -gt 3) { Allow }

$next = ($open[0] -replace '^\s*[-*]\s*\[ \]\s*', '').Trim()
$reason = "Setup isn't finished: $($open.Count) box(es) left in $Progress. Next: $next. " +
          "Keep going with SETUP.md (your local copy in .claude\setup). If you need the user " +
          "for something only they can do, ask them a question and end your message with it."
@{ decision = "block"; reason = $reason } | ConvertTo-Json -Compress
exit 0
