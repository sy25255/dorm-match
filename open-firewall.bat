@echo off
echo ========================================
echo   宿舍匹配系统 - 防火墙端口放行工具
echo ========================================
echo.
echo 正在放行 3333 端口 (静态服务器)...
netsh advfirewall firewall add rule name="DormMatch-3333" dir=in action=allow protocol=TCP localport=3333 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] 3333 端口已放行
) else (
    echo [FAIL] 3333 端口放行失败，请右键"以管理员身份运行"本脚本
)

echo.
echo 正在放行 5173 端口 (Vite 开发服务器)...
netsh advfirewall firewall add rule name="DormMatch-5173" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] 5173 端口已放行
) else (
    echo [FAIL] 5173 端口放行失败，请右键"以管理员身份运行"本脚本
)

echo.
echo 正在放行 8088 端口 (Java 后端)...
netsh advfirewall firewall add rule name="DormMatch-8088" dir=in action=allow protocol=TCP localport=8088 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] 8088 端口已放行
) else (
    echo [FAIL] 8088 端口放行失败，请右键"以管理员身份运行"本脚本
)

echo.
echo ========================================
echo   完成！现在可以测试小程序了
echo ========================================
pause
