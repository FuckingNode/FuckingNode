Write-Host ">>> Removing Node.js from all known methods (if present)..."
Write-Host "This will attempt to remove installations from:"
Write-Host "- MSI installer (nodejs.org)"
Write-Host "- Volta [Removes Volta itself!]"
Write-Host "- Chocolatey"
Write-Host "- Scoop"
Write-Host "- WinGet"
Write-Host "- nvm-windows"
Write-Host "\nIt'll run *every* uninstaller. Errors will be handled by silently continuing."
Write-Host "\nIt'll also manually remove all leftovers and DIRs."

Write-Host ">>> Uninstalling MSI instances..."

$keys = @(
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

Get-ItemProperty $keys -ErrorAction SilentlyContinue |
Where-Object {
    $_.DisplayName -like "Node.js*" -or
    $_.DisplayName -like "npm*" -or
    $_.DisplayName -like "nvm*" -or
    $_.DisplayName -like "Volta*"
} |
ForEach-Object {
    Write-Host "Uninstalling $($_.DisplayName)"
    try {
        & cmd.exe /c $_.UninstallString
    }
    catch {}
}

Write-Host ">>> Uninstalling Chocolatey instances..."

if (Get-Command choco.exe -ErrorAction SilentlyContinue) {
    & choco.exe uninstall nodejs -y
    & choco.exe uninstall nodejs-lts -y
    & choco.exe uninstall npm -y
    & choco.exe uninstall nvm -y
}

Write-Host ">>> Uninstalling WinGet instances..."

& winget.exe uninstall --id OpenJS.NodeJS --silent --accept-package-agreements --accept-source-agreements
& winget.exe uninstall --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

Write-Host ">>> Uninstalling Scoop instances..."

if (Get-Command scoop.exe -ErrorAction SilentlyContinue) {
    & scoop.exe uninstall nodejs
    & scoop.exe uninstall nodejs-lts
}

Write-Host ">>> Checking Volta instances..."

if (Test-Path "$env:LOCALAPPDATA\Volta") {
    Write-Host "Removing Volta folder"
    Remove-Item "$env:LOCALAPPDATA\Volta" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ">>> Uninstalling nvm instances..."

if (Test-Path "$env:APPDATA\nvm") {
    Remove-Item "$env:APPDATA\nvm" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ">>> Removing leftover Node.js and npm folders..."
$folders = @(
    "$env:APPDATA\npm",
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\npm-cache",
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "$env:USERPROFILE\.npm",
    "$env:USERPROFILE\.nvm",
    "$env:USERPROFILE\node_modules",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

foreach ($f in $folders) {
    if (Test-Path $f) {
        Write-Host "Deleting $f"
        Remove-Item $f -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ">>> Cleaning PATH variables..."
function Clear-PathVar($scope) {
    $current = [System.Environment]::GetEnvironmentVariable("Path", $scope)
    # fix just in case the installation comes from a package manager instead of script
    # should probably get the installation path instead
    if ($null -ne $current) {
        $backupFile = "$env:USERPROFILE\.node_uninstall_backup_$scope.bak"
        $current | Out-File $backupFile

        Write-Host "Backed up $scope PATH -> $backupFile"

        $new = ( $current.Split(";") | Where-Object {
                $_.ToLower() -notmatch "\\nodejs" -and
                $_.ToLower() -notmatch "\\npm$" -and
                $_.ToLower() -notmatch "volta"
            } )
        [System.Environment]::SetEnvironmentVariable("Path", ($new -join ";"), $scope)
    }
}
Clear-PathVar "User"
# Clear-PathVar "Machine" i have trust issues with this thing

Write-Host ">>! Done. Please restart your terminal to fully apply changes."
