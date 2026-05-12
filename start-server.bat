@echo off
chcp 65001 >nul
title 宿舍选择系统 - 服务器

set NODE=%~dp0nodejs\node.exe
set SERVER=%~dp0frontend\server.js

:check
if not exist "%NODE%" (
    echo [ERROR] Node.js 未找到: %NODE%
    pause
    exit
)
if not exist "%SERVER%" (
    echo [ERROR] server.js 未找到: %SERVER%
    echo 请先运行: cd frontend ^&^& npm run build
    pause
    exit
)

echo ========================================
echo   新生宿舍舍友自主选择系统 v1.0
echo   服务器: http://127.0.0.1:3333
echo   自动重启已启用 - 崩溃后5秒自动恢复
echo   按 Ctrl+C 两次可完全退出
echo ========================================

:loop
echo.
echo [%date% %time%] 服务启动中...
"%NODE%" "%SERVER%"

echo [%date% %time%] 服务已退出，5秒后自动重启...
timeout /t 5 /nobreak >nul
goto loop
