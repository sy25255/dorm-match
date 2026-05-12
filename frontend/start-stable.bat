@echo off
chcp 65001 >nul
title 宿舍匹配 - 生产预览 (端口 80)
echo.
echo ═══════════════════════════════════════
echo   启动生产预览模式
echo   端口: 80 (需要管理员权限)
echo ═══════════════════════════════════════
echo.
cd /d "%~dp0"
"..\nodejs\node.exe" node_modules\vite\bin\vite.js preview --host 0.0.0.0 --port 80
pause
