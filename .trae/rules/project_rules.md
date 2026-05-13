# 新生宿舍舍友自主选择系统 (dorm-match)

## 项目概述
供高校使用的新生宿舍舍友自主选择系统。学生完成偏好问卷后，系统智能匹配舍友，支持搜索/邀请同学、组团配对、宿舍分配。管理员端包含数据统计、学校管理、学生管理、问卷管理、宿舍管理、分配管理、异议处理、审计日志。

## 技术栈
- 前端：Vue 3 + TypeScript + Element Plus + Vite + Pinia + ECharts
- 后端：Java Spring Boot（仅本地开发用，GitHub Pages 部署时使用 mock 数据）
- 部署：**GitHub Pages**（纯前端静态部署，无后端）
- 自动化测试：Playwright (Python)

## 已部署网站
- **地址**：https://sy25255.github.io/dorm-match/
- **仓库**：https://github.com/sy25255/dorm-match
- **用户**：sy25255
- **推送 master 分支 → GitHub Actions 自动构建部署**

## 项目目录
```
d:\Trae\Trae CN\88\
  frontend/                  - Vue 前端源码
    src/
      api/request.ts         - axios 封装 + mock 数据拦截器（核心）
      api/auth.ts            - 登录相关 API
      api/school.ts          - 学校/学院/专业/班级 API
      api/survey.ts          - 问卷 API
      api/match.ts           - 匹配 API
      api/invite.ts          - 邀请 API
      api/student.ts         - 学生 API
      api/admin.ts           - 管理员 API
      api/notification.ts    - 通知 API
      mock/data.ts           - 全部 mock 数据（题目/学生/学校/宿舍等）
      router/index.ts        - 路由（Hash 模式，schoolCode 参数化）
      store/user.ts          - 用户状态（含 demoLogin）
      views/                 - 页面
        SchoolEntry.vue      - 学校编码入口
        Login.vue            - 登录/注册页（演示模式按钮）
        Layout.vue           - 学生端布局
        Home.vue             - 首页
        Survey.vue           - 偏好问卷（分节填写）
        Matches.vue          - 舍友匹配推荐
        MatchDetail.vue      - 匹配详情
        Search.vue           - 搜索舍友（学院/专业/班级级联）
        Invites.vue          - 邀请管理
        Pairing.vue          - 我的配对
        Allocation.vue       - 宿舍分配结果
        Profile.vue          - 个人信息
        Notifications.vue    - 消息中心
      views/admin/           - 管理后台
        AdminLayout.vue      - 后台布局
        Statistics.vue       - 数据统计
        SchoolManage.vue     - 学校管理
        Students.vue         - 学生管理
        SurveyManage.vue     - 问卷管理
        Dormitory.vue        - 宿舍管理
        AllocationManage.vue - 宿舍分配
        Objections.vue       - 异议处理
        AuditLogs.vue        - 审计日志
  backend/                   - Java 后端（仅本地用）
  .github/workflows/deploy.yml - CI/CD
  push-to-github.bat         - 一键推送脚本
  .trae/rules/project_rules.md - 本规则文件
```

## 关键架构决策
- **路由**：`createWebHashHistory()`（Hash 模式，`#/DEMO-UNI/login` 形式）
- **学校编码参数化**：所有路由为 `/:schoolCode/xxx`，通过 schoolCode 区分学校
- **boot 入口**：`SchoolEntry.vue` → 输入 schoolCode → API 验证 → 存入 localStorage → 跳转登录
- **登录**：`Login.vue` 支持学号登录、新生注册、演示模式（一键登录）
- **权限**：`router.beforeEach` 根据 token 和 role 控制访问，ADMIN 可进入 `/admin` 路由

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

## 无后端 Mock 运行机制
`request.ts` 是核心文件，实现了完整的 mock 数据拦截：

1. **本地有后端时**：请求通过 Vite proxy 转发到 `localhost:8088`，返回真实 JSON
2. **GitHub Pages 无后端时**：
   - 响应拦截器检测 HTML 页面 → 触发 `handleMock()` 
   - 错误拦截器检测 `ERR_NETWORK` / `ERR_CONNREFUSED` / `ERR_BAD_RESPONSE` / **HTML 响应** → 触发 `handleMock()`
   - `isDemoMode()`：当 token 以 `demo-token-` 开头时也触发 mock
3. **handleMock()** 根据 URL 和方法匹配 mock 数据，覆盖所有 API 端点

**支持的 API 端点**（全部有 mock）：
- `/school/validate` - 学校验证
- `/auth/login` / `/auth/refresh` - 认证
- `/survey/questions` / `/survey/progress` / `/survey/draft` / `/survey/submit` - 问卷
- `/match/calculate` / `/match/recommendations` / `/match/search` / `/match/detail/:id` - 匹配
- `/invite/send` / `/invite/quota` / `/invite/received` / `/invite/sent` / 接受/拒绝/撤回 - 邀请
- `/student/:id` / `/student/profile` - 学生
- `/school/colleges` / `/school/majors` / `/school/classes` - 级联查询
- `/allocation/my` / `/allocation/objections` / `/allocation/objection` / `/allocation/confirm` - 分配
- `/notification/list` / `/notification/unread-count` / 标记已读 - 通知
- `/admin/students` / `/admin/students/import` / 编辑/禁用 - 学生管理
- `/admin/school/config` / colleges / majors / classes - 学校管理
- `/admin/survey/questions` / 编辑/切换/删除 - 问卷管理
- `/admin/dormitory/buildings` / rooms - 宿舍管理
- `/admin/allocation/execute` / publish / finalize / results - 分配管理
- `/admin/objections` / 处理 - 异议处理
- `/admin/statistics` - 统计
- `/admin/audit-logs` - 审计日志

## Mock 数据模块 (`src/mock/data.ts`)
核心数据结构：
- `mockQuestions` - 完整问卷题目（约 80+ 题，覆盖 SLEEP/HYGIENE/STUDY/HOBBY/SOCIAL/SPENDING/PERSONALITY/PSYCHOLOGY/TRAP/ATTENTION 等维度）
- `mockSurveySections` - 问卷分节配置（12 节）
- `mockStudents` - 16 名演示学生
- `mockAllStudents` - 22 名演示学生（管理后台用，含邮箱/电话/问卷状态/匹配状态）
- `mockRecommendations` - 6 条推荐匹配结果
- `mockPairing` / `mockPairingMembers` - 配对数据
- `mockAllocation` - 当前学生分配结果（M1-101）
- `mockSchools` / `mockColleges` / `mockMajors` / `mockClasses` - 学校层级数据
- `mockDormBuildings` / `mockDormRooms` - 宿舍楼和房间
- `mockAllocations` / `mockAllObjections` - 管理员分配/异议数据
- `mockStatistics` - 仪表盘统计数据
- `mockNotifications` - 通知
- `mockAuditLogs` - 审计日志

导入方式：`const mod = await import('@/mock/data')`（动态导入，不打包到初始 bundle）

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
4. ✅ GitHub Pages 返回 HTML 404/405 页面时，请求拦截器需要 `isHtmlError` 检测
5. ✅ `push-to-github.bat` 不能包含明文 Token（安全风险）
6. ⚠️ `SchoolEntry.vue` 的 `catch` 块第 33 行显示「无法连接服务器」，实际是 mock 拦截成功后的 fallback 消息。如果用户看到这个，通常是浏览器缓存了旧 JS，按 `Ctrl+F5` 强制刷新即可。

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
- **修改 mock 数据时保持 `data.ts` 结构完整**，不要破坏 `handleMock()` 的 URL 匹配逻辑
- **添加到 request.ts 的新 API 必须同时添加 mock 处理逻辑**
- **永远不要在代码中硬编码 Token 或密码**，`push-to-github.bat` 已被 `.gitignore` 忽略

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
