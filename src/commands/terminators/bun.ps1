Write-Host ">>> Removing BunJS..."

Write-Host ">>> Removing .bun..."

$scriptFile = $env:USERPROFILE + "\.bun\uninstall.ps1"

Start-Process powershell -Verb runAs -Wait -PassThru -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptFile

Write-Host ">>! Done. PATH entries weren't removed (this is a TODO)."
