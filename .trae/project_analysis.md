# 新生宿舍舍友自主选择系统 (dorm-match) — 项目理解文档

> 生成日期：2026-05-22 | 基于全部源代码的全面分析

---

## 一、项目概述

**dorm-match** 是一个面向高校的**新生宿舍舍友自主选择系统**。核心流程为：学生完成偏好问卷 → 系统智能匹配舍友 → 学生搜索/邀请心仪同学组团配对 → 管理员执行宿舍分配 → 学生查看分配结果并确认或提出异议。

### 核心角色

| 角色 | 功能 |
|------|------|
| **学生 (STUDENT)** | 填写偏好问卷、查看舍友推荐、搜索/邀请同学、组团配对、查看分配结果、提交异议 |
| **学校管理员 (ADMIN)** | 数据统计仪表盘、学校/学院/专业/班级管理、学生管理、问卷管理、宿舍楼/房间管理、算法分配执行、分配结果发布/确认、异议处理、审计日志 |
| **平台开发者 (DEVELOPER)** | 跨学校管理（开发者后台）、系统公告管理、用户反馈管理、管理员账号管理 |

---

## 二、技术栈

### 前端 (当前主力)
| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | ^3.4.27 | 前端框架（Composition API + `<script setup>`） |
| **TypeScript** | ~5.4.5 | 类型系统 |
| **Element Plus** | ^2.7.4 | UI 组件库（中文 locale） |
| **Vite** | ^5.2.11 | 构建工具 |
| **Pinia** | ^2.1.7 | 状态管理 |
| **Vue Router** | ^4.3.2 | 路由（Hash 模式） |
| **ECharts** | ^5.5.0 | 可视化图表（vue-echarts） |
| **Axios** | ^1.7.2 | HTTP 请求（当前仅用于基础封装，实际 API 已迁移到 Supabase） |
| **Supabase JS** | ^2.105.4 | 后端即服务 SDK |
| **Sass** | ^1.77.2 | CSS 预处理器 |

### 后端 (两套架构并存)
| 架构 | 状态 | 技术 |
|------|------|------|
| **Supabase** (当前主力) | 生产使用 | PostgreSQL + Auth + RLS，区域 `ap-southeast-1` (Singapore) |
| **Java Spring Boot** (旧架构) | 仅本地开发用，已废弃 | Spring Boot + MyBatis Plus + MySQL + Redis + JWT + Knife4j |

### 部署
| 组件 | 平台 | 说明 |
|------|------|------|
| **前端** | GitHub Pages | 静态部署，`https://sy25255.github.io/dorm-match/` |
| **后端/数据库** | Supabase 免费版 | 500MB 数据库、5万月活用户 |
| **CI/CD** | GitHub Actions | push master → 自动构建部署 |
| **测试** | Playwright (Python) | 自动化 E2E 测试 |

---

## 三、项目文件组织

```
d:\Trae\Trae CN\88\
├── frontend/                          # Vue 前端源码（主力目录）
│   ├── index.html                     # 入口 HTML（含 Cache-Control 禁用缓存）
│   ├── package.json                   # 依赖与脚本
│   ├── vite.config.ts                 # Vite 构建配置
│   ├── tsconfig.json                  # TypeScript 配置
│   ├── tsconfig.node.json             # Node 端 TS 配置
│   ├── .env                           # Supabase 连接凭证（不提交 git）
│   ├── .env.example                   # 环境变量模板
│   ├── scripts/
│   │   └── seed-test-users.js         # 测试用户种子脚本
│   └── src/
│       ├── main.ts                    # 应用入口（挂载 Vue、Pinia、Router、ElementPlus）
│       ├── App.vue                    # 根组件（仅含 <router-view>）
│       ├── env.d.ts                   # Vite 环境变量类型声明
│       ├── auto-imports.d.ts          # 自动导入类型（自动生成）
│       ├── components.d.ts            # 组件自动注册类型（自动生成）
│       ├── lib/
│       │   └── supabase.ts            # Supabase 客户端初始化 + 工具函数
│       ├── router/
│       │   └── index.ts               # 路由配置（Hash 模式，schoolCode 参数化）
│       ├── store/
│       │   └── user.ts                # Pinia 用户状态（含 Supabase 登录/注册/免登录）
│       ├── api/
│       │   ├── request.ts             # Axios 封装（10秒超时，baseURL: /api）
│       │   ├── auth.ts                # 认证 API（signUp/signIn/signOut）
│       │   ├── survey.ts              # 问卷 API（CRUD + 进度 + 草稿）
│       │   ├── match.ts               # 匹配 API（推荐/搜索/详情/学生问卷）
│       │   ├── invite.ts              # 邀请 + 配对 + 分配（学生端）API
│       │   ├── school.ts              # 学校/学院/专业/班级 API
│       │   ├── student.ts             # 学生 API（个人信息）
│       │   ├── admin.ts               # 管理后台全部 API
│       │   └── notification.ts        # 通知 API
│       ├── mock/
│       │   └── data.ts                # 全部 Mock 数据（约 250 行）
│       ├── styles/
│       │   └── global.css             # 全局样式
│       └── views/
│           ├── SchoolEntry.vue        # 学校编码入口页
│           ├── Login.vue              # 登录/注册页
│           ├── Layout.vue             # 学生端布局（侧栏+顶栏）
│           ├── Home.vue               # 首页（步骤引导）
│           ├── Survey.vue             # 偏好问卷（分节填写，核心页面）
│           ├── Matches.vue            # 舍友推荐/搜索/邀请
│           ├── MatchDetail.vue        # 匹配详情
│           ├── Search.vue             # 搜索舍友（级联筛选）
│           ├── Invites.vue            # 邀请管理
│           ├── Pairing.vue            # 我的配对
│           ├── Allocation.vue         # 宿舍分配结果
│           ├── Profile.vue            # 个人信息
│           ├── Notifications.vue      # 消息中心
│           ├── Feedback.vue           # 建议反馈
│           ├── NotFound.vue           # 404 页面
│           └── admin/
│               ├── AdminLayout.vue    # 管理后台布局
│               ├── Statistics.vue     # 数据统计（ECharts）
│               ├── SchoolManage.vue   # 学校管理（学院/专业/班级）
│               ├── Students.vue       # 学生管理
│               ├── SurveyManage.vue   # 问卷管理
│               ├── Dormitory.vue      # 宿舍管理（楼栋/房间）
│               ├── AllocationManage.vue # 分配管理（执行/发布/确认）
│               ├── Objections.vue     # 异议处理
│               ├── FeedbackManage.vue # 反馈与异议
│               ├── AuditLogs.vue      # 审计日志
│               ├── DeveloperLayout.vue    # 开发者后台布局
│               ├── DeveloperDashboard.vue # 开发者仪表盘（平台总览）
│               ├── DeveloperSchools.vue   # 开发者-学校管理
│               ├── DeveloperAdmins.vue    # 开发者-管理员账号
│               ├── DeveloperFeedbacks.vue # 开发者-用户反馈
│               └── DeveloperNotifications.vue # 开发者-系统公告
├── backend/                           # Java 后端（已废弃，仅本地调试用）
│   ├── pom.xml                        # Maven 配置
│   └── src/main/
│       ├── java/com/dormmatch/
│       │   ├── DormMatchApplication.java
│       │   ├── common/ (Result, BusinessException, GlobalExceptionHandler)
│       │   ├── config/ (SecurityConfig, JwtUtil, RedisConfig, MyBatisPlusConfig)
│       │   ├── controller/ (Survey, Match, Invite, Auth, Allocation, Student, Admin)
│       │   ├── dto/ (LoginRequest, LoginResponse, SurveySubmitRequest, etc.)
│       │   ├── entity/ (11 个 JPA 实体)
│       │   ├── mapper/ (13 个 MyBatis Mapper)
│       │   └── service/ (5 个 Service 及其 Impl)
│       └── resources/
│           ├── application.yml        # Spring Boot 配置（端口 8088, MySQL, Redis）
│           └── db/ (init.sql, seed.sql, seed_answers.sql, seed_dorm.sql, seed_student.sql)
├── .github/workflows/
│   └── deploy.yml                     # GitHub Actions CI/CD
├── push-to-github.bat                 # 一键推送脚本（已 .gitignore）
├── startup.bat                        # 启动脚本
├── start-server.bat                   # 服务端启动脚本
├── open-firewall.bat                  # 防火墙配置
├── init-db.bat                        # 数据库初始化
├── CHANGELOG.md                       # 更新日志
├── 新生宿舍舍友自主选择系统_项目计划书.md  # 项目计划书
└── .trae/
    ├── rules/
    │   └── project_rules.md           # 项目规则文件（AI 必须遵循）
    └── project_analysis.md            # 本文档
```

---

## 四、核心架构决策

### 4.1 路由设计

- **Hash 模式** (`createWebHashHistory()`)：适配 GitHub Pages 静态部署，URL 格式为 `#/DEMO-UNI/login`
- **学校编码参数化**：所有核心路由均为 `/:schoolCode/xxx`，通过 schoolCode 区分多学校数据
- **路由层级**：
  ```
  /                              → SchoolEntry.vue (学校编码入口)
  /:schoolCode/login             → Login.vue (登录/注册)
  /:schoolCode/                  → Layout.vue → Home.vue (学生首页)
  /:schoolCode/survey            → Layout.vue → Survey.vue (问卷)
  /:schoolCode/matches           → Layout.vue → Matches.vue (推荐)
  /:schoolCode/matches/:targetId  → Layout.vue → MatchDetail.vue (详情)
  /:schoolCode/search            → Layout.vue → Search.vue (搜索)
  /:schoolCode/invites           → Layout.vue → Invites.vue (邀请)
  /:schoolCode/pairing           → Layout.vue → Pairing.vue (配对)
  /:schoolCode/allocation        → Layout.vue → Allocation.vue (分配)
  /:schoolCode/profile           → Layout.vue → Profile.vue (个人信息)
  /:schoolCode/notifications     → Layout.vue → Notifications.vue (通知)
  /:schoolCode/feedback          → Layout.vue → Feedback.vue (反馈)
  /:schoolCode/admin/xxx         → AdminLayout.vue → 管理后台子页面
  /dev/xxx                       → DeveloperLayout.vue → 开发者后台子页面
  ```

### 4.2 路由守卫 (`beforeEach`)

- **会话恢复**：首次访问自动调用 `userStore.restoreSession()` 从 Supabase 恢复登录态
- **schoolCode 校验**：路径中的 schoolCode 与 localStorage 存储的 schoolCode 不一致时清空并重定向
- **角色权限控制**：
  - `meta.guest`：已登录用户跳转首页
  - `meta.admin`：非 ADMIN/DEVELOPER 角色跳转学生首页
  - `meta.dev`：仅 DEVELOPER 角色可访问
- **自动补全 schoolCode**：无 schoolCode 的路由自动补全

### 4.3 状态管理 (Pinia — `useUserStore`)

核心状态字段：
- `token` / `refreshToken`：Supabase JWT session token
- `userId`：Supabase auth user UUID
- `username` / `role` / `schoolCode` / `schoolName`

核心方法：
- `supabaseLogin()`：邮箱+密码登录 → 写入 profile → 持久化
- `supabaseRegister()`：注册新账号 → 创建 profile → 写入状态
- `restoreSession()`：页面刷新时从 Supabase auth cookie 恢复会话
- `guestLogin()`：免登录测试（创建 `is_guest: true` 的临时用户）
- `guestReLogin()`：免登录恢复
- `logout()`：注销 + 清除本地存储

### 4.4 多租户隔离

通过 **schoolCode** 实现学校间数据隔离：
- 前端：路由参数 `schoolCode` → 存储到 localStorage → 所有 API 调用携带 sc 过滤
- 后端 (Supabase)：所有表包含 `school_code` 字段 + RLS 策略约束

---

## 五、数据架构 (Supabase)

### 5.1 数据库表结构（17 张表）

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `schools` | 学校（多租户核心） | code, name, status |
| `profiles` | 用户扩展（关联 auth.users） | id(UUID), school_code, student_no, name, role, gender, survey_status, match_status, is_guest, college_name, major_name, class_name, hometown, bio, avatar_url, smoking, snoring, leader_score |
| `colleges` | 学院 | id, school_code, name, code, sort_order |
| `majors` | 专业 | id, school_code, college_id, name, code |
| `classes` | 班级 | id, major_id, name, grade, school_code |
| `survey_questions` | 问卷题目 | id, question_code, dimension, question_text, question_type, options_json, is_required, is_attention_check, status, sort_order, trap_answer, trap_section, leader_weight |
| `survey_sections` | 问卷分节配置 | key, title, desc, color, question_ids |
| `survey_answers` | 问卷答案 | user_id, question_id, answer_value (联合唯一) |
| `invites` | 邀请 | from_user_id, to_user_id, school_code, message, status, expires_at |
| `pair_groups` | 配对组 | id, school_code, status, capacity |
| `pair_members` | 配对成员 | group_id, user_id, is_initiator |
| `dormitory_buildings` | 宿舍楼 | id, school_code, name, code |
| `dormitory_rooms` | 宿舍房间 | id, building_id, school_code, room_number, capacity, occupied, status, floor |
| `allocations` | 分配结果 | user_id, room_id, room_number, bed_no, allocation_type, batch_code, status |
| `allocation_objections` | 异议 | school_code, user_id, reason, status, handler_id, review_comment, resolved_at |
| `notifications` | 通知 | user_id, title, content, is_read, type |
| `audit_logs` | 审计日志 | school_code, user_id, username, action, target_type, target_id, detail |
| `invite_codes` | 邀请码 | school_code, code, is_used |

### 5.2 RLS 安全策略
- 所有表启用 Row Level Security
- 同校学生互相可见，跨校数据完全隔离
- 管理员只能操作本校数据
- auth.users 由 Supabase 自动管理

### 5.3 Supabase 客户端配置

```typescript
// src/lib/supabase.ts
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'dorm-match-auth',
  },
})
```

---

## 六、核心功能模块分析

### 6.1 问卷系统 (Survey)

**是系统最复杂、最核心的模块。**

#### 题目结构（~100题）
题目覆盖维度：
- **SLEEP**：6 题（起床、就寝、午休、规律、安静要求、统一作息）
- **HYGIENE**：8 题（洗澡、整理、打扫、容忍度、垃圾桶、通风、换洗、公共区域反应）
- **STUDY**：5 题（时段、环境、地点、小组学习、噪音容忍）
- **HOBBY**：10 题（运动、音乐、游戏、阅读、影视、户外、音量、宠物、美食、二次元）
- **SOCIAL**：6 题（社交频率、接待朋友、独处时间、集体活动、矛盾处理、舍友问题帮助）
- **SPENDING**：4 题（月消费、AA制、分享物品、空调温度）
- **PERSONALITY**：11 题（聚会表现、结识新人、压力应对、情绪、新事物、不满表达、让步、计划性、氛围期望、性取向、同性恋态度）
- **PSYCHOLOGY**：12 题（价值观判断：保护孩子 vs 动物、救人 vs 霸凌者、人 vs 宠物地位、孝顺、人 vs 动物生命、人性善恶、弱者同情、生命意义、种族平等、男女友谊、岳飞、电车难题、台湾归属）
- **LIFESTYLE**：7 题（抽烟、打呼噜、喝酒、省份、民族、自媒体拍摄）
- **EXTENSION**：2 题（学习计划、自媒体拍摄）
- **ATTENTION**：3 题（注意力检测题）
- **TRAP**：11 题（防无效验证题，分散在各分区）
- **领导力题**：2 题（内嵌于 PERSONALITY 和 SPENDING，含 leaderScore）

#### 题目类型
- `SINGLE_CHOICE`：单选题
- `MULTI_CHOICE`：多选题
- `LIKERT5`：五点量表
- `VALUE_JUDGE`：价值观判断题
- `DROPDOWN`：下拉选择（省份、民族）
- `LONG_TEXT`：长文本

#### 问卷分节（12 节）
| 节 | 颜色 | 题目数 | 说明 |
|----|------|--------|------|
| 基础信息 | #1890ff | 5 | 抽烟/打呼噜/喝酒/省份/民族 |
| 生活作息 | #722ed1 | 7 | SLEEP题 + 1道TRAP |
| 卫生习惯 | #13c2c2 | 9 | HYGIENE题 + 1道TRAP |
| 学习习惯 | #52c41a | 6 | STUDY题 + 1道TRAP |
| 兴趣爱好 | #fa8c16 | 11 | HOBBY题 + 1道TRAP |
| 社交偏好 | #eb2f96 | 7 | SOCIAL题 + 1道TRAP |
| 消费观念 | #faad14 | 5 | SPENDING题 + 1道TRAP |
| 性格特征 | #2f54eb | 11 | PERSONALITY题 + TRAP |
| 注意力检测 | #f5222d | 3 | ATTN专用题 |
| 价值观判断 | #a0d911 | 13 | PSYCHOLOGY题 + TRAP |
| 扩展信息 | #5b8c00 | 2 | 学习计划/自媒体 |
| 自我介绍 | #595959 | 0 | 自由填写 |

#### 草稿机制
- 每切换节自动保存草稿（`survey_answers.upsert`）
- 提交时才将 `profiles.survey_status` 设为 `COMPLETED`
- 路由离开时弹窗确认

### 6.2 智能匹配算法

匹配度计算核心位于 [admin.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\admin.ts) 的 `executeAllocation()` 方法中：

```
算法流程：
1. 拉取所有已完成问卷的学生和他们的答案
2. 构建每个学生的 answerMap (questionId → answerValue)
3. 相似度计算函数 calcSimilarity：
   - 对两个学生所有共同题目的答案值做差值绝对值求和
   - similarity = 1 - totalDiff / (count * 4)  // 假设最大差值 scale 为 4
4. 贪心分组：
   - 从待分配列表取一个"锚点"学生
   - 计算所有剩余学生与锚点的相似度
   - 取前 (roomCapacity-1) 人组成一组
   - 重复直到所有学生分配完毕
5. 按组分配到宿舍房间（按 room 顺序填充床位）
```

匹配推荐计算（[match.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\match.ts)）使用相同算法，但是一对一计算而非分组。

### 6.3 配对系统

- 学生可通过搜索 + 发送邀请组成配对
- 邀请状态：`0=待处理`、`1=已接受`、`2=已拒绝`、`3=已撤回`
- 邀请 72 小时过期
- 额度控制：每人最多发出 10 个邀请
- 配对组 (`pair_groups`) 记录配对关系

### 6.4 宿舍分配系统

管理员操作流程：
1. 配置宿舍楼和房间（`dormitory_buildings` + `dormitory_rooms`）
2. 执行分配算法（`executeAllocation`）→ 生成 `allocations` 记录
3. 预览结果
4. 发布（`PUBLISHED`）→ 学生可见
5. 确认（`FINALIZED`）→ 锁定不可改

分配类型：`ALGORITHM`（算法自动）或 `MANUAL`（人工调整）

### 6.5 异议处理

- 学生在分配结果页面提交异议（`allocation_objections`，含原因描述和附件链接）
- 管理员查看异议列表 → 处理（`APPROVED`/`REJECTED`）
- 处理后发送系统通知

### 6.6 通知系统

- 被动通知：邀请、配对、分配状态变更时自动创建
- 学生端顶栏显示未读数量（红色 Badge）
- 支持全部标记已读

### 6.7 审计日志

- 所有管理操作记录到 `audit_logs`
- 字段：操作人、操作类型、目标类型、目标ID、详情、时间
- 管理后台可查询和分页浏览

---

## 七、API 层分析

### 7.1 架构演变

项目 API 层经历了从 Mock → Axios 代理 → Supabase 直连的演变：

1. **初期**：`request.ts` (Axios) + `handleMock()` 拦截器（100+ API 端点），支持 GitHub Pages 无后端运行
2. **中期**：引入 Java Spring Boot 后端（端口 8088，通过 Vite proxy `/api` → `localhost:8088`）
3. **当前**：完全迁移到 Supabase 直连，所有 API 文件直接调用 `supabase.from('table').select()` 等方法

### 7.2 当前 API 文件清单

| 文件 | 对应模块 | 调用方式 |
|------|---------|---------|
| [auth.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\auth.ts) | 认证 | `supabase.auth.signUp/signInWithPassword/signOut` |
| [survey.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\survey.ts) | 问卷 | `supabase.from('survey_questions/survey_answers/profiles')` |
| [match.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\match.ts) | 匹配推荐/搜索 | `supabase.from('profiles/survey_answers')` + 前端相似度计算 |
| [invite.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\invite.ts) | 邀请/配对/分配(学生端) | `supabase.from('invites/pair_groups/pair_members/allocations')` |
| [school.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\school.ts) | 学校层级 | `supabase.from('schools/colleges/majors/classes')` |
| [student.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\student.ts) | 学生信息 | `supabase.from('profiles')` |
| [admin.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\admin.ts) | 管理后台 | 全部 Supabase 表操作（含分配算法实现） |
| [notification.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\notification.ts) | 通知 | `supabase.from('notifications')` |

### 7.3 统一响应格式

所有 API 返回通过 `wrap()` 函数包装：
```typescript
const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })
```

### 7.4 请求层

[request.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\request.ts) 目前仅保留基础 Axios 配置（15 秒超时，baseURL: `/api`），实际未被业务代码使用。所有业务 API 已迁移到 Supabase 直连。

---

## 八、Mock 数据体系（已退化为备用方案）

`src/mock/data.ts` 约 250 行，包含完整种子数据：

| 变量 | 说明 |
|------|------|
| `mockQuestions` | ~100 道问卷题目 |
| `mockSurveySections` | 12 节分节配置 |
| `mockStudents` | 5 名演示学生（含 4 名测试账号） |
| `mockAllStudents` | 5 名完整信息学生（管理后台用） |
| `mockSchools/mockColleges/mockMajors/mockClasses` | 学校层级数据（6 学院 13 专业） |
| `mockRecommendations` | 已清空（早期 demo 数据） |
| `mockQuota` | 邀请额度 |
| `mockSchoolConfig` | 学校配置 |

**当前状态**：由于已迁移到 Supabase，Mock 机制仅作为 Supabase 不可用时的后备方案（如 SchoolEntry 验证失败时 fallback 到 `getSchoolByCode`）。

---

## 九、构建与部署

### 9.1 Vite 配置关键点

```typescript
// vite.config.ts
base: '/dorm-match/'                    // GitHub Pages 子路径
server.proxy: { '/api': 'http://localhost:8088' }  // 本地开发代理（已废弃）
```

- 自动导入插件：`unplugin-auto-import` + `unplugin-vue-components` + ElementPlusResolver
- 自定义插件 `build-timestamp`：注入构建时间 meta 标签

### 9.2 构建命令

```json
"build": "vite build"       // 跳过 vue-tsc 类型检查
"dev": "vite"               // 本地开发服务器
"seed": "node scripts/seed-test-users.js"  // 种子数据
```

**重要**：不能添加 `vue-tsc --noEmit` 到 build 命令，因为 GitHub Actions 环境缺少类型声明文件。

### 9.3 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
触发条件: push master 分支
构建步骤:
  1. checkout 代码 (actions/checkout@v4)
  2. 安装 Node.js 18 (actions/setup-node@v4)
  3. cd frontend && npm ci && npm run build
  4. 上传 dist 目录 (actions/upload-pages-artifact@v3)
  5. 部署到 GitHub Pages (actions/deploy-pages@v4)
```

### 9.4 部署后刷新

GitHub Pages 的 Service Worker 可能缓存旧版本，用户需 `Ctrl+F5` 强制刷新才能获取最新代码。

---

## 十、免登录测试机制

为了便于测试和演示，系统实现了免登录功能：

1. **Guest Login**：无需邮箱/密码，输入姓名 + 选择学院/专业即可创建临时账号
2. **实现方式**：使用 `supabase.auth.signUp()` 创建账户（密码固定为 `Guest2024!`），profile 标记 `is_guest: true`
3. **会话持久化**：免登录信息存入 localStorage (`guest_account`)
4. **重建登录**：同一用户可通过 `guestReLogin()` 恢复会话
5. **清理**：管理员可通过 `cleanupGuests` RPC 清理过期测试账号

---

## 十一、已知问题与约束

### 不可修改的配置
1. `vite.config.ts` 的 `base` 必须为 `/dorm-match/`
2. Router 必须使用 `createWebHashHistory`
3. 不能在 build 命令中添加 `vue-tsc --noEmit`
4. 所有路由必须包含 `schoolCode` 参数
5. 不能在代码中硬编码 Token 或密码

### 已知 Bug / 注意事项
1. Element Plus `el-tag` 的 `:type` 不能为空字符串
2. Vue `<script setup>` 中 `setTimeout` 需用箭头函数包装
3. locale 导入必须用 `element-plus/es/locale/lang/zh-cn`
4. GitHub Pages 返回 HTML 404/405 时需检测 HTML 响应（`isHtmlError`）
5. `push-to-github.bat` 已被 `.gitignore` 忽略（含敏感 token）
6. `SchoolEntry.vue` catch 块显示"无法连接服务器"通常是浏览器缓存问题

---

## 十二、页面预览缓存策略

`index.html` 设置了强制不缓存：
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

---

## 十三、后端迁移路线图

| 阶段 | 平台 | 说明 |
|------|------|------|
| 当前 | Supabase 免费版 | PostgreSQL + Auth + RLS |
| 未来 | 腾讯云/阿里云 | 需要微信/支付宝支付、国内低延迟时迁移 |
| 迁移方式 | SQL Dump 导入 | 数据不丢失，前端仅替换连接信息 |

---

## 十四、关键文件索引

| 文件 | 用途 | 重要性 |
|------|------|--------|
| [.trae/rules/project_rules.md](file:///d:\Trae\Trae CN\88\.trae\rules\project_rules.md) | AI 行为规则（必读） | ⭐⭐⭐⭐⭐ |
| [frontend/src/router/index.ts](file:///d:\Trae\Trae CN\88\frontend\src\router\index.ts) | 路由与权限守卫 | ⭐⭐⭐⭐⭐ |
| [frontend/src/store/user.ts](file:///d:\Trae\Trae CN\88\frontend\src\store\user.ts) | 用户状态管理 | ⭐⭐⭐⭐⭐ |
| [frontend/src/lib/supabase.ts](file:///d:\Trae\Trae CN\88\frontend\src\lib\supabase.ts) | Supabase 客户端 | ⭐⭐⭐⭐⭐ |
| [frontend/src/api/admin.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\admin.ts) | 管理后台 API（含分配算法） | ⭐⭐⭐⭐ |
| [frontend/src/api/match.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\match.ts) | 匹配推荐 API | ⭐⭐⭐⭐ |
| [frontend/src/api/survey.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\survey.ts) | 问卷 API | ⭐⭐⭐⭐ |
| [frontend/src/mock/data.ts](file:///d:\Trae\Trae CN\88\frontend\src\mock\data.ts) | Mock 数据 | ⭐⭐⭐ |
| [frontend/src/views/Survey.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\Survey.vue) | 问卷页面（最复杂页面） | ⭐⭐⭐⭐ |
| [frontend/vite.config.ts](file:///d:\Trae\Trae CN\88\frontend\vite.config.ts) | Vite 构建配置 | ⭐⭐⭐ |
| [.github/workflows/deploy.yml](file:///d:\Trae\Trae CN\88\.github\workflows\deploy.yml) | CI/CD 部署 | ⭐⭐⭐ |
| [backend/src/main/resources/application.yml](file:///d:\Trae\Trae CN\88\backend\src\main\resources\application.yml) | 旧后端配置（参考） | ⭐⭐ |

---

## 十五、技术难点与潜在风险

1. **算法运行位置**：匹配算法在**前端**执行（浏览器端），当学生数量较大时需要拉取所有问卷答案，可能有性能瓶颈。未来应迁移到 Supabase Edge Functions 或数据库存储过程。

2. **Supabase 免费额度限制**：500MB 数据库、5万月活用户。超出后需付费或迁移。

3. **跨域与 subpath 部署**：GitHub Pages 子路径 `/dorm-match/` 要求所有资源路径正确配置，base 路径错误会导致白屏。

4. **RLS 复杂性**：17 张表的权限策略需要精确配置，策略冲突可能导致数据泄露或无法访问。

5. **问卷复杂度**：100+ 题、11 种题型、12 节，前端渲染和状态管理复杂，草稿保存逻辑需保证数据一致性。

6. **多角色权限**：STUDENT / ADMIN / DEVELOPER 三级角色，路由守卫 + API 权限需双重保障。

7. **免登录安全**：Guest 用户使用固定密码，需通过 `is_guest` 标记限制权限，防止越权。

8. **缓存问题**：GitHub Pages 的 Service Worker 可能导致用户看到旧版本，需持续关注缓存策略。

---

## 十六、项目规则文件一致性验证报告

> 以下是对 `.trae/rules/project_rules.md` 与代码实现逐条交叉验证的结果。

### 16.1 验证通过项 ✅

| # | 规则内容 | 代码验证结果 |
|---|---------|------------|
| 1 | 路由使用 `createWebHashHistory()` | [router/index.ts#L5](file:///d:\Trae\Trae CN\88\frontend\src\router\index.ts) 确认 `createWebHashHistory()` |
| 2 | `base: '/dorm-match/'` | [vite.config.ts#L9](file:///d:\Trae\Trae CN\88\frontend\vite.config.ts) 确认 `/dorm-match/` |
| 3 | `build: "vite build"`（不含 `vue-tsc --noEmit`） | [package.json#L8](file:///d:\Trae\Trae CN\88\frontend\package.json) 确认为 `vite build` |
| 4 | 所有路由为 `/:schoolCode/xxx` | [router/index.ts#L14-L69](file:///d:\Trae\Trae CN\88\frontend\src\router\index.ts) 确认全部包含 schoolCode |
| 5 | locale 用 `element-plus/es/locale/lang/zh-cn` | [main.ts#L5](file:///d:\Trae\Trae CN\88\frontend\src\main.ts) 确认正确导入 |
| 6 | SchoolEntry → 验证编码 → localStorage → 跳转登录 | [SchoolEntry.vue#L16-L66](file:///d:\Trae\Trae CN\88\frontend\src\views\SchoolEntry.vue) 确认流程 |
| 7 | `push-to-github.bat` 已被 `.gitignore` | [.gitignore#L14](file:///d:\Trae\Trae CN\88\.gitignore) 确认 |
| 8 | 无硬编码 Token 或密码 | 全量搜索 `ghp_`/`eyJ`/`GIT_TOKEN` → 无匹配 |
| 9 | Supabase 客户端配置 | [supabase.ts#L10-L16](file:///d:\Trae\Trae CN\88\frontend\src\lib\supabase.ts) 确认 autoRefreshToken + persistSession |
| 10 | `.env` 在 `.gitignore` 中 | [.gitignore#L16-L18](file:///d:\Trae\Trae CN\88\.gitignore) 确认 `.env` / `.env.local` 均已忽略 |

### 16.2 不一致 / 已过期项 ⚠️

#### ❌ 严重不一致 #1：Mock 系统规则已完全过时

**规则描述**（[project_rules.md#L102-L145](file:///d:\Trae\Trae CN\88\.trae\rules\project_rules.md)）:
```
## 无后端 Mock 运行机制
`request.ts` 是核心文件，实现了完整的 mock 数据拦截：
- 响应拦截器检测 HTML 页面 → 触发 `handleMock()` 
- 错误拦截器检测 ERR_NETWORK / ERR_CONNREFUSED → 触发 `handleMock()`
- `isDemoMode()`：当 token 以 `demo-token-` 开头时也触发 mock
- 支持 100+ API 端点
```

**实际代码**（[request.ts](file:///d:\Trae\Trae CN\88\frontend\src\api\request.ts)）：
```typescript
// 仅 9 行代码，无任何拦截器/mock逻辑
import axios from 'axios'
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
export default request
```

**影响**：
- `handleMock()`、`isDemoMode()`、`isHtmlError` 等函数**已全部被删除**
- 所有业务 API 已迁移到 Supabase SDK 直连，不再经过 Axios
- 没有任何文件 `import request from '@/api/request'`
- Mock 数据 `src/mock/data.ts` 仍存在但仅作为 Supabase 不可用时的 fallback（仅 SchoolEntry 使用）

> **建议**：将「无后端 Mock 运行机制」章节标记为 `[已废弃]` 并替换为 Supabase 直连说明。

---

#### ❌ 严重不一致 #2：`invite_codes` 表未被列入规则

**代码引用**（[admin.ts#L105-L118](file:///d:\Trae\Trae CN\88\frontend\src\api\admin.ts)）：
```typescript
// getInviteCodes() → supabase.from('invite_codes').select('*')
// generateInviteCode() → supabase.from('invite_codes').insert(...)
```

**规则列出 17 张表**（[project_rules.md#L201-L217](file:///d:\Trae\Trae CN\88\.trae\rules\project_rules.md)）：不含 `invite_codes`。

> **建议**：补充 `invite_codes` 为第 18 张表。

---

#### ⚠️ 中度不一致 #3：`survey_sections` 表未被代码使用

**规则列出**：`survey_sections — 问卷分节配置`

**实际代码**：Survey.vue 通过 `buildSections()` 方法动态生成分节（[Survey.vue#L170-L219](file:///d:\Trae\Trae CN\88\frontend\src\views\Survey.vue)），根据 question 的 `dimension` 字段 + `dimOrder` 硬编码分组。完全不查询 `survey_sections` 表。

**全量 grep 结果**：`survey_sections` 在 `src/` 中 0 次引用。

> **建议**：标注 `survey_sections` 为「可选/预留表，当前未使用」或直接从列表移除。

---

#### ⚠️ 中度不一致 #4：CI/CD 缺少 Supabase 环境变量说明

**deploy.yml** 不包含任何 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 环境变量注入。而 [supabase.ts#L7](file:///d:\Trae\Trae CN\88\frontend\src\lib\supabase.ts) 在缺少时会 `throw Error`。

实际能够成功部署说明这些变量已配置为 GitHub Repository Secrets 或 Variables，但**规则文件中完全没有提及此配置要求**。

> **建议**：添加 CI/CD 环境变量配置说明。

---

### 16.3 遗漏的约束与组件 📋

以下页面/组件存在于代码中但**未在规则文件目录中列出**：

| 遗漏文件 | 路径 | 说明 |
|---------|------|------|
| `Feedback.vue` | [views/Feedback.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\Feedback.vue) | 学生端建议反馈页 |
| `FeedbackManage.vue` | [views/admin/FeedbackManage.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\FeedbackManage.vue) | 管理端反馈与异议 |
| `DeveloperLayout.vue` | [views/admin/DeveloperLayout.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperLayout.vue) | 开发者后台布局 |
| `DeveloperDashboard.vue` | [views/admin/DeveloperDashboard.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperDashboard.vue) | 开发者仪表盘 |
| `DeveloperSchools.vue` | [views/admin/DeveloperSchools.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperSchools.vue) | 开发者-学校管理 |
| `DeveloperAdmins.vue` | [views/admin/DeveloperAdmins.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperAdmins.vue) | 开发者-管理员账号 |
| `DeveloperFeedbacks.vue` | [views/admin/DeveloperFeedbacks.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperFeedbacks.vue) | 开发者-用户反馈 |
| `DeveloperNotifications.vue` | [views/admin/DeveloperNotifications.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\admin\DeveloperNotifications.vue) | 开发者-系统公告 |
| `NotFound.vue` | [views/NotFound.vue](file:///d:\Trae\Trae CN\88\frontend\src\views\NotFound.vue) | 404 页面 |

以下架构元素在规则中遗漏：

| 遗漏项 | 说明 |
|--------|------|
| **DEVELOPER 角色** | 路由守卫中有 `meta.dev` 权限控制和 `/dev` 路由（[router/index.ts#L53-L64](file:///d:\Trae\Trae CN\88\frontend\src\router\index.ts#L53-L64)），规则未提及 |
| **`/dev` 路由系统** | 独立的开发者后台（`/dev/schools`、`/dev/admins`、`/dev/feedbacks`、`/dev/notifications`） |
| **免登录 Guest 机制** | 规则提到了「演示模式」但未描述 Supabase Guest 登录的具体实现（固定密码 `Guest2024!`、`is_guest` 标记） |
| **`cleanupGuests` RPC** | [admin.ts#L411](file:///d:\Trae\Trae CN\88\frontend\src\api\admin.ts) 调用的 Supabase 存储过程，规则未提及 |
| **`seed-test-users.js` 脚本** | [scripts/seed-test-users.js](file:///d:\Trae\Trae CN\88\frontend\scripts\seed-test-users.js) 存在但规则未提及 |
| **`demo_room_capacity` localStorage key** | [Matches.vue#L32-L35](file:///d:\Trae\Trae CN\88\frontend\src\views\Matches.vue) 使用的本地存储键 |
| **Vite 自动导入插件** | `unplugin-auto-import` + `unplugin-vue-components` 规则未提及 |
| **`@element-plus/icons-vue` 全局注册** | [main.ts#L13-L15](file:///d:\Trae\Trae CN\88\frontend\src\main.ts) 全量注册所有图标 |
| **路由守卫 sessionRestored 防重复** | [router/index.ts#L73-L89](file:///d:\Trae\Trae CN\88\frontend\src\router\index.ts) 的 `sessionRestored` 一次性标记 |
| **`.trae/rules/project_rules.md` 路径** | 规则文件自身路径在目录中写错了（写的是 `.trae/rules/project_rules.md` 但实际就是该文件） |

---

### 16.4 潜在风险点 🚨

| # | 风险 | 严重度 | 详情 |
|---|------|--------|------|
| 1 | **CI/CD 无 Supabase 密钥注入** | 🔴 高 | deploy.yml 不包含 `env` 块传入 `VITE_SUPABASE_*`，如果 GitHub Secrets 未配置则构建会因 `throw Error` 失败。规则应明确说明需要设置。 |
| 2 | **匹配算法在前端执行** | 🔴 高 | `executeAllocation()` 拉取所有学生答案在浏览器端做相似度计算，学生数 > 500 时可能 OOM 或超时。 |
| 3 | **Mock 规则误导开发者** | 🟡 中 | 规则中 45 行的 Mock 运行机制描述已完全过时，新开发者按规则理解会去找不存在的 `handleMock()` 函数。 |
| 4 | **数据表清单不完整** | 🟡 中 | 缺少 `invite_codes` 表，多了未使用的 `survey_sections`，可能导致后端开发者创建错误的表结构。 |
| 5 | **DEVELOPER 角色权限未在规则说明** | 🟡 中 | 路由守卫和开发者后台页面的权限逻辑未文档化，管理员不清楚 DEVELOPER 与 ADMIN 的区别。 |
| 6 | **`.env` 真实凭证暴露风险** | 🟡 中 | `.env` 虽在 `.gitignore` 中，但文件仍存在且包含真实 Supabase URL 和 ANON_KEY。如有人误操作 `git add -f`，凭证会泄露。 |
| 7 | **删除文件的残留规则** | 🟢 低 | 规则提到 `push-to-github.bat`（已忽略）、`handleMock()`（已删除）、`isDemoMode()`（已删除），易引起困惑。 |

---

### 16.5 修复建议汇总

| 优先级 | 操作 | 涉及文件 |
|--------|------|---------|
| 🔴 P0 | 废弃「Mock 运行机制」章节，替换为 Supabase SDK 直连说明 | project_rules.md |
| 🔴 P0 | 补充 `invite_codes` 为第 18 张表 | project_rules.md |
| 🔴 P0 | 添加 CI/CD 环境变量 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 配置说明 | project_rules.md |
| 🟡 P1 | 标注 `survey_sections` 为「当前未使用」 | project_rules.md |
| 🟡 P1 | 补充 DEVELOPER 角色与 `/dev` 路由系统说明 | project_rules.md |
| 🟡 P1 | 补充免登录 Guest 机制的完整描述 | project_rules.md |
| 🟡 P1 | 补充 Feedback.vue、NotFound.vue、全部 Developer*.vue 到目录 | project_rules.md |
| 🟢 P2 | 补充 `seed-test-users.js`、`cleanupGuests` RPC、`demo_room_capacity` 说明 | project_rules.md |
| 🟢 P2 | 修正 `.trae/rules/project_rules.md` 的自引用路径 | project_rules.md |