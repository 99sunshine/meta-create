# 社区 Feed 实现文档

> 最后更新：2026-04-15  分支：`fix/auth-flow`

---

## 概述

社区 Feed（Community Feed）是主界面 `/main` 的核心内容区，展示所有用户创建的 **Team** 和 **Work** 卡片，支持筛选、加入团队、创建内容后实时刷新。

---

## 数据流

```
/main/page.tsx
  ├─ feedRefreshKey: number
  ├─ handleCreateSuccess() → feedRefreshKey++
  │
  ├─ <CommunityFeed refreshKey={feedRefreshKey}>
  │     ├─ useWorks({ limit: 20 })  → works[], loading, error, refetch
  │     ├─ useTeams({ openOnly: true, limit: 20 }) → teams[], loading, error, joinTeam, refetch
  │     ├─ useEffect([refreshKey]) → refetchWorks() + refetchTeams()
  │     ├─ 筛选（all / works / teams）→ 按 created_at 降序排列
  │     └─ WorkCard / TeamCard
  │
  └─ <CreateModal onCreated={handleCreateSuccess}>
        ├─ <CreateTeamForm onSuccess={handleSuccess}>
        └─ <CreateWorkForm onSuccess={handleSuccess}>
```

---

## 刷新机制

创建完 team 或 work 后，`main/page.tsx` 的 `feedRefreshKey` 自增，`CommunityFeed` 监听该值变化后触发 `refetchWorks()` 和 `refetchTeams()`，无需整页刷新。

---

## 错误状态

网络请求失败时，Feed 顶部展示红色错误 banner，包含错误信息和 **Retry** 按钮。Retry 按钮直接调用 `refetchWorks()` + `refetchTeams()`。

加载中使用骨架屏（6 个 `animate-pulse` 占位块）。

---

## 加入团队流程

```
用户点击 TeamCard 上的 "Join Team"
      ↓
JoinTeamDialog 弹出（选择加入角色）
      ↓
确认后调用 joinTeam(teamId, userId, role)
      ↓
成功 → 右下角绿色 Toast："You have joined the team!"
失败 → 右下角红色 Toast：错误信息
      ↓
useTeams 内部 joinTeam() 成功后自动 refetch 最新团队列表
```

### Toast 通知

`CommunityFeed` 内置轻量 Toast 系统（无额外依赖），右下角固定位置，3.5 秒后自动消失，支持 `success`（绿色）和 `error`（红色）两种类型。

---

## 筛选

通过 `FeedToggle` 组件切换：
- **All**：teams 和 works 混合，按 `created_at` 降序
- **Works**：仅展示作品卡片
- **Teams**：仅展示团队卡片

---

## 关键文件

```
components/features/explore/CommunityFeed.tsx  — Feed 容器（含 Toast、错误 banner、筛选）
components/features/explore/TeamCard.tsx       — 团队卡片（含加入按钮、成员列表、招募角色）
components/features/explore/WorkCard.tsx       — 作品卡片
components/features/explore/FeedToggle.tsx     — 筛选 Tab
components/features/teams/JoinTeamDialog.tsx   — 加入团队角色选择弹窗
components/features/create/CreateModal.tsx     — 创建弹窗（含 onCreated 回调）
hooks/useTeams.ts                              — 团队数据 hook（含 joinTeam / refetch）
hooks/useWorks.ts                              — 作品数据 hook（含 refetch）
supabase/repos/teams.ts                        — TeamsRepository（DB CRUD）
supabase/repos/works.ts                        — WorksRepository（DB CRUD）
```

---

## 数据来源

Feed 数据来自数据库视图（需在 Supabase 执行 `supabase/migrations/create_views.sql`）：
- `works_with_creator`：works 表 JOIN profiles 表，包含创作者信息
- `teams_with_members`：teams 表 JOIN team_members 表 JOIN profiles 表

---

## 已知限制 / 后续规划

- 目前无搜索和筛选（按技能/角色/可用性），计划在阶段六实现
- 分页尚未实现（当前 limit=20），Feed 数据量大时需要无限滚动
- WorkCard 和 TeamCard 的详情页（点击后弹出完整信息）尚未实现
- TeamCard 仅当 `team.is_open === true` 才显示 Join 按钮，关闭招募的团队无法加入
