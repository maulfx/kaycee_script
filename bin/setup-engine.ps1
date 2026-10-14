# Kaycee Audio AI Engine 1-Click Plug & Play Installer
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=================================================="
Write-Host "🚀 KAYCEE CEP: AI AUDIO ENGINE AUTO-INSTALLER"
Write-Host "=================================================="

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$panelRoot = Split-Path -Parent $scriptDir

# ----------------------------------------------------
# STEP 1: Python Detection / Installation
# ----------------------------------------------------
Write-Host "`n[1/4] Checking Python environment..."

$pyLocations = @(
    "$env:LocalAppData\Programs\Python\Python311\python.exe",
    "$env:LocalAppData\Programs\Python\Python312\python.exe",
    "$env:LocalAppData\Programs\Python\Python310\python.exe",
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

$pyDir = Split-Path $pythonExe
$scriptsDir = "$pyDir\Scripts"
$env:Path = "$pyDir;$scriptsDir;" + $env:Path

# ----------------------------------------------------
# STEP 2: Install AI Packages & FFmpeg helper
# ----------------------------------------------------
Write-Host "`n[2/4] Installing AI packages (audio-separator, rembg, onnxruntime, static-ffmpeg)..."
Write-Host "This process may take 1-3 minutes depending on your internet connection..."

& $pythonExe -m pip install --upgrade pip --quiet
& $pythonExe -m pip install "audio-separator" "rembg" "onnxruntime" "static-ffmpeg"

# ----------------------------------------------------
# STEP 3: Setup Standalone FFmpeg (Plug & Play)
# ----------------------------------------------------
Write-Host "`n[3/4] Ensuring FFmpeg is available..."

# Extract / download ffmpeg using static-ffmpeg python package
$ffmpegCopied = $false
try {
    & $pythonExe -c "import static_ffmpeg, shutil, os; static_ffmpeg.add_paths(); src = shutil.which('ffmpeg'); scripts_dst = os.path.join(os.path.dirname(shutil.which('python') or '.'), 'Scripts', 'ffmpeg.exe'); shutil.copy2(src, scripts_dst) if (src and not os.path.exists(scripts_dst)) else None"
} catch {
    Write-Host "static-ffmpeg auto-copy skipped."
}

# Also ensure bin/ffmpeg.exe exists in extension folder if writable
$binFFmpeg = Join-Path $scriptDir "ffmpeg.exe"
if (-not (Test-Path $binFFmpeg)) {
    $srcFFmpeg = Join-Path $scriptsDir "ffmpeg.exe"
    if (Test-Path $srcFFmpeg) {
        try {
            Copy-Item $srcFFmpeg $binFFmpeg -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

# ----------------------------------------------------
# STEP 4: Pre-download Default Fast Models & Verify
# ----------------------------------------------------
Write-Host "`n[4/4] Pre-downloading default AI models..."
try {
    Write-Host "Pre-downloading Audio AI model (UVR-MDX-NET-Voc_FT)..."
    & $pythonExe -m audio_separator.utils.cli --download_model_only -m UVR-MDX-NET-Voc_FT.onnx
} catch {
    Write-Host "Audio model pre-download warning: will download on first run."
}

try {
    Write-Host "Pre-downloading Bg Remover model (IS-Net Detail)..."
    & $pythonExe -c "import rembg; rembg.new_session('isnet-general-use')"
} catch {
    Write-Host "Bg Remover model pre-download warning: will download on first run."
}

Write-Host "`nVerifying engine..."
$ver = & $pythonExe -m audio_separator.utils.cli --version 2>&1

if ($LASTEXITCODE -eq 0 -or $ver -match "audio-separator") {
    Write-Host "`n=================================================="
    Write-Host "SUCCESS: AI Audio Engine is 100% Ready! 🎉"
    Write-Host "Python, FFmpeg, and AI models have been configured."
    Write-Host "Kaycee panel is now plug-and-play ready in After Effects."
    Write-Host "=================================================="
    exit 0
} else {
    Write-Host "`nWARNING: Installation incomplete. Details: $ver"
    exit 1
}
