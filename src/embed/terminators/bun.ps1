Write-Host ">>> Removing Bun..."

if (Get-Command scoop.exe -ErrorAction SilentlyContinue) {
    $out = & scoop.exe list
    if ($out -match "bun") {
        & scoop.exe uninstall bun
        return
    }
}

$scriptFile = $env:USERPROFILE + "\.bun\uninstall.ps1"

Start-Process powershell -Verb runAs -Wait -PassThru -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptFile

Write-Host ">>> Removing Bun from PATH..."
Write-Host ">>| Just in case, a PATH backup will be made at $env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_BUN.txt."

$oldPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

Out-File "$env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_BUN.txt"
$newPath = ($oldPath.Split(";") | Where-Object { $_ -ne $env:USERPROFILE + "\.bun\bin" }) -join ";"

[System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host ">>> Done."

# TODO:
# remove from npm or homebrew
