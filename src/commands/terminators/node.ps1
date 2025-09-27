Write-Host ">>> Removing Node.js from all known methods (if present)..."
Write-Host "This will attempt to remove installations from:"
Write-Host "- MSI        [ENTIRELY REMOVES NODE]  (https://nodejs.org/download)"
Write-Host "- Volta      [ENTIRELY REMOVES VOLTA] (https://volta.sh/) "
Write-Host "- Chocolatey [ONLY REMOVES PACKAGE]   (https://community.chocolatey.org/packages/nodejs)"
Write-Host "- Scoop      [ONLY REMOVES PACKAGE]   (https://scoop.sh/#/apps?id=1f571812646c866d9b93b62321aefd3707a6f7ee)"
Write-Host "- WinGet     [ONLY REMOVES PACKAGE]   (https://winget.run/pkg/OpenJS/NodeJS (unofficial smh))"
Write-Host "\nIt'll run *every* uninstaller. Errors will be handled by silently continuing."
Write-Host "\nIt'll also manually remove all leftovers and DIRs."

Write-Host ">>> Uninstalling MSI instances..."

Get-CimInstance Win32_Product -ErrorAction SilentlyContinue |
Where-Object { $_.Name -like "Node.js*" -or $_.Name -like "npm*" -or $_.Name -like "nvm*" -or $_.Name -like "Volta*" } |
ForEach-Object {
    Write-Host "Uninstalling $($_.Name)..."
    $_.Uninstall() | Out-Null
}

Write-Host ">>> Uninstalling Chocolatey instances..."

if (Get-Command choco.exe -ErrorAction SilentlyContinue) {
    & choco.exe uninstall nodejs -y
    & choco.exe uninstall npm -y
    & choco.exe uninstall nvm -y
}

Write-Host ">>> Uninstalling WinGet instances..."

& winget.exe uninstall --id "OpenJS.NodeJS" --silent --accept-package-agreements --accept-source-agreements

Write-Host ">>> Uninstalling Scoop instances..."

if (Get-Command scoop.exe -ErrorAction SilentlyContinue) {
    & scoop.exe uninstall "main/nodejs"
}

Write-Host ">>> Removing leftover Node.js and npm folders..."
$folders = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\npm",
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\npm-cache",
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "$env:USERPROFILE\.npm",
    "$env:USERPROFILE\.nvm",
    "$env:USERPROFILE\node_modules",
    "$env:USERPROFILE\AppData\Local\Programs\nodejs"
)

foreach ($f in $folders) {
    if (Test-Path $f) {
        Write-Host "Deleting $f "
        Remove-Item $f -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ">>> Cleaning PATH variables..."
function Clear-PathVar($scope) {
    $current = [System.Environment]::GetEnvironmentVariable("Path", $scope)
    # fix just in case the installation comes from a package manager instead of script
    # should probably get the installation path instead
    if (-not (Test-Path "C:\FuckingNode")) { New-Item -ItemType Directory -Path "C:\FuckingNode" -Force }
    Write-Output $current > "C:\FuckingNode\path_$scope.fknode.bak"
    Write-Host "Backed up your $scope PATH to C:\FuckingNode\path_$scope.fknode.bak"
    if ($null -ne $current) {
        $new = ($current.Split(";") | Where-Object { $_.ToLower() -notmatch "nodejs" -and $_.ToLower() -notmatch "npm" } )
        [System.Environment]::SetEnvironmentVariable("Path", ($new -join ";"), $scope)
    }
}
Clear-PathVar "User"
# Clear-PathVar "Machine" i have trust issues with this thing

Write-Host ">>! Done. Please restart your terminal to fully apply changes."
