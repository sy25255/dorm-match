# 上线前 Supabase 迁移

## 必须先执行

在 Supabase SQL Editor 中执行：

1. `supabase/migrations/20260602_platform_school_creation.sql`
2. `supabase/migrations/20260603_profiles_academic_fields.sql`
3. `supabase/migrations/20260603_invite_pairing_public_survey_rpc.sql`
4. `supabase/migrations/20260603_student_roster_login.sql`

执行完成后，平台开发者后台的“添加学校”才可以正常创建学校编码，并同步生成管理员激活记录。
学生正式登录流程以 `student_rosters` 学校名册为准；学生邀请码和邮箱注册只保留为旧入口。

## 验证

1. 使用开发者账号进入平台后台。
2. 打开“学校管理”，点击“添加学校”。
3. 填写学校名称、简称、管理员邮箱。
4. 保存后确认页面显示学校编码和管理员激活信息。
5. 使用该学校编码进入本校登录页，老师使用自己的邮箱登录后进入管理后台。
6. 在“学生管理”导入学生名册，学生用学号和初始码完成首次激活。

## 注意

- 不要在聊天、文档或公开页面中记录登录密码、Token、API Key 或数据库连接串。
- 学校编码只用于进入学校区域，不是权限凭证。
- 管理员权限由管理员激活记录控制。
- 学生正式登录权限由学校导入的 `student_rosters` 名册控制。
