# 本地开发环境配置指南

> 最后更新：2026-04-15

---

## 前置要求

| 工具 | 推荐版本 | 说明 |
|------|---------|------|
| Node.js | 20 LTS | Node 22 与 Next.js 16 不兼容，请用 nvm 切换 |
| npm | 随 Node.js 安装 | |
| Git | 任意 | |

```bash
# 用 nvm 安装并切换到 Node 20
nvm install 20
nvm use 20
node -v   # 应输出 v20.x.x
```

---

## 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd meta-create
npm install
```

---

## 2. 配置环境变量

```bash
cp .env.example .env.local
```

用编辑器打开 `.env.local`，填入以下三个值（在 Supabase Dashboard → Project Settings → API 获取）：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Supabase 项目配置

### 3.1 数据库初始化

在 Supabase SQL Editor 中按顺序执行以下文件：

| 顺序 | 文件 | 说明 |
|------|------|------|
| 1 | `supabase/migrations/rls_policies_create.sql` | 创建 profiles / teams / works 表及 RLS 策略 |
| 2 | `supabase/migrations/create_views.sql` | 创建 works_with_creator / teams_with_members 视图 |
| 3 | `supabase/migrations/fix_works_category_constraint.sql` | 修复 works 类别约束（Engineering/Design/Art/Science/Business/Other） |

### 3.2 Auth 配置

在 Supabase Dashboard → Authentication 中：

1. **关闭 Email Confirmation**（开发环境）：
   - Auth → Providers → Email → 关闭 "Confirm email"

2. **添加 Redirect URL**：
   - Auth → URL Configuration → Redirect URLs
   - 添加：`http://localhost:3000/**`

3. **生产环境 SMTP**（上线前必做）：
   - Auth → SMTP Settings
   - 接入 Resend / SendGrid 等服务（Supabase 内置限速 4 封/小时）

---

## 4. 启动开发服务器

```bash
# 如需代理（中国大陆访问 Supabase）
export https_proxy=http://127.0.0.1:7897

npm run dev
```

访问 `http://localhost:3000`

---

## 5. 常用命令

```bash
npm run dev      # 启动开发服务器（热重载）
npm run build    # 生产构建（含 TypeScript 类型检查）
npm run lint     # ESLint 检查
```

---

## 6. 分支说明

| 分支 | 说明 |
|------|------|
| `fix/auth-flow` | 当前主开发分支，包含所有修复和新功能 |
| `auth-redirect-after-login` | 历史分支（已归档，不再更新） |
| `sprint-0-infra` | 历史分支（已归档，不再更新） |
| `main` | 静态 Landing Page 原型（GitHub Pages 部署） |

---

## 7. 已知问题

- **网络问题**：中国大陆直连 Supabase 可能较慢，建议开代理后再运行 `npm run dev`
- **邮件限速**：Supabase 内置 SMTP 限制 4 封/小时，测试时关闭 email confirmation 避免阻塞
- **Node 版本**：必须使用 Node 20，Node 22 会导致 `Bus error (core dumped)`
