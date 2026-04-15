# Analytics 埋点文档

## Overview

`lib/analytics.ts` 提供统一的 `trackEvent(name, properties)` 封装，通过 `/api/analytics` 路由写入 Supabase `analytics_events` 表。失败静默处理，绝不阻断主流程。

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `lib/analytics.ts` | 客户端封装，火-and-forget |
| `app/api/analytics/route.ts` | 服务端写入，自动解析 userId，过滤 PII |

---

## 10 个核心事件

| 事件名 | 触发时机 | 已埋点 |
|--------|---------|--------|
| `user_signed_up` | 注册成功 | ✅ signup/page.tsx |
| `onboarding_completed` | onboarding 完成 | ✅ onboarding/page.tsx |
| `explore_searched` | 执行搜索（debounce 1s）| ✅ SearchFilterBar.tsx |
| `profile_viewed` | 查看他人 profile | ✅ creator/[id]/page.tsx |
| `collab_request_sent` | 发出协作请求 | ✅ SendCollabModal.tsx |
| `team_created` | 创建团队 | ⏳ 待添加到 CreateTeamForm |
| `team_joined` | 加入团队 | ⏳ 待添加到 CommunityFeed.handleJoinTeam |
| `work_created` | 创建作品 | ⏳ 待添加到 CreateWorkForm |
| `ai_icebreaker_generated` | AI ice-breaker 调用 | ⏳ 待添加到 icebreaker route |
| `event_viewed` | 查看活动详情 | ✅ events/space-base/page.tsx |

---

## 使用方法

```typescript
import { trackEvent } from '@/lib/analytics'

// 在关键操作完成后调用（fire-and-forget，不 await）
trackEvent('team_created', { category: 'Engineering' })
```

## Properties 规范

- 不得包含 PII（email、password、name、phone、address）— 服务端自动过滤
- 使用 snake_case
- 值类型：string | number | boolean | null

---

## 查询示例（Supabase SQL Editor）

```sql
-- 最近 7 天的核心事件统计
SELECT event_name, COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_name
ORDER BY count DESC;

-- 查看某用户的行为序列
SELECT event_name, properties, created_at
FROM analytics_events
WHERE user_id = 'your-user-uuid'
ORDER BY created_at;
```

---

## Known Issues / Future Work

- team_created / team_joined / work_created 三个事件尚未埋点（下阶段补充）
- 暂无 dashboard 可视化；后续可接 PostHog（有免费层）或在 Supabase Studio 使用内置图表
- 无限流保护；高流量时建议迁移到 PostHog/Segment
