param(
  [string]$Plugin = '',
  [switch]$SkipShortcuts
)

$ErrorActionPreference = 'Stop'
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetRoot = Join-Path $env:USERPROFILE '.gemini\config\plugins'

New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null

$candidates = Get-ChildItem -Path $baseDir -Directory | Where-Object {
  (Test-Path (Join-Path $_.FullName 'plugin.json')) -and
  ([string]::IsNullOrWhiteSpace($Plugin) -or $_.Name -eq $Plugin)
}

if (-not $candidates) {
  throw "No matching plugin found in $baseDir (Plugin='$Plugin')."
}

Write-Host "[1/2] Installing Antigravity Desktop plugin(s) to $targetRoot ..." -ForegroundColor Cyan
foreach ($p in $candidates) {
  $destDir = Join-Path $targetRoot $p.Name
  New-Item -ItemType Directory -Path $destDir -Force | Out-Null

  Get-ChildItem -Path $p.FullName -Force | Where-Object {
    $_.Name -ne 'README.md'
  } | ForEach-Object {
    $destPath = Join-Path $destDir $_.Name
    if ($_.PSIsContainer) {
      Copy-Item -Path $_.FullName -Destination $destDir -Recurse -Force
    } else {
      Copy-Item -Path $_.FullName -Destination $destPath -Force
    }
  }
  Write-Host "  Installed: $($p.Name)" -ForegroundColor Green
}

if (-not $SkipShortcuts) {
  Write-Host "[2/2] Configuring Antigravity Desktop loopback debug flags on shortcuts ..." -ForegroundColor Cyan
  $debugFlags = '--remote-debugging-port=0 --remote-debugging-address=127.0.0.1'
  $defaultExe = Join-Path $env:LOCALAPPDATA 'Programs\antigravity\Antigravity.exe'
  $specialDesktop = [Environment]::GetFolderPath('Desktop')
  $shortcuts = @(
    (Join-Path $specialDesktop 'Antigravity.lnk'),
    (Join-Path $env:USERPROFILE 'Desktop\Antigravity.lnk'),
    (Join-Path $env:PUBLIC 'Desktop\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Antigravity.lnk')
  ) | Select-Object -Unique
  $shell = New-Object -ComObject WScript.Shell
  foreach ($lnk in $shortcuts) {
    if (Test-Path $lnk) {
      $sc = $shell.CreateShortcut($lnk)
      if ($sc.TargetPath -like '*\Antigravity.exe') {
        $existing = ($sc.Arguments | Out-String).Trim()
        if ($existing -notlike '*--remote-debugging-port=*') {
          $sc.Arguments = if ($existing) { "$existing $debugFlags" } else { $debugFlags }
          $sc.Save()
          Write-Host "  Updated shortcut: $lnk" -ForegroundColor Green
        } else {
          Write-Host "  Already configured: $lnk" -ForegroundColor DarkGray
        }
      }
    } elseif (Test-Path $defaultExe) {
      $dir = Split-Path $lnk -Parent
      if (Test-Path $dir) {
        $sc = $shell.CreateShortcut($lnk)
        $sc.TargetPath = $defaultExe
        $sc.Arguments = $debugFlags
        $sc.WorkingDirectory = Split-Path $defaultExe -Parent
        $sc.IconLocation = "$defaultExe,0"
        $sc.Save()
        Write-Host "  Created shortcut: $lnk" -ForegroundColor Green
      }
    }
  }
}

$activePortFile = Join-Path $env:APPDATA 'Antigravity\DevToolsActivePort'
if (Test-Path $activePortFile) {
  Write-Host "Done! DevToolsActivePort is active. Toggle the plugin in Customizations (or restart Antigravity Desktop) if updating an already-running plugin." -ForegroundColor Yellow
} else {
  Write-Host "Done! Please fully quit Antigravity Desktop (including system tray) and launch it from your Desktop / Start Menu shortcut." -ForegroundColor Yellow
}
