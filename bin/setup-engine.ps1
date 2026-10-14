# Kaycee Audio AI Engine 1-Click Installer
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=================================================="
Write-Host "🚀 KAYCEE CEP: AI AUDIO ENGINE AUTO-INSTALLER"
Write-Host "=================================================="

# Detect Python (skipping fake WindowsApps alias)
Write-Host "`n[1/3] Checking for Python on Windows..."

$pyLocations = @(
    "$env:LocalAppData\Programs\Python\Python311\python.exe",
    "$env:LocalAppData\Programs\Python\Python312\python.exe",
    "$env:ProgramFiles\Python311\python.exe",
    "$env:ProgramFiles\Python312\python.exe",
    "C:\Python311\python.exe"
)

$pythonExe = $null

foreach ($p in $pyLocations) {
    if (Test-Path $p) {
        $pythonExe = $p
        break
    }
}

if (-not $pythonExe) {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -notmatch "WindowsApps") {
        $testOut = (& python --version 2>&1) | Out-String
        if ($testOut -match "Python \d+\.\d+") {
            $pythonExe = $cmd.Source
        }
    }
}

if (-not $pythonExe) {
    Write-Host "Python not found. Starting automatic installation..."
    $installerUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    $installerPath = "$env:TEMP\python-3.11.9-amd64.exe"

    if (-not (Test-Path $installerPath)) {
        Write-Host "Downloading Python 3.11 installer..."
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    }

    Write-Host "Installing Python (user-level, no admin required)..."
    Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1 Include_launcher=0 InstallLauncherAllUsers=0 Shortcuts=0" -Wait

    if (Test-Path "$env:LocalAppData\Programs\Python\Python311\python.exe") {
        $pythonExe = "$env:LocalAppData\Programs\Python\Python311\python.exe"
    } else {
        Write-Host "Error: Failed to install Python."
        exit 1
    }
}

Write-Host "Python ready: $pythonExe"

# Add Python and Scripts to session PATH
$pyDir = Split-Path $pythonExe
$env:Path = "$pyDir;$pyDir\Scripts;" + $env:Path

# Step 2: Install packages
Write-Host "`n[2/3] Installing AI packages (audio-separator & onnxruntime)..."
Write-Host "This process may take 1-2 minutes depending on your internet connection..."

& $pythonExe -m pip install --upgrade pip --quiet
& $pythonExe -m pip install "audio-separator" "onnxruntime"

# Step 3: Verify
Write-Host "`n[3/3] Verifying audio-separator engine..."
$ver = & $pythonExe -m audio_separator.utils.cli --version 2>&1

if ($LASTEXITCODE -eq 0 -or $ver -match "audio-separator") {
    Write-Host "`n=================================================="
    Write-Host "SUCCESS: AI Audio Engine installed successfully!"
    Write-Host "Kaycee panel is now ready to separate vocals and music."
    Write-Host "=================================================="
    exit 0
} else {
    Write-Host "`nWARNING: Installation incomplete. Details: $ver"
    exit 1
}
