@echo off
chcp 65001 >nul
title 宿舍匹配 - 数据库初始化

echo ═══════════════════════════════════════
echo   初始化数据库
echo ═══════════════════════════════════════
echo.

set MYSQL_USER=root
set MYSQL_PASS=root123
set MYSQL_HOST=localhost
set MYSQL_PORT=3306

echo [1/5] 创建数据库...
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% < "%~dp0backend\src\main\resources\db\init.sql" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 数据库初始化失败，可能已存在或 MySQL 未启动
    echo 请检查:
    echo   1. MySQL 是否在运行
    echo   2. 用户名密码是否正确 (当前: %MYSQL_USER%/%MYSQL_PASS%)
)

echo [2/5] 导入问卷题目...
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% dorm_match < "%~dp0backend\src\main\resources\db\seed.sql" 2>nul

echo [3/5] 导入宿舍资源...
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% dorm_match < "%~dp0backend\src\main\resources\db\seed_dorm.sql" 2>nul

echo [4/5] 导入测试学生...
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% dorm_match < "%~dp0backend\src\main\resources\db\seed_student.sql" 2>nul

echo [5/5] 导入测试问卷答案...
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% dorm_match < "%~dp0backend\src\main\resources\db\seed_answers.sql" 2>nul

echo.
echo ═══════════════════════════════════════
echo   数据库初始化完成
echo ═══════════════════════════════════════
echo.
echo 测试账号: 20240001 / 123456
echo.

pause
