$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://127.0.0.1:5173/"

$listener = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" `
    -ArgumentList "run dev -- --host 127.0.0.1 --port 5173" `
    -WorkingDirectory $projectPath `
    -WindowStyle Hidden
  Start-Sleep -Seconds 4
}

Start-Process $url
