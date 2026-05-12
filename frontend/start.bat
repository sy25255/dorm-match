@echo off
chcp 65001 >nul
title 宿舍匹配 - 前端静态服务器
echo.
echo ═══════════════════════════════════════
echo   启动前端静态服务器 (端口 3333)
echo ═══════════════════════════════════════
echo.
cd /d "%~dp0"
"..\nodejs\node.exe" server.js
pause
