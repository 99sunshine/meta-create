# Search & Explore + 加权匹配算法文档

## Overview

Explore 模块让用户通过文本搜索和多维筛选快速找到匹配的创作者、作品和团队，并根据当前用户的 profile 计算个性化推荐分数。

---

## 涉及文件

| 文件 | 说明 |
|------|------|
| `components/features/explore/SearchFilterBar.tsx` | 搜索框 + 筛选 chip 行 |
| `components/features/explore/CommunityFeed.tsx` | 主 Feed，整合搜索/筛选/匹配排序 |
| `components/features/explore/TeamCard.tsx` | 团队卡片，新增 matchScore badge |
| `components/features/explore/WorkCard.tsx` | 作品卡片，新增 matchScore badge |
| `components/features/layout/TopNav.tsx` | 导航栏，头像改为下拉菜单 |
| `lib/matching.ts` | 纯函数加权匹配算法 |

---

## 搜索 & 筛选参数

| 参数 | URL query key | 说明 |
|------|--------------|------|
| 文本搜索 | `q` | 模糊匹配 title / description / creator name / tags |
| 内容类型 | `type` | `all` \| `works` \| `teams` |
| 角色筛选 | `role` | `Visionary` \| `Builder` \| `Strategist` \| `Connector` |
| 分类筛选 | `category` | `Engineering` \| `Design` \| `Art` \| `Science` \| `Business` \| `Other` |

所有参数均同步到 URL query string，刷新后保持筛选状态，可以直接分享链接。

### 示例 URL

```
/main?q=Python&role=Builder&type=teams
/main?category=Engineering
```

---

## 加权匹配算法（`lib/matching.ts`）

### 设计原则

- **纯函数**：无副作用，无数据库调用，易于单元测试。
- **透明规则**：不使用 ML / 向量数据库，所有权重明确可审计。
- **可解释**：每个 `MatchResult` 返回最多 2 条人类可读的推荐理由。

### 权重配置（`WEIGHTS`）

| 维度 | 满分 | 说明 |
|------|------|------|
| 技能重叠 (skills) | 40 pts | 用户 skills ∩ 对方 skills；4 项共同技能即满分，递增计算 |
| 角色互补 (role) | 25 pts | 基于 `ROLE_COMPLEMENTARITY` 矩阵：HIGH=100%, MEDIUM=60%, NEUTRAL=30%, LOW=10% |
| 领域匹配 (domain) | 20 pts | 用户 hackathon_track vs 团队/作品 category；相关领域得一半 |
| 可用性契合 (availability) | 15 pts | 相同=满分；相邻（按 full-time > flexible > evenings > weekends 排序）=一半 |

### 两个接口

```typescript
scoreTeamMatch(currentUser: UserProfile | null, team: TeamWithMembers): MatchResult
scoreWorkMatch(currentUser: UserProfile | null, work: WorkWithCreator): MatchResult
```

`MatchResult` 结构：

```typescript
{
  score: number      // 0–100 整数
  topReasons: string[] // 最多 2 条，如 ["3 shared skills", "complementary roles"]
}
```

### 排序逻辑

- 已登录：按 `matchScore` 降序（分数相同时按 `created_at` 降序）
- 未登录：按 `created_at` 降序

---

## TopNav 下拉菜单

点击右上角头像圆形，展开含以下选项的下拉菜单：

- 用户名 + 邮箱（展示区，不可点击）
- **My Profile** → `/profile`
- **Edit Onboarding** → `/onboarding`
- 分隔线
- **Logout**（红色，点击登出并跳转 `/login`）

点击菜单外部自动关闭（`mousedown` 事件监听）。移动端与桌面端表现一致，不再出现布局压缩问题。

---

## 扩展指南

### 添加新筛选维度

1. 在 `SearchFilterBar.tsx` 的 `ExploreFilters` 接口添加新字段
2. 在 `SearchFilterBar` 组件新增对应 chip 行
3. 在 `CommunityFeed.tsx` 的 `applyFilters()` 中添加过滤逻辑
4. 在 `handleFilterChange` 的 `updateUrl` 中添加对应 URL key

### 扩展匹配算法维度

1. 在 `lib/matching.ts` 的 `WEIGHTS` 中添加新权重项（确保总和不超过 100）
2. 实现对应评分函数
3. 在 `scoreTeamMatch` / `scoreWorkMatch` 中调用并添加 `reasons` 条目

### 升级为服务端搜索

当数据量增大（> 1000 条），将 `applyFilters()` 迁移到服务端：

1. 在 `supabase/repos/explore.ts` 实现 `.ilike()` 查询
2. 新建 `hooks/useExplore.ts`，在 debounce 后触发 Supabase 查询
3. `CommunityFeed` 改用 `useExplore` 替代客户端过滤

---

## 测试验收

```
[ ] /main?q=Python → 只显示 title/description/tags 含 Python 的结果
[ ] 筛选 role=Builder → 只显示 Builder 角色的创建者/团队
[ ] 筛选 category=Engineering → 只显示 Engineering 分类
[ ] 组合筛选：role + category 同时生效
[ ] 刷新页面 → URL 筛选参数保留，结果不变
[ ] 清除所有筛选 → 恢复完整列表
[ ] 已完成 onboarding 的用户 → 卡片上出现匹配分 badge
[ ] 未登录用户 → 无 badge，按时间排序
[ ] 空结果 → 显示"No matches found"，提供清除筛选按钮
```

---

## Known Issues / Future Work

- 当前匹配算法为客户端计算，数据量大时建议迁移至 `supabase/repos/explore.ts` 服务端
- `WorkCreator` 视图目前不包含 `skills` 字段（需更新 DB 视图以暴露该字段）
- 建议后续在卡片上添加"Connect"按钮，直接触发协作请求流程（Stage 7）
