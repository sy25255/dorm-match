# 新生宿舍舍友自主选择系统 (dorm-match)

## 项目概述
供高校使用的新生宿舍舍友自主选择系统。学生完成偏好问卷后，系统智能匹配舍友，支持搜索/邀请同学、组团配对、宿舍分配。管理员端包含数据统计、学校管理、学生管理、问卷管理、宿舍管理、分配管理、异议处理、审计日志。

## 技术栈
- 前端：Vue 3 + TypeScript + Element Plus + Vite + Pinia + ECharts
- 后端：**Supabase**（PostgreSQL + Auth + RLS），替代旧 mock 数据方案
- 部署：**GitHub Pages**（前端静态部署）+ **Supabase**（数据库 & 认证云服务）
- 自动化测试：Playwright (Python)

## 后端迁移规划（Supabase → 未来腾讯云/阿里云）
### 当前阶段：Supabase 免费版
- **用途**：真实数据库 + 用户认证，支持多人同时使用
- **免费额度**：500MB 数据库、5万月活用户、不绑卡、不花钱
- **区域**：Southeast Asia (Singapore) — `ap-southeast-1`
- **前端 SDK**：`@supabase/supabase-js`
- **核心模块**：
  - `src/lib/supabase.ts` — Supabase 客户端初始化（Project URL + anon key）
  - Auth：`signUp()` / `signInWithPassword()` 替代 mock token
  - 数据库：直接查询 PostgreSQL，替代 `handleMock()` 拦截器
  - RLS：Row Level Security 实现学校间数据天然隔离

### 未来阶段：收费功能上线后迁移到腾讯云/阿里云
- **触发条件**：产品需要向用户收费、需要微信/支付宝支付集成、需要国内更低延迟
- **迁移方式**：Supabase 导出完整 SQL dump → 导入腾讯云 PostgreSQL / 阿里云 RDS
- **数据不会丢失**：所有数据可一键导出，不绑定平台
- **前端代码改动量小**：只需替换 supabase 客户端连接信息

## 已部署网站
- **地址**：https://sy25255.github.io/dorm-match/
- **仓库**：https://github.com/sy25255/dorm-match
- **用户**：sy25255
- **推送 master 分支 → GitHub Actions 自动构建部署**

## 项目目录
```
d:\Trae\Trae CN\88\
  frontend/                  - Vue 前端源码
    scripts/
      seed-test-users.js     - 测试用户种子脚本
    src/
      lib/supabase.ts        - Supabase 客户端初始化 + 工具函数
      api/request.ts         - axios 基础封装（当前未被业务代码引用）
      api/auth.ts            - 登录相关 API
      api/school.ts          - 学校/学院/专业/班级 API
      api/survey.ts          - 问卷 API
      api/match.ts           - 匹配 API（含前端相似度计算）
      api/invite.ts          - 邀请/配对/分配（学生端）
      api/student.ts         - 学生 API
      api/admin.ts           - 管理员 API（含分配算法执行）
      api/notification.ts    - 通知 API
      mock/data.ts           - Mock 种子数据（仅 Supabase 不可用时 fallback）
      router/index.ts        - 路由（Hash 模式，schoolCode 参数化）
      store/user.ts          - 用户状态（含 Supabase 登录/注册/免登录）
      views/                 - 页面
        SchoolEntry.vue      - 学校编码入口
        Login.vue            - 登录/注册页（含免登录）
        Layout.vue           - 学生端布局
        Home.vue             - 首页
        Survey.vue           - 偏好问卷（分节填写，核心页面）
        Matches.vue          - 舍友匹配推荐 / 搜索 / 邀请
        MatchDetail.vue      - 匹配详情
        Search.vue           - 搜索舍友（学院/专业/班级级联）
        Invites.vue          - 邀请管理
        Pairing.vue          - 我的配对
        Allocation.vue       - 宿舍分配结果
        Profile.vue          - 个人信息
        Notifications.vue    - 消息中心
        Feedback.vue         - 建议反馈
        NotFound.vue         - 404 页面
      views/admin/           - 管理后台
        AdminLayout.vue      - 后台布局
        Statistics.vue       - 数据统计
        SchoolManage.vue     - 学校管理
        Students.vue         - 学生管理
        SurveyManage.vue     - 问卷管理
        Dormitory.vue        - 宿舍管理
        AllocationManage.vue - 宿舍分配
        FeedbackManage.vue   - 反馈与异议
        AuditLogs.vue        - 审计日志
      views/admin/           - 开发者后台（跨学校管理）
        DeveloperLayout.vue      - 开发者后台布局
        DeveloperDashboard.vue   - 平台总览
        DeveloperSchools.vue     - 学校管理
        DeveloperAdmins.vue      - 管理员账号
        DeveloperFeedbacks.vue   - 用户反馈
        DeveloperNotifications.vue - 系统公告
  backend/                   - Java 后端（已废弃，仅本地用）
  .github/workflows/deploy.yml - CI/CD
  .trae/rules/project_rules.md - 本规则文件
```

## 关键架构决策
- **路由**：`createWebHashHistory()`（Hash 模式，`#/DEMO-UNI/login` 形式）
- **学校编码参数化**：所有路由为 `/:schoolCode/xxx`，通过 schoolCode 区分学校
- **boot 入口**：`SchoolEntry.vue` → 输入 schoolCode → API 验证 → 存入 localStorage → 跳转登录
- **登录**：`Login.vue` 支持邮箱登录、新生注册、免登录模式（Guest Login，Supabase 自动注册临时账号）
- **权限**：`router.beforeEach` 根据 token 和 role 控制访问
  - `STUDENT`：仅学生端（`/:schoolCode/xxx`）
  - `ADMIN`：学校管理后台（`/:schoolCode/admin/xxx`）
  - `DEVELOPER`：跨学校开发者后台（`/dev/xxx`，独立路由）
- **会话恢复**：路由守卫首次访问时调用 `userStore.restoreSession()` 从 Supabase auth cookie 恢复登录态
- **问卷分节**：Survey.vue 通过 `buildSections()` 动态生成分节（根据 question.dimension 分组），不使用 `survey_sections` 数据库表
- **匹配算法**：在浏览器端执行（`admin.ts` `executeAllocation()`），基于问卷答案差值绝对值做相似度计算 + 贪心分组

## vite.config.ts 关键配置
```ts
base: '/dorm-match/'          // GitHub Pages 子路径必须
server.proxy: { '/api': 'http://localhost:8088' }  // 本地开发代理
```

## 构建命令
```json
"build": "vite build"          // 跳过 vue-tsc 类型检查（GitHub Actions 不需要）
```
⚠️ 不要改成 `"vue-tsc --noEmit && vite build"`，GitHub Actions 上类型错误会导致构建失败。

## Supabase SDK 直连机制（当前方案）
**所有业务 API 已迁移到 Supabase SDK 直连**，不再通过 Axios 拦截器。`request.ts` 已简化为仅保留基础 Axios 配置（当前未被业务代码引用）。

### 直连模式
- 所有 API 文件（`src/api/*.ts`）直接调用 `supabase.from('表名').select/insert/update/delete()`
- 使用 Supabase Auth SDK 的 `signUp()` / `signInWithPassword()` / `signOut()` / `getSession()`
- 响应统一通过 `wrap()` 包装为 `{ data: { code: 200, message: 'ok', data } }` 格式
- RLS 策略在数据库层自动过滤，前端无需额外处理

### Mock 数据备用方案（已废弃为 fallback）
> ⚠️ 以下机制已不再作为主要运行模式，仅作为 Supabase 不可用时的应急 fallback。

`src/mock/data.ts` 保留了种子数据，但 Mock 拦截器（`handleMock`/`isDemoMode`/`isHtmlError`）已从 `request.ts` 中移除。当前仅在 [SchoolEntry.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\SchoolEntry.vue) 的学校验证 Supabase 查询失败时，fallback 到 `getSchoolByCode()` 动态导入。

Mock 数据结构：
- `mockQuestions` / `mockSurveySections` — 问卷题目和分节（约 100 题，12 节）
- `mockStudents` / `mockAllStudents` — 演示学生数据
- `mockSchools` / `mockColleges` / `mockMajors` / `mockClasses` — 学校层级数据
- 其他 mock 数据（推荐/配对/分配/通知/统计等）已清空或设为空数组

## 免登录测试机制（Guest Login）
为便于测试和演示，系统实现了免登录功能：

1. **入口**：Login.vue 提供"免登录体验"按钮 → 填写姓名 + 选择学院/专业
2. **实现**：`userStore.guestLogin()` 使用 `supabase.auth.signUp()` 自动创建临时账号（密码固定 `Guest2024!`），profile 标记 `is_guest: true`
3. **持久化**：账号信息存入 localStorage (`guest_account`)，刷新页面后可通过 `guestReLogin()` 恢复
4. **清理**：管理员可通过 Supabase RPC `cleanup_guest_users()` 批量清理过期测试账号（调用入口：`adminApi.cleanupGuests()`）
5. **权限限制**：Guest 用户 role 为 `STUDENT`，功能与正常学生一致，但可被管理员批量清理

### 其他 localStorage 键
- `guest_account` — 免登录账号信息（JSON）
- `demo_survey_section` — 问卷当前节索引
- `demo_survey_intro` — 问卷自我介绍草稿
- `demo_survey_supplements` — 问卷补充说明
- `demo_room_capacity` — 演示模式房间容量
- `remembered_email` — 记住的登录邮箱
- `dev_referrer` — 开发者后台来源标记

## 演示编码
| 编码 | 学校名称 |
|------|---------|
| DEMO-UNI | 示范大学 |
| TEST | 测试学院 |
| BJ-UNI | 北京大学 |
| SH-UNI | 上海大学 |

## 已知问题 & 修复历史
1. ✅ `el-tag` 的 `:type` 不能为空字符串 `''`，Element Plus 类型为 `'success'|'warning'|'info'|'danger'|'primary'`
2. ✅ `setTimeout(fn, ms)` 在 Vue `<script setup>` 模板中有类型问题，需用箭头函数包装
3. ✅ locale 导入必须用 `element-plus/es/locale/lang/zh-cn`（不是 `dist/locale/zh-cn.mjs`）
4. ✅ GitHub Pages 返回 HTML 404/405 页面时的错误处理
5. ✅ `push-to-github.bat` 不能包含明文 Token（安全风险）
6. ✅ Mock 拦截器已从 `request.ts` 移除，迁移到 Supabase SDK 直连
7. ⚠️ 匹配算法在浏览器端执行（`executeAllocation()`），大量学生时需关注性能
8. ⚠️ 前端构建时需要 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 环境变量，GitHub Actions 需预先配置

## 修改后部署流程（由 AI 自动执行）
**AI 每次改完代码后，必须自动执行 git 提交和推送，不要叫用户操作。**

仓库地址: https://github.com/sy25255/dorm-match
Token: 使用安全的 GIT_TOKEN 环境变量或从 secure 存储中获取

推送命令：
```bash
cd "d:\Trae\Trae CN\88"
git add -A
git commit -m "描述修改内容"
git push https://$env:GIT_TOKEN@github.com/sy25255/dorm-match.git master
```

推送后 GitHub Actions 自动构建部署（约 30 秒），网站生效：
https://sy25255.github.io/dorm-match/ （用户需 Ctrl+F5 刷新）

**推送完成后，必须告知用户网站地址，格式如下：**
> 网站已更新：https://sy25255.github.io/dorm-match/ （Ctrl+F5 刷新）

## 重要规则
- **不要修改 vite.config.ts 的 `base` 配置**（必须是 `/dorm-match/`）
- **不要修改 router 的 history 模式**（必须是 `createWebHashHistory`）
- **不要在生产代码中添加 `vue-tsc --noEmit`**（GitHub Actions 没有类型声明文件）
- **不要硬编码路由路径而不用 `schoolCode`**（所有路由都是 `/:schoolCode/xxx`）
- **永远不要在代码中硬编码 Token 或密码**
- **不要删除或破坏 `src/mock/data.ts` 的数据结构**（作为 Supabase 不可用时的应急 fallback）
- **添加到 `src/api/` 的新 API 必须使用 Supabase SDK 直连模式**，响应通过 `wrap()` 统一包装
- **前端匹配算法性能上限**：`executeAllocation()` 在浏览器端执行，学生数 > 500 时需迁移到 Supabase Edge Functions

## Supabase 配置
### 获取凭证
在 Supabase Dashboard → Project Settings → API 中获取：
- **Project URL**：`https://xxxxx.supabase.co`
- **anon public key**：以 `eyJ...` 开头的长字符串

### 环境变量配置
> ⚠️ **CI/CD 部署必须配置以下环境变量**，否则构建时 [supabase.ts](file:///d:\Trae\Trae CN\88\frontend\src\lib\supabase.ts) 会 `throw Error`。

**本地开发**（`frontend/.env`）：
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

**GitHub Actions 部署**：在 GitHub 仓库 → Settings → Secrets and variables → Actions → Repository secrets 中添加：
- `VITE_SUPABASE_URL` — Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon public key

并在 [deploy.yml](file:///d:\Trae\Trae CN\88\.github\workflows\deploy.yml) 构建步骤中添加：
```yaml
- name: Install and Build
  run: |
    cd frontend
    npm ci
    npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

`.env` 文件已在 `.gitignore` 中排除，不会被提交到仓库。

### 数据库表结构（18 张表）
1. `schools` — 学校（多租户核心）
2. `profiles` — 用户扩展（关联 auth.users）
3. `colleges` — 学院
4. `majors` — 专业
5. `classes` — 班级
6. `survey_questions` — 问卷题目
7. `survey_sections` — 问卷分节配置（**预留，当前未使用**；分节由 Survey.vue 根据 question.dimension 动态生成）
8. `survey_answers` — 问卷答案
9. `invites` — 邀请
10. `invite_codes` — 邀请码（管理员生成，用于学生注册）
11. `pair_groups` — 配对组
12. `pair_members` — 配对成员
13. `dormitory_buildings` — 宿舍楼
14. `dormitory_rooms` — 宿舍房间
15. `allocations` — 分配结果
16. `allocation_objections` — 异议
17. `notifications` — 通知
18. `audit_logs` — 审计日志

### RLS 安全策略
- 所有表启用 Row Level Security
- 同校学生互相可见，跨校数据完全隔离
- 管理员只能操作本校数据

## 常用调试命令
```bash
# 本地启动前端（需要 Node.js）
cd frontend && npm run dev
# 推送代码
双击 push-to-github.bat
# 查看 Git 日志
git log --oneline -5
# 查看 Git 状态
git status
```
