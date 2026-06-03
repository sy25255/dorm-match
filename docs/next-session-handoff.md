# 下一会话交接说明

## 当前状态

- 线上入口：`https://dormmatch.cn/#/`
- 前端部署：GitHub Pages + 自定义域名。
- 后端：Supabase Auth + PostgreSQL + RLS。
- `20260602_platform_school_creation.sql` 已在 Supabase SQL Editor 执行，RPC 已验证存在。
- 已清理旧规则文件，并精简 `.trae/rules/project_rules.md`。
- 学生注册学院/专业/班级改动和交接文档更新均已推送到 GitHub `master`；如需最新哈希，以 `git log --oneline -5` 为准。
- GitHub Actions `Deploy frontend to GitHub Pages` 已成功完成，线上已包含学生注册学院/专业/班级字段。
- 线上已验证 `profiles.college_name`、`profiles.major_name`、`profiles.class_name` 字段可读。
- 已用学校 A 的新学生注册链路完成线上验证：邀请码校验、学院/专业/班级级联读取、注册、`profiles` 写入、密码登录均通过。

## 已创建的演示学校

- 学校 A：`DEMO-A-2026`
- 学校 B：`DEMO-B-2026`

## 已配置的演示学校基础数据

学校 A：

- 学院：信息科学技术学院、经济管理学院
- 专业：计算机科学与技术、软件工程、工商管理
- 班级：计科2601班、计科2602班、软件2601班、工管2601班

学校 B：

- 学院：工程学院、文理学院
- 专业：机械工程、电气工程、应用心理学
- 班级：机械2601班、电气2601班、心理2601班

## 演示老师邮箱

- 老师 A：`demo.teacher.a@dormmatch.cn`
- 老师 B：`demo.teacher.b@dormmatch.cn`

老师账号已绑定为对应学校管理员。不要在项目文档中记录登录密码。

## 学生邀请码

- 学校 A 学生邀请码：`STU-A-2026`
- 学校 B 学生邀请码：`STU-B-2026`

已验证两个学校编码和两个学生邀请码都能被 Supabase 识别。

## 下一步

1. 新开 Trae/Codex 会话后先阅读本文件。
2. 学生注册页如仍显示旧内容，先强制刷新浏览器缓存。
3. 继续跑问卷、邀请组队、管理员分配宿舍流程。
4. 用学校 B 重复完整学生流程，确认数据不会跨学校串联。
5. 如需要完整迁移记录，在 Supabase SQL Editor 复核或执行 `20260603_profiles_academic_fields.sql`；该迁移是幂等字段保障。
