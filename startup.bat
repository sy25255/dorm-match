@echo off
chcp 65001 >nul
title 新生宿舍舍友自主选择系统 - 启动菜单

:menu
cls
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   新生宿舍舍友自主选择系统 v1.0            ║
echo ║   启动菜单                                 ║
echo ╠══════════════════════════════════════════════╣
echo ║                                             ║
echo ║  [1] 一键部署 (构建+启动全部服务)           ║
echo ║  [2] 仅构建前端                             ║
echo ║  [3] 仅启动前端服务器                       ║
echo ║  [4] 仅启动 ngrok 隧道                      ║
echo ║  [5] 初始化数据库 (导入种子数据)            ║
echo ║  [6] 微信域名校验助手                       ║
echo ║  [7] 开放防火墙端口                         ║
echo ║  [Q] 退出                                   ║
echo ║                                             ║
echo ╚══════════════════════════════════════════════╝
echo.

set "CHOICE="
set /p "CHOICE=请选择 [1-7/Q]: "

if /i "%CHOICE%"=="1" goto deploy
if /i "%CHOICE%"=="2" goto build
if /i "%CHOICE%"=="3" goto start_server
if /i "%CHOICE%"=="4" goto start_ngrok
if /i "%CHOICE%"=="5" goto init_db
if /i "%CHOICE%"=="6" goto wechat_verify
if /i "%CHOICE%"=="7" goto firewall
if /i "%CHOICE%"=="Q" goto end
goto menu

:deploy
echo.
echo 正在一键部署...
call "%~dp0deploy.bat"
goto menu

:build
echo.
echo 正在构建前端...
set "PATH=%~dp0nodejs;%PATH%"
cd /d "%~dp0frontend"
call .\node_modules\.bin\vite.cmd build
if %ERRORLEVEL% EQU 0 (
    echo [成功] 前端构建完成
) else (
    echo [失败] 前端构建出错，请检查日志
)
pause
goto menu

:start_server
echo.
echo 正在启动前端服务器...
start "DormMatch-Server" cmd /c "title 宿舍匹配-前端服务器 && "%~dp0nodejs\node.exe" "%~dp0frontend\server.js""
echo [信息] 服务器已在后台启动 (端口 3333)
echo        浏览器访问: http://127.0.0.1:3333/
timeout /t 2 /nobreak >nul
goto menu

:start_ngrok
call "%~dp0start-ngrok.bat"
goto menu

:init_db
echo.
echo 正在执行数据库初始化...
echo 请确保 MySQL 正在运行 (root/root123)
call "%~dp0init-db.bat"
pause
goto menu

:wechat_verify
call "%~dp0setup-wechat-verify.bat"
goto menu

:firewall
call "%~dp0open-firewall.bat"
goto menu

:end
echo 再见!
