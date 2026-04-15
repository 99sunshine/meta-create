# Profile 页面 & TopNav 组件文档

## 涉及文件

| 文件 | 说明 |
|------|------|
| `components/features/layout/TopNav.tsx` | 顶部导航栏（固定定位） |
| `app/profile/page.tsx` | 个人主页（`/profile`） |
| `app/main/page.tsx` | 社区首页，已集成 TopNav，移除旧 header |
| `app/(auth)/signup/page.tsx` | 注册页，修复 banner 竞态 bug |

---

## TopNav

### 功能
- 固定在顶部（`position: fixed, z-index: 50`），高度 56 px
- 左侧：🔥 + MetaCreate Logo，点击跳转 `/main`
- 中间：Explore（→ `/main`）、Profile（→ `/profile`）导航 tab，当前页高亮
- 右侧：头像圆形（显示姓名首字母缩写）+ 桌面端 Logout 按钮
- 未登录时显示 Login 链接

### 使用
在任意需要导航栏的页面直接引入并放置，子内容加 `mt-14` 或 `pt-14` 与 navbar 错开。

```tsx
import TopNav from '@/components/features/layout/TopNav'

<TopNav />
<main className="mt-14">…</main>
```

---

## Profile 页面（`/profile`）

### 功能模块
1. **Hero Card**：头像（姓名首字母）、姓名、角色徽章、学校 / 城市、状态（可用性）、Manifesto
2. **技能 (Skills)**：蓝色 chip 行
3. **兴趣 (Interests)**：紫色 chip 行
4. **Creator Tags**：橙色 chip 行
5. **Collab Style**：若有则展示
6. **Account**：邮箱、注册日期
7. **Edit Profile 按钮**：打开内联编辑弹窗
8. **Full Re-onboard 按钮**：跳转 `/onboarding` 重新完成引导

### 内联编辑弹窗（EditProfileModal）
仅支持快速修改：姓名、城市、学校、Manifesto。
提交后调用 `supabase.from('profiles').update(…)` + `refreshProfile()` 刷新 AuthContext。

### 未完成 onboarding 提示
若 `user.onboarding_complete === false`，Hero Card 内底部显示 amber 提示条。

---

## 修复：注册后 banner 竞态 bug

### 问题描述
用户注册 → 选择「I'll browse first」→ 第一次进入 `/main` 时，「Your profile is incomplete」banner 不显示。

### 根本原因
`onAuthStateChange` 触发 `fetchProfile()` 的时机可能早于 `signup` handler 中的 `INSERT INTO profiles`，导致 `user` 为 `null`；随后没有再次拉取，banner 条件 `user && !user.onboarding_complete` 判断失败。

### 修复
在 `signup/page.tsx` 的 `useEffect` 中，获取到 `sessionUser` 后先调用 `refreshProfile()` 强制拉一次 profile row（此时 INSERT 一定已完成），再跳转 `/onboarding`。

```tsx
refreshProfile().finally(() => router.push('/onboarding'))
```

这样在 `/onboarding` 中「I'll browse first」跳转 `/main` 时，AuthContext 的 `user.onboarding_complete` 已为 `false`，banner 立即显示。
