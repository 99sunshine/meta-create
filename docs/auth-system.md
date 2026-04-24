# 认证系统文档

> 最后更新：2026-04-15  分支：`fix/auth-flow`

---

## 概述

MetaCreate 使用 Supabase Auth 提供两种登录方式：
- **密码登录**：邮箱 + 密码（当前 Supabase 后台已关闭 Email Confirmation）
- **Magic Link**：仅邮箱，点击邮件链接登录

认证状态由 `hooks/useAuth.tsx` 的 `AuthProvider` 全局管理，挂载在根 `app/layout.tsx`。

---

## 认证状态设计

### 两阶段 Loading

| 状态 | 含义 | 速度 | 来源 |
|------|------|------|------|
| `loading` | 是否存在 session（从 cookie 读取） | < 5ms，立即完成 | `supabase.auth.getSession()` |
| `profileLoading` | UserProfile 是否已从 DB 拉取完成 | 取决于网络 | `profiles` 表查询 |

**关键原则**：页面"是否登录"的判断只依赖 `sessionUser`（Supabase 原始 User）；需要用户资料（name、role 等）才依赖 `user`（UserProfile）。

### AuthContext 导出字段

```ts
{
  sessionUser: User | null      // 原始 Supabase User，从 session cookie 读取
  user: UserProfile | null      // 从 profiles 表拉取的完整资料
  loading: boolean              // session 检查中（通常 <5ms）
  profileLoading: boolean       // profile DB 查询中
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>  // 手动刷新 profile（onboarding 完成后调用）
}
```

---

## 注册流程（密码方式）

```
用户填写 email + password
      ↓
supabase.auth.signUp()
      ↓
[Email Confirmation 关闭]
data.session 立即返回
      ↓
插入 profiles 表（name:'', role:'Builder', onboarding_complete:false）
      ↓
setSigningUp(true) → useEffect 检测到 sessionUser → router.push('/onboarding')
```

相关文件：`app/(auth)/signup/page.tsx`

---

## 注册流程（Magic Link / OAuth 回调）

```
用户点击邮件链接
      ↓
/auth/callback?code=... 被 Next.js Route Handler 接收
      ↓
supabase.auth.exchangeCodeForSession(code)
      ↓
检查 profiles 表是否已有记录
  - 有：直接跳转
  - 无：插入 profiles（name:'', role:'Builder', onboarding_complete:false）
      ↓
检查 profile.onboarding_complete
  - true  → router.push('/main')
  - false → router.push('/onboarding')
```

相关文件：`app/auth/callback/route.ts`

---

## 登录流程

```
用户填写 email + password（或发送 Magic Link）
      ↓
supabase.auth.signInWithPassword() / signInWithOtp()
      ↓
onAuthStateChange 触发 SIGNED_IN 事件
      ↓
setSessionUser(user) → loading=false
      ↓
useEffect 检测到 sessionUser → router.push('/main')
      ↓
/main 中 fetchProfile() 后台拉取 UserProfile
```

相关文件：`app/(auth)/login/page.tsx`

---

## Onboarding 流程

```
/onboarding 页面（3 步）

Step 1：基本信息
  - Display Name（必填）
  - School/Organization（必填）
  - City（必填）
  - Email（只读，来自 sessionUser）

Step 2：技能与协作风格
  - 选择角色：Visionary / Builder / Strategist / Connector（必填）
  - 选择技能（至少 3 个，来自 SKILLS_POOL）
  - 选择兴趣（可选，来自 INTERESTS_POOL）
  - 协作风格（可选）
  - 可用时间（可选）

Step 3：个人标签与宣言
  - Creator Tags（可选，来自 TAGS_POOL）
  - Manifesto（可选，一句话介绍）
  - Profile 预览卡片

点击 "Launch Profile 🚀"
  ↓
ProfileRepository.updateProfile(onboarding_complete: true, ...所有字段)
  ↓
refreshProfile()（更新 AuthContext 中的 user）
  ↓
router.push('/main')（banner 消失，因为 user.onboarding_complete = true）
```

### "I'll browse first" 跳过逻辑

点击后直接跳 `/main`，不写库、不标记 `onboarding_complete`。`/main` 顶部显示 amber 提示 banner，随时可点击回到 `/onboarding`。

---

## 中间件（proxy.ts）

每次请求调用 `supabase.auth.getUser()` 刷新 session token，防止 cookie 过期。

**注意**：这是服务端 Node.js 调用，走 `https_proxy` 代理。浏览器端调用（`fetchProfile` 等）不走此代理，需要确保网络可达 Supabase。

---

## Supabase 配置要求

| 配置项 | 位置 | 当前状态 |
|--------|------|---------|
| Email Confirmation | Auth → Providers → Email → Confirm email | **关闭**（开发环境） |
| Redirect URLs | Auth → URL Configuration | 需要添加 `http://localhost:3000/**` |
| SMTP | Auth → SMTP Settings | 使用 Supabase 内置（限速 4/小时），生产环境需换 Resend 等 |

---

## 环境变量

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 关键文件索引

```
hooks/useAuth.tsx                    — 全局认证状态（AuthProvider + useAuth hook）
supabase/utils/client.ts             — 浏览器端 Supabase client
supabase/utils/server.ts             — Server Component Supabase client
supabase/utils/middleware.ts         — Middleware Supabase client
supabase/utils/route.ts              — Route Handler Supabase client
supabase/repos/profile.ts            — ProfileRepository（CRUD）
supabase/auth.ts                     — 服务端 auth actions（signUp/signIn/signOut）
app/auth/callback/route.ts           — Magic Link / OAuth 回调处理
app/(auth)/signup/page.tsx           — 注册页
app/(auth)/login/page.tsx            — 登录页
app/onboarding/page.tsx              — Onboarding 三步流程
proxy.ts                             — Next.js Middleware（session 刷新）
constants/enums.ts                   — SKILLS_POOL / INTERESTS_POOL / TAGS_POOL 等
constants/roles.ts                   — ROLES 元数据（含图标和描述）
```

---

## 已知限制

- 生产环境必须替换 Supabase 内置 SMTP（限速 4 封/小时）为 Resend 或 SendGrid
- 当前 `name: ''` 作为 placeholder 写入 profiles，profile schema `min(1)` 验证通过 Zod bypass（直接写 supabase client），后续需统一
- Fast Track（简历上传）流程尚未实现，当前点击后行为与 Manual Track 相同
