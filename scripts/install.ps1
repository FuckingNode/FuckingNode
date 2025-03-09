$ErrorActionPreference = "Stop"

# Constants
$APP_NAME = @{
    CASED  = "FuckingNode"
    CLI    = "fuckingnode"
    STYLED = "F*ckingNode"
}
$installDir = "C:\$($APP_NAME.CASED)"
$exePath = Join-Path -Path $installDir -ChildPath "$($APP_NAME.CLI).exe"

# get latest release URL
Function Get-LatestReleaseUrl {
    try {
        Write-Host "Fetching latest release from GitHub..."
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/FuckingNode/FuckingNode/releases/latest"
        $asset = $response.assets | Where-Object { $_.name -like "*.exe" -and $_.name -notlike "*INSTALLER*" }
        if (-not $asset) {
            Throw "No .exe file found in the latest release."
        }
        Write-Host "Fetched."
        return $asset.browser_download_url
    }
    catch {
        if ($null -ne $_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorContent = $reader.ReadToEnd() | ConvertFrom-Json

            if ($errorContent.message -match "API rate limit exceeded") {
                Write-Error "API rate limit exceeded. To avoid this, authenticate your requests with a GitHub token."
                Write-Error "Visit the following documentation for more information: $($errorContent.documentation_url)"
            }
            else {
                Write-Error "An error occurred: $($errorContent.message)"
            }
        }
        else {
            Write-Error "An unknown error occurred: $($_.Exception.Message)"
        }
    }
}

# creates a .bat shortcut to allow for fknode to exist alongside fuckingnode in the CLI
Function New-Shortcuts {
    try {
        Write-Host "Creating shortcuts for CLI..."

        # all aliases should be
        # (appName).exe <a command> [ANY ARGS PASSED]
        # so e.g. fkclean "b" = (appName).exe <command> "b"

        $appName = $APP_NAME.CLI

        if (-not (Test-Path $installDir -PathType Container)) {
            Throw "Error: Install directory '$installDir' does not exist."
        }

        $commands = @{
            "fknode"      = ""
            "fkn"         = ""
            "fkclean"     = "clean"
            "fkstart"     = "kickstart"
            "fklaunch"    = "launch"
            "fkcommit"    = "commit"
            "fkrelease"   = "release"
            "fksurrender" = "surrender"
            "fkadd"       = "manager add"
            "fkrem"       = "manager remove"
        }

        foreach ($name in $commands.Keys) {
            $cmd = $commands[$name]
            $batContent = "@echo off`n%~dp0$($appName).exe $cmd %*"
            $batPath = Join-Path -Path $installDir -ChildPath "$name.bat"
            Set-Content -Path $batPath -Value $batContent -Encoding ASCII
            Write-Host "Shortcut created successfully at $batPath"
        }
    }
    catch {
        Write-Error "Failed to create .bat shortcuts for the CLI: $_"
        Throw $_
    }
}

# download the app
Function Install-App {
    param (
        [string]$url
    )
    try {
        Write-Host "Downloading from $url..."

        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir | Out-Null
        }

        Invoke-WebRequest -Uri $url -OutFile $exePath
        Write-Host "Downloaded successfully to $exePath"
    }
    catch {
        Throw "Failed to download or save the file: $_"
    }
}

# ngl copied this from bun.sh/install.ps1
# 'HKCU:' = hkey_current_user btw
# i don't know what does this shi- do but it works flawlessly so it'll do i guess
function Publish-Env {
    if (-not ("Win32.NativeMethods" -as [Type])) {
        Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @"
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(
      IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
      uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
"@
    }
    $HWND_BROADCAST = [IntPtr] 0xffff
    $WM_SETTINGCHANGE = 0x1a
    $result = [UIntPtr]::Zero
    [Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST,
        $WM_SETTINGCHANGE,
        [UIntPtr]::Zero,
        "Environment",
        2,
        5000,
        [ref] $result
    ) | Out-Null
}

function Write-Env {
    param([String]$Key, [String]$Value)

    $RegisterKey = Get-Item -Path 'HKCU:'

    $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment', $true)
    if ($null -eq $Value) {
        $EnvRegisterKey.DeleteValue($Key)
    }
    else {
        $RegistryValueKind = if ($Value.Contains('%')) {
            [Microsoft.Win32.RegistryValueKind]::ExpandString
        }
        elseif ($EnvRegisterKey.GetValue($Key)) {
            $EnvRegisterKey.GetValueKind($Key)
        }
        else {
            [Microsoft.Win32.RegistryValueKind]::String
        }
        $EnvRegisterKey.SetValue($Key, $Value, $RegistryValueKind)
    }

    Publish-Env
}

function Get-Env {
    param([String] $Key)

    $RegisterKey = Get-Item -Path 'HKCU:'
    $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment')
    $EnvRegisterKey.GetValue($Key, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
}
  
# Function: Add App to PATH
Function Add-AppToPath {
    try {
        Write-Host "Adding shorthand to PATH..."

        if ([string]::IsNullOrWhiteSpace($installDir)) {
            Throw "Install DIR is undefined or empty."
        }

        $Path = (Get-Env -Key "Path") -split ';'

        # Add installDir to PATH if not already present
        if ($Path -notcontains $installDir) {
            $Path += $installDir
            Write-Env -Key 'Path' -Value ($Path -join ';')
            $env:PATH = $Path;
        }
        else {
            Write-Output "'${installDir}' is already in your PATH."
        }
    }
    catch {
        Write-Error "Error adding to PATH: $_"
        Throw $_
    }
}

Function Installer {
    try {
        Write-Host "Hi! We'll install $($APP_NAME.STYLED) for you. Just a sec!"
        $url = Get-LatestReleaseUrl
        Install-App -url $url
        Add-AppToPath
        New-Shortcuts
        Write-Host "Installed successfully! Restart your terminal for it to work."
    }
    catch {
        Write-Error $_
    }
}

# start installation
Installer
