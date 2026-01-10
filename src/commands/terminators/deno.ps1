Write-Host ">>> Removing Deno..."

Write-Host ">>> Removing .deno..."

$denoDir = $env:USERPROFILE + "\.deno"

Remove-Item $denoDir -Recurse -Force


Write-Host ">>> Removing Deno from PATH..."
Write-Host ">>| Just in case, a PATH backup will be made at $env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_DENO.txt."

$oldPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

Out-File "$env:USERPROFILE\FKN_PATH_BACKUP-TERMINATE_DENO.txt"

$newPath = ($oldPath.Split(";") | Where-Object { $_ -ne $env:USERPROFILE + "\.deno\bin" }) -join ";"

[System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host ">>> Done."
