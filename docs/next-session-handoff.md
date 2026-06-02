# 下一会话交接说明

## 当前状态

- 线上入口：`https://dormmatch.cn/#/`
- 前端部署：GitHub Pages + 自定义域名。
- 后端：Supabase Auth + PostgreSQL + RLS。
- `20260602_platform_school_creation.sql` 已在 Supabase SQL Editor 执行，RPC 已验证存在。
- 已清理旧规则文件，并精简 `.trae/rules/project_rules.md`。
- 本地提交 `2663302 Clean up project rule files` 已完成，但推送 GitHub 因网络失败。

## 已创建的演示学校

- 学校 A：`DEMO-A-2026`
- 学校 B：`DEMO-B-2026`

## 演示老师邮箱

- 老师 A：`demo.teacher.a@dormmatch.cn`
- 老师 B：`demo.teacher.b@dormmatch.cn`

老师密码由用户在登录/注册页面自己设置，或按新会话规则处理。

## 学生邀请码

- 学校 A 学生邀请码：`STU-A-2026`
- 学校 B 学生邀请码：`STU-B-2026`

已验证两个学校编码和两个学生邀请码都能被 Supabase 识别。

## 下一步

1. 网络恢复后执行 `git push origin master`。
2. 新开 Trae/Codex 会话后先阅读本文件。
3. 用老师 A 注册/登录并绑定为 `DEMO-A-2026` 管理员。
4. 用 `STU-A-2026` 注册多个学生，跑问卷、邀请组队、管理员分配宿舍流程。
5. 用学校 B 重复测试，确认数据不会跨学校串联。
