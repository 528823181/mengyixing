@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Mengyixing local preview / 蒙益行本地预览
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8123
if errorlevel 1 powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8124
echo.
echo   Preview stopped. / 预览已停止，按任意键关闭。
pause >nul
