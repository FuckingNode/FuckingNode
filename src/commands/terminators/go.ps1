Write-Host ">>> Removing Golang..."

Write-Host ">>> Removing Golang via MSIExec..."

$line = (& go.exe version) 

$version = ($line | Select-String "go\d+\.\d+\.\d+").Matches.Value
$arch    = ($line | Select-String "(?<=/)[^ ]+$").Matches.Value

& msiexec.exe /x "go$version.windows-$arch.msi" /q

Write-Host ">>! Done. Please restart your terminal to fully apply changes."
