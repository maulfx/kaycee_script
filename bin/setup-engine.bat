@echo off
title Kaycee AI Audio Engine Auto-Installer
echo ========================================================
echo   KAYCEE CEP: 1-CLICK AI AUDIO ENGINE AUTO-INSTALLER
echo ========================================================
echo.
echo Installing Python, FFmpeg, and AI dependencies...
echo Please wait a moment until the process finishes.
echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0setup-engine.ps1"
echo.
echo ========================================================
echo Process finished. You can now close this window.
echo ========================================================
pause

