@echo off
chcp 65001 >nul
echo ============================================
echo   Dorm-Match Supabase 一键初始化
echo ============================================
echo.
echo 正在打开 Supabase SQL Editor...
start "" "https://supabase.com/dashboard/project/dhzxxqilzvpxdsamukdv/sql/new"
echo.
echo 正在打开 SQL 脚本文件...
start notepad "frontend\supabase_schema.sql"
echo.
echo ============================================
echo   请按以下步骤操作：
echo ============================================
echo.
echo   [1] 在记事本中: Ctrl+A (全选) → Ctrl+C (复制)
echo   [2] 在浏览器 SQL Editor 中: Ctrl+V (粘贴) → Ctrl+Enter (执行)
echo   [3] 等待执行完毕，看到 "Success" 即完成
echo.
echo   然后还需要关闭邮箱验证：
echo   浏览器 → Authentication → Providers → Email
echo   → 取消勾选 "Confirm email" → Save
echo.
echo ============================================
pause