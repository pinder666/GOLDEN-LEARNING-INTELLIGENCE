@echo off
REM One click: generates the three pipe keys and buries them in both apps.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-pipe-secrets.ps1"
pause
