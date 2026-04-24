# Event Hub 文档

## Overview

Event Hub 提供 Space Base Challenge 活动页面（`/events/space-base`），包含赛道介绍、日程安排和"找队友"入口。赛道直接链接到 `/explore?category=` 预筛结果。

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `lib/events.ts` | 静态活动配置（赛道/日程/活动元信息） |
| `app/events/space-base/page.tsx` | 活动主页 |

---

## 数据模型

当前使用**静态配置**（`lib/events.ts`），不依赖数据库。迁移到 DB 时：

1. 在 Supabase 创建 `events` 表（id, name, date, location, tracks JSON, schedule JSON）
2. 将 `lib/events.ts` 的常量替换为 DB 查询
3. `teams` 表已有 `event_id` + `event_track` 字段，创建团队时可选择关联

---

## 赛道与 Explore 联动

每个赛道卡片底部都有"Find teammates →"链接，指向：

```
/explore?category=Engineering
/explore?category=Design
...
/explore?category=Other  (Social Impact → Other)
```

---

## 测试验收

```
[ ] /events/space-base 可访问，显示活动信息
[ ] 6 个赛道卡片全部显示，描述正确
[ ] 点击"Find teammates →" → 跳转到对应 category 预筛的 Explore 页
[ ] 日程列表完整显示，颜色 legend 正确
[ ] "Find Teammates Now" 按钮跳转到 /explore
[ ] TopNav "Events" tab 高亮当前页面
[ ] analytics_events 表出现 event_viewed 记录
```

---

## Known Issues / Future Work

- 活动数据为静态配置，上线前需替换为 DB 驱动
- Team 创建表单尚未添加 event_track 选择器（待下阶段实现）
- 无活动报名功能（后续可集成外部报名链接或数据库报名表）
