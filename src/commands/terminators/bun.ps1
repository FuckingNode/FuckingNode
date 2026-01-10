Write-Host ">>> Removing Bun..."

Write-Host ">>> Removing .bun..."

$scriptFile = $env:USERPROFILE + "\.bun\uninstall.ps1"

Start-Process powershell -Verb runAs -Wait -PassThru -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptFile

Write-Host ">>> Removing Bun from PATH..."
Write-Host ">>| Just in case, a PATH backup will be made at $env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_BUN.txt."

$oldPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

Out-File "$env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_BUN.txt"
$newPath = ($oldPath.Split(";") | Where-Object { $_ -ne $env:USERPROFILE + "\.bun\bin" }) -join ";"

[System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host ">>> Done."
