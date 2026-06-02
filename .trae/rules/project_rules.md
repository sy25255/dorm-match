# dorm-match 项目规则

## 项目定位

这是面向高校的新生宿舍舍友自主选择系统。核心流程是：

1. 学校/平台创建学校编码。
2. 管理员生成学生邀请码。
3. 学生输入学校编码进入本校区域。
4. 学生用本校邀请码注册、填写问卷、邀请组队。
5. 管理员处理未组队学生，执行宿舍分配并发布结果。

## 技术栈

- 前端：Vue 3 + TypeScript + Element Plus + Vite + Pinia + ECharts
- 后端：Supabase PostgreSQL + Supabase Auth + RLS
- 部署：GitHub Pages + Supabase
- 路由：`createWebHashHistory`
- 线上域名：`https://dormmatch.cn/#/`

## 关键约束

- `frontend/vite.config.ts` 的 `base` 必须保持 `/dorm-match/`。
- 路由必须保持 Hash 模式，不能改成 history 模式。
- 多学校隔离必须依赖 `school_code`，不要写死 `DEMO-UNI`。
- 新增 `frontend/src/api/` API 时，继续使用 Supabase SDK，并保持 `wrap()` 响应格式。
- `frontend/src/mock/data.ts` 作为 Supabase 不可用时的 fallback，不能随意删除其数据结构。
- 当前阶段不重写后端，不更换 Supabase。
- 不做无关重构，不改第三方依赖版本，除非单独确认。

## 常用验证

```bash
cd frontend
.\node_modules\.bin\vue-tsc.cmd --noEmit
npm run build
```

## 部署

- 仓库：`https://github.com/sy25255/dorm-match`
- 推送 `master` 后由 GitHub Actions 构建并发布到 GitHub Pages。
- 自定义域名使用 `https://dormmatch.cn/#/`。

## 上线前检查

- Supabase 迁移已执行。
- 首页学校编码入口可用。
- 管理员能创建学生邀请码。
- 学生只能注册到当前学校。
- 管理员只能看到本校学生、队伍、宿舍和分配结果。
