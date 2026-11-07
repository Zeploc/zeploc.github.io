@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Capture-Devices.ps1" %*
