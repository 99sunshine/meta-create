# 阶段一修复记录

> 分支：`fix/auth-flow`  提交：`288f136`  日期：2026-04-15

---

## 修复内容总览

| 编号 | 问题 | 修改文件 |
|------|------|---------|
| Bug A | 注册后跳转等待 UserProfile 导致闪屏/卡死 | `app/(auth)/signup/page.tsx` |
| Bug B | Auth 页面被 layout 约束在 max-w-md 盒子里，无法全屏 | `app/(auth)/layout.tsx` |
| Bug C | 创建 team/work 后 Feed 不刷新 | `app/main/page.tsx` · `CreateModal.tsx` · `CommunityFeed.tsx` |
| Bug D | work category 与数据库 check 约束不符导致写入失败 | `CreateWorkForm.tsx` · `schemas/work.ts` |
| Bug E | 浏览器直连 Supabase 慢时页面永久卡在 Loading 屏 | `hooks/useAuth.tsx` · `app/page.tsx` · `app/main/page.tsx` · `app/(auth)/login/page.tsx` |
| 附加 | "I'll browse first" 造成 `/onboarding ↔ /main` 死循环 | `app/main/page.tsx` |

---

## 各修复详情

### Bug A — 注册跳转改用 sessionUser

**问题**：`signup/page.tsx` 的 redirect `useEffect` 依赖 `user`（UserProfile），而 UserProfile 需要额外一次 Supabase DB 查询才能拿到，期间页面可能闪烁或在网络慢时不跳转。

**修复**：改依赖 `sessionUser`（Supabase 原始 User 对象，从 cookie 读取，无网络延迟）。新注册用户 `onboarding_complete` 必为 `false`，直接跳 `/onboarding` 即可，不需要读 profile。

```ts
// before
if (signingUp && !authLoading && user) {
  router.push(user.onboarding_complete ? '/main' : '/onboarding')
}
// after
if (signingUp && !authLoading && sessionUser) {
  router.push('/onboarding')
}
```

---

### Bug B — AuthLayout 去掉约束 wrapper

**问题**：`app/(auth)/layout.tsx` 用 `max-w-md p-8` 的 div 包裹所有 auth 子页面，导致 login/signup/onboarding 在桌面端无法全屏显示。

**修复**：AuthLayout 改为直接渲染 `{children}`，各页面自行管理布局（它们已有 `min-h-screen` 全屏实现）。

---

### Bug C — 创建后 Feed 自动刷新

**问题**：`CommunityFeed` 内部维护 `useTeams`/`useWorks`，创建 team/work 后 modal 关闭，但 Feed 看不到新数据（没有触发 refetch）。

**修复**：在 `main/page.tsx` 增加 `feedRefreshKey` state，创建成功后自增；`CommunityFeed` 接收该 prop，监听变化后调用 `refetchWorks()` 和 `refetchTeams()`；`CreateModal` 新增 `onCreated` 回调串联整个流程。

```
main/page.tsx
  └─ feedRefreshKey: number
  └─ handleCreateSuccess() → setModalOpen(false) + feedRefreshKey++
       └─ <CreateModal onCreated={handleCreateSuccess}>
            └─ <CreateTeamForm onSuccess={handleSuccess}>  (handleSuccess = onCreated + onClose)
       └─ <CommunityFeed refreshKey={feedRefreshKey}>
            └─ useEffect([refreshKey]) → refetchWorks() + refetchTeams()
```

---

### Bug D — work category 与 DB 对齐

**问题**：`CreateWorkForm` 和 `schemas/work.ts` 的类别列表为 `['Web', 'Mobile', 'AI/ML', 'Hardware', 'Design', 'Other']`，与数据库 `works_category_check` 约束（`Engineering | Design | Art | Science | Business | Other`）不符，导致写入报错。

**修复**：统一改为 `['Engineering', 'Design', 'Art', 'Science', 'Business', 'Other']`，默认值也从 `'Web'` 改为 `'Engineering'`。

---

### Bug E — useAuth 分离 loading 与 profileLoading

**问题**：`useAuth` 的 `loading` 需要等 `fetchProfile()`（浏览器直连 Supabase DB 的网络请求）完成后才变 `false`。在网络受限环境（如中国大陆不走代理），该请求可能永久挂起，页面卡死在 Loading 屏。

**修复**：将 auth 状态分为两个阶段：

| 状态 | 含义 | 速度 |
|------|------|------|
| `loading` | session 检查（从 cookie 读取，无网络） | < 5ms，立即完成 |
| `profileLoading` | UserProfile DB 查询 | 取决于 Supabase 连接质量 |

各页面的处理逻辑：
- `app/page.tsx`：`!loading && sessionUser` → 跳 `/main`（不等 profile）
- `app/(auth)/login/page.tsx`：`!loading && sessionUser` → 跳 `/main`
- `app/main/page.tsx`：`loading || profileLoading` → 显示 spinner；`!loading && !sessionUser` → 跳 `/login`

---

### 附加 — "I'll browse first" 死循环修复

**问题**：`onboarding/page.tsx` 的 "I'll browse first" 调用 `router.push('/main')`，但 `/main` 检查到 `!user.onboarding_complete` 又踢回 `/onboarding`，造成无限跳转。

**修复**：移除 `/main` 中的强制跳转逻辑。改为在顶部展示一条 amber 色软提示 banner：

> "Your profile is incomplete. **Complete it now** to get matched with co-creators."

用户可随时点击完成 onboarding，或忽略继续浏览。

---

## 关键文件索引

```
hooks/useAuth.tsx          — 认证状态核心（loading / profileLoading / sessionUser / user）
app/page.tsx               — 首页路由分发（未登录展示 Landing，已登录跳 /main）
app/(auth)/layout.tsx      — Auth 页面布局（透明 pass-through）
app/(auth)/login/page.tsx  — 登录页
app/(auth)/signup/page.tsx — 注册页
app/main/page.tsx          — 主界面（Feed + 创建按钮 + onboarding banner）
components/features/create/CreateModal.tsx    — 创建弹窗（含 onCreated 回调）
components/features/explore/CommunityFeed.tsx — 社区 Feed（含 refreshKey prop）
schemas/work.ts            — work 创建校验 schema（类别枚举）
```

---

## 验收清单

- [x] 注册新账号 → 直接跳转 `/onboarding`，无需等待 profile 加载
- [x] login/signup 页面全屏显示，不被压缩在 max-w-md 盒子里
- [x] 创建 Team/Work 成功后弹窗关闭，Feed 立即显示新内容
- [x] Work 类别下拉选项为 Engineering/Design/Art/Science/Business/Other，提交不报 constraint 错误
- [x] 访问 `http://localhost:3000/` 不再卡在 Loading 屏
- [x] "I'll browse first" 正常跳转到 `/main`，显示 onboarding banner
