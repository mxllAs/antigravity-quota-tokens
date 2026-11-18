param(
  [string]$Plugin = '',
  [switch]$RestoreShortcuts
)

$ErrorActionPreference = 'Stop'
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetRoot = Join-Path $env:USERPROFILE '.gemini\config\plugins'

$candidates = Get-ChildItem -Path $baseDir -Directory | Where-Object {
  (Test-Path (Join-Path $_.FullName 'plugin.json')) -and
  ([string]::IsNullOrWhiteSpace($Plugin) -or $_.Name -eq $Plugin)
}

foreach ($p in $candidates) {
  $destDir = Join-Path $targetRoot $p.Name
  if (Test-Path $destDir) {
    Remove-Item -Path $destDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed plugin: $($p.Name)" -ForegroundColor Cyan
  }
}

if ($RestoreShortcuts) {
  $shortcuts = @(
    (Join-Path $env:USERPROFILE 'Desktop\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Antigravity.lnk')
  )
  $shell = New-Object -ComObject WScript.Shell
  foreach ($lnk in $shortcuts) {
    if (Test-Path $lnk) {
      $sc = $shell.CreateShortcut($lnk)
      if ($sc.TargetPath -like '*\Antigravity.exe' -and $sc.Arguments -like '*--remote-debugging-port=*') {
        $cleaned = ($sc.Arguments -replace '--remote-debugging-port=\S+\s*', '' -replace '--remote-debugging-address=\S+\s*', '').Trim()
        $sc.Arguments = $cleaned
        $sc.Save()
        Write-Host "Restored shortcut: $lnk" -ForegroundColor Green
      }
    }
  }
}

Write-Host "Uninstall complete." -ForegroundColor Green
