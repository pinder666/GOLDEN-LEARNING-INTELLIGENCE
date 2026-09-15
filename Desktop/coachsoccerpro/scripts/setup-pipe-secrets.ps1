# ==========================================================================
# PIPE SECRETS - one click, zero memory.
#
# Generates the three machine-to-machine keys (Pipes A/B/C) and buries them
# in BOTH products' config files. Nothing is ever displayed. Run once at
# deploy day via setup-pipe-secrets.cmd (double-click), then forget forever.
#
# Writes:
#   coachsoccerpro\supabase\functions\.env   (CSP Edge Functions side)
#   soccermental\.env.pipes                  (SoccerMental side - its agent
#                                             wires this file in)
#
# Safety: refuses to overwrite existing keys (rotation would break the
# pairing). To deliberately rotate: run with -Force, then redeploy both.
# ==========================================================================
param([switch]$Force)

$ErrorActionPreference = "Stop"

$cspEnv = Join-Path $PSScriptRoot "..\supabase\functions\.env"
$smEnv  = "C:\Users\user\Desktop\soccermental\.env.pipes"

if ((Test-Path $cspEnv) -and (Select-String -Path $cspEnv -Pattern "PIPE_A_SECRET" -Quiet) -and (-not $Force)) {
  Write-Host ""
  Write-Host "  Keys already exist. Nothing changed (rotating would break the pairing)." -ForegroundColor Yellow
  Write-Host "  To rotate on purpose: run again with -Force, then redeploy both sides." -ForegroundColor Yellow
  Write-Host ""
  exit 0
}

function New-Key {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $raw = [Convert]::ToBase64String($bytes) -replace '[+/=]', ''
  return $raw.Substring(0, [Math]::Min(40, $raw.Length))
}

$A = New-Key
$B = New-Key
$C = New-Key

# --- CSP side (Edge Functions env) ---
New-Item -ItemType Directory -Force (Split-Path $cspEnv) | Out-Null
@(
  "# Pipe secrets - generated $(Get-Date -Format s). Never commit, never display."
  "PIPE_A_SECRET=$A"
  "PIPE_B_SECRET=$B"
  "PIPE_C_SECRET=$C"
  "SM_PIPE_C_URL=http://localhost:8092/api/pipe-c/assign"
) | Out-File -FilePath $cspEnv -Encoding ascii

# --- SoccerMental side ---
@(
  "# Pipe secrets - generated $(Get-Date -Format s) by CoachSoccerPro's setup script."
  "# SM agent: load this file into your server env. Same keys as CSP's side."
  "PIPE_A_SECRET=$A"
  "PIPE_B_SECRET=$B"
  "PIPE_C_SECRET=$C"
) | Out-File -FilePath $smEnv -Encoding ascii

# --- Push to Supabase cloud too, if the CLI is linked (graceful skip) ---
$pushed = $false
try {
  $null = Get-Command supabase -ErrorAction Stop
  Push-Location (Join-Path $PSScriptRoot "..")
  supabase secrets set "PIPE_A_SECRET=$A" "PIPE_B_SECRET=$B" "PIPE_C_SECRET=$C" "SM_PIPE_C_URL=http://localhost:8092/api/pipe-c/assign" 2>$null
  if ($?) { $pushed = $true }
  Pop-Location
} catch { }

# Wipe plaintext from this session
$A = $null; $B = $null; $C = $null

Write-Host ""
Write-Host "  OK - pipe keys generated and buried. You never need to see them." -ForegroundColor Green
Write-Host "    CSP side:          $cspEnv"
Write-Host "    SoccerMental side: $smEnv"
Write-Host "    (tell the SM agent: secrets are in .env.pipes - wire them in)"
if ($pushed) {
  Write-Host "    Supabase cloud:    pushed" -ForegroundColor Green
} else {
  Write-Host "    Supabase cloud:    not linked yet - at deploy I will prompt you" -ForegroundColor Yellow
}
Write-Host ""
