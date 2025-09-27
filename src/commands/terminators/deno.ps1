Write-Host ">>> Removing DenoJS..."

Write-Host ">>> Removing .deno..."

$denoDir = $env:USERPROFILE + "\.deno"

Remove-Item $denoDir -Recurse -Force

Write-Host ">>! Done. PATH entries weren't removed (this is a TODO)."
