# 项目修改日志

## 2026-05-22

### 1. 免登录：专业改为学院+专业级联下拉选择
- **文件**: `src/views/Login.vue`, `src/store/user.ts`
- **改动**: 免登录弹窗的"专业"从手动输入改为"学院"下拉 + "专业"下拉（级联联动）
- **默认数据**: 计算机学院（计算机科学/软件工程）、经管学院（工商管理/会计学），优先从 Supabase 拉取
- **后果**: 用户可以快速选择学院和专业而无需手动打字，数据更规范

### 2. 免登录：记住账号，下次免密码重新登录
- **文件**: `src/store/user.ts`, `src/views/Login.vue`
- **改动**: 免登录账号信息（邮箱/姓名/学院/专业）存入 localStorage，使用固定密码 `Guest2024!`
- **新增方法**: `getGuestAccount()`, `guestReLogin(email)`, `clearGuestAccount()`
- **后果**: 用户下次点击"免登录测试进入"会自动恢复上次账号，无需重新填写

### 3. 登录页：显示管理员和开发者测试账号
- **文件**: `src/views/Login.vue`
- **改动**: 登录页底部新增可折叠的"测试账号"区域
- **后果**: 用户可以看到 admin@demo.com / Admin123! 和 dev@demo.com / Dev123! 测试账号

### 4. 修复：管理后台 API 方法名不匹配（致命 Bug）
- **文件**: `src/api/admin.ts`, `src/views/admin/*.vue`
- **问题**: 管理后台 4 个页面调用了不存在的 API 方法名
  - AllocationManage.vue: `getAllocationResults` → 不存在
  - Students.vue: `toggleStudent`, `createStudent`, `updateStudent` → 不存在
  - SurveyManage.vue: `createQuestion` → 不存在
  - Dormitory.vue: 引用废弃的 `AxiosResponse` 类型
- **修复**: 新增 10 个 API 方法 + 3 个兼容别名 + 移除废弃类型
- **后果**: 管理后台功能现在可用（之前白屏/报错）

### 5. 创建 admin/dev 测试账号
- **改动**: 在 Supabase Auth 中创建 admin@demo.com (Admin123!) 和 dev@demo.com (Dev123!) 账号
- **后果**: 能用这些账号登录测试管理后台和开发者平台

### 6. 安全修复：移除 Git remote 中暴露的个人访问令牌
- **问题**: `git remote -v` 显示 `https://ghp_bfb15...@github.com/...`，Token 明文暴露
- **修复**: `git remote set-url origin https://github.com/sy25255/dorm-match.git`
- **后果**: Token 不再在本地 Git 配置中暴露（需要在 push 时手动输入或使用 credential helper）

### 7. GitHub Pages 404 回退
- **文件**: `frontend/public/404.html`（新增）
- **改动**: 添加 404.html 处理 SPA 路由回退，GitHub Pages 不存在的路径自动重定向到主页
- **后果**: 用户直接访问子路径（非 hash 路由）不再看到 GitHub 默认 404 页面

### 8. 缓存问题修复
- **文件**: `frontend/index.html`, `frontend/vite.config.ts`
- **问题**: 浏览器缓存旧版 index.html，导致加载的 JS/CSS 文件名哈希不匹配，页面样式丢失、功能异常
- **根因证据**: 浏览器加载 `index-DgWptSMK.js`，服务器上是 `index-BonDM_S_.js`（哈希值不同）
- **修复**:
  - index.html 添加 `Cache-Control: no-cache` 等禁用缓存的 meta 标签
  - vite.config.ts 添加 `transformIndexHtml` 插件，每次构建注入 build-time 时间戳
- **后果**: 每次部署后浏览器会自动加载最新版本，不再出现新旧文件混用的 Bug

---

## 如何排查"网站打不开"

1. **浏览器缓存**: 最常见原因，按 Ctrl+Shift+Delete 清除缓存，或用无痕窗口
2. **检查部署状态**: 访问 https://github.com/sy25255/dorm-match/actions 查看最新 workflow
3. **检查文件哈希**: F12 → Network → 对比加载的 index-xxx.js 文件名是否与 dist 中一致
4. **网络问题**: github.io 域名在国内可能不稳定，尝试手机流量或 VPN