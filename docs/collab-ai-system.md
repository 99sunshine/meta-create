# 协作请求 + AI Ice-breaker 文档

## Overview

协作请求模块让用户从 Explore Feed 或创作者公共主页发起连接请求，接收方可在 Profile 的收件箱中接受或拒绝。AI Ice-breaker 提供个性化开场白建议（当前为模板 stub，预留 DeepSeek/OpenAI 接口）。

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `supabase/migrations/collab_requests_rls.sql` | RLS 策略（需在 Supabase 执行） |
| `supabase/repos/collab.ts` | 数据层：sendRequest / getInbox / getOutbox / respond / checkExisting |
| `hooks/useCollabRequests.ts` | React hooks：useCollabInbox / useSendCollabRequest / useExistingRequest |
| `components/features/collab/SendCollabModal.tsx` | 发起请求 Modal |
| `components/features/collab/CollabInbox.tsx` | 收件箱 UI（嵌入 /profile） |
| `lib/icebreaker.ts` | Ice-breaker 生成：本地模板 + AI 接口调用（带降级） |
| `app/api/ai/icebreaker/route.ts` | Ice-breaker API 路由（stub，预留 DeepSeek） |

---

## collab_requests 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | PK |
| sender_id | uuid | 发起者（必须是 auth.uid()） |
| receiver_id | uuid | 接收者 |
| type | text | `just_connect` \| `join_project` \| `invite_to_team` |
| status | text | `pending` \| `accepted` \| `declined` |
| message | text? | 自定义消息 |
| ice_breaker | text? | Ice-breaker 文本 |
| match_score | int? | 发送时的匹配分（记录快照） |
| team_id | uuid? | 关联团队（可选） |
| created_at | timestamptz | 创建时间 |
| responded_at | timestamptz? | 响应时间 |

---

## RLS 策略

```sql
-- SELECT: sender 可查自己发出的；receiver 可查发给自己的
-- INSERT: auth.uid() = sender_id，且 sender != receiver
-- UPDATE: 只有 receiver 可修改状态为 accepted/declined
-- DELETE: 不允许（保留审计记录）
```

**运行方式**：在 Supabase Dashboard → SQL Editor 粘贴执行 `supabase/migrations/collab_requests_rls.sql`

---

## AI Ice-breaker

### 当前状态：模板 stub

`lib/icebreaker.ts` 中的 `generateIceBreaker()` 根据请求类型选用预设模板，不依赖网络调用，始终返回有效文本。

### 升级为 DeepSeek AI

1. 在 Vercel / `.env.local` 中设置 `DEEPSEEK_API_KEY=sk-xxx`
2. 打开 `app/api/ai/icebreaker/route.ts`，取消注释 `// AI path` 代码块
3. 确认限流逻辑（建议用 `analytics_events` 记录每用户每日调用次数）

### 降级保证

`generateIceBreakerAI()` 在超时（8s）或 API 失败时自动回退到 `generateIceBreaker()`，绝不阻断用户操作。

---

## 用户流程

```
Explore Feed / /creator/:id
    ↓ 点击 "Connect"
SendCollabModal（选类型 + ice-breaker + message）
    ↓ 提交
collab_requests 表（status: pending）
    ↓ 接收方登录
/profile → Collab Requests 收件箱
    ↓ Accept / Decline
status 更新为 accepted / declined
```

---

## 测试验收

```
[ ] /creator/:id 页面显示 Connect 按钮（已登录非本人）
[ ] 点击 Connect → 弹出 SendCollabModal
[ ] 选择类型 → 点 Generate suggestion → 显示 ice-breaker 建议文本
[ ] 提交 → collab_requests 表出现新行，status=pending
[ ] 重复提交 → 显示"Already requested"，不重复写库
[ ] 接收方 /profile → Collab Requests 区域显示待处理请求
[ ] 点 Accept → status 变为 accepted，UI 更新
[ ] 点 Decline → status 变为 declined，UI 更新
[ ] 未登录用户访问 /creator/:id → 无 Connect 按钮，正常显示资料
```

---

## Known Issues / Future Work

- 目前无实时通知（接收方需手动刷新 /profile 查看请求）；后续可用 Supabase Realtime 推送
- Ice-breaker AI 接口预留但未接 DeepSeek；确认模型/计费后按文档解注释即可
- 收件箱未分页；数据量大时需加 `limit` + 无限滚动
