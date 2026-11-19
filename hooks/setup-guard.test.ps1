# Test harness for setup-guard.ps1: feeds fake hook input and checks block vs. allow.
$guard = Join-Path $PSScriptRoot "setup-guard.ps1"
$dir = Join-Path $env:TEMP ("setup-guard-test-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $dir | Out-Null
$progress = Join-Path $dir "progress.md"; $state = Join-Path $dir "state.json"; $tx = Join-Path $dir "t.jsonl"

function Set-Last([string]$text) {
    $row = @{ type = "assistant"; isSidechain = $false; message = @{ role = "assistant"; content = @(@{ type = "text"; text = $text }) } }
    ($row | ConvertTo-Json -Depth 6 -Compress) | Set-Content -Path $tx -Encoding UTF8
}
function Run([string]$session = "s1") {
    $in = @{ session_id = $session; transcript_path = $tx; stop_hook_active = $false } | ConvertTo-Json -Compress
    $out = $in | powershell -NoProfile -ExecutionPolicy Bypass -File $guard -Progress $progress -State $state
    return [bool]($out -match '"decision":\s*"block"')
}
$fails = 0
function Check([string]$name, [bool]$got, [bool]$want) {
    $ok = $got -eq $want; if (-not $ok) { $script:fails++ }
    "{0,-5} {1,-6} {2}" -f $(if ($ok) { "ok" } else { "FAIL" }), $(if ($got) { "block" } else { "allow" }), $name
}

Remove-Item $progress -ErrorAction SilentlyContinue
Set-Last "Installed Git."
Check "no checklist file" (Run) $false

"- [x] A1`n- [x] A2" | Set-Content $progress -Encoding UTF8
Check "every box ticked" (Run) $false

"- [x] A1`n- [ ] A2 Settings`n- [ ] A3 Apps" | Set-Content $progress -Encoding UTF8
Remove-Item $state -ErrorAction SilentlyContinue
Set-Last "Installed Git and Node."
Check "boxes left, Claude just stopped" (Run) $true
Set-Last "What would you like me to call you?"
Check "ends with a question" (Run) $false
Set-Last "Part one is done. Close this window with the X, open Command Prompt again, type claude, then type continue setup."
Check "restart instruction" (Run) $false

Remove-Item $state -ErrorAction SilentlyContinue
Set-Last "Working on it."
$r = @(Run; Run; Run; Run)
Check "strike 1 blocks" $r[0] $true
Check "strike 3 still blocks" $r[2] $true
Check "strike 4 gives up (no progress)" $r[3] $false
"- [x] A1`n- [x] A2 Settings`n- [ ] A3 Apps" | Set-Content $progress -Encoding UTF8
Check "progress resets strikes" (Run) $true
Check "new session resets strikes" (Run "s2") $true

Remove-Item $dir -Recurse -Force
if ($fails -eq 0) { "ALL PASS" } else { "$fails FAILURES" }
