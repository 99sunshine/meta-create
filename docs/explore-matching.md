# Explore 页面 & 匹配算法文档

> 最后更新：2026-04 · 对应代码分支：`fix/auth-flow`

---

## 一、架构概览

```
/explore  (page.tsx)
  └── CommunityFeed          ← 数据聚合 + 过滤 + 排序
        ├── NewCreatorsSection ← 本周新创作者横滑区
        ├── SearchFilterBar   ← 搜索框 + 多维筛选 chips
        ├── WorkCard          ← 作品卡片（含 Connect 按钮）
        └── TeamCard          ← 团队卡片（含 Connect 按钮）

lib/matching.ts               ← 纯函数匹配算法（无副作用）
supabase/repos/profile.ts     ← getRecentProfiles() 等 DB 方法
```

---

## 二、匹配算法（PRD §6.1 完整对齐）

### 加权公式

```
SCORE = (技能互补 × 40) + (角色互补 × 25) + (兴趣重叠 × 20) + (时间匹配 × 15)
```

总分范围：0–100（整数），卡片上以 `🎯 XX%` 展示。

### 维度详解

#### 1. 技能互补（40 分）

**公式**：对称式互补率

```
complement(A→B) = B 有 A 没有的技能数 / 两人技能并集数
complement(B→A) = A 有 B 没有的技能数 / 两人技能并集数
得分 = (complement(A→B) + complement(B→A)) / 2 × 40
```

**边界情况**：任一方技能 < 3 个，得分上限 0.5（数据不足，降低置信度）。

**设计理由**：同质化技能重叠（共享相同技能）匹配价值低；互补（对方有我没有）才能组建高效团队。

#### 2. 角色互补（25 分）

基于 PRD §4 四角色矩阵：

| 角色对 | 兼容度 | 得分 |
|---|---|---|
| Visionary ↔ Builder | HIGH | 25 分 |
| Visionary ↔ Strategist | HIGH | 25 分 |
| Builder ↔ Strategist | MEDIUM | 12.5 分 |
| Builder ↔ Connector | MEDIUM | 12.5 分 |
| Strategist ↔ Connector | MEDIUM | 12.5 分 |
| Visionary ↔ Connector | MEDIUM | 12.5 分 |
| 同角色（除 Visionary） | LOW | 5 分 |
| Visionary ↔ Visionary | NEUTRAL | 7.5 分 |

完整矩阵见：`types/interfaces/Role.ts` → `ROLE_COMPLEMENTARITY`

#### 3. 兴趣重叠（20 分，Jaccard 相似度）

```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
得分 = Jaccard × 20
```

当 interests 为空时，降级为 tags 重叠（系数 × 0.7）。

#### 4. 时间匹配（15 分）

**可用度规范化**：

| DB 值 | 标准化 |
|---|---|
| full-time | Available |
| flexible | Available |
| evenings | Exploring |
| weekends | Exploring |
| unavailable | Unavailable |

**规则**：
- 双方 Available → 15 分
- Available + Exploring → 7.5 分
- 任一方 Unavailable → 0 分
- 同一 hackathon_track → +3 分（上限 15 分）

---

## 三、用户 vs 团队匹配

团队没有 skills/interests 字段，做如下适配：

| 维度 | 适配方式 |
|---|---|
| 技能互补 | 用户技能 vs 成员角色名（作为技能代理） |
| 角色互补 | 用户角色 vs 团队 `looking_for_roles[0]` |
| 兴趣/赛道 | 用户 `hackathon_track` vs 团队 `category`，完全匹配 +20，相近领域 +10 |
| 时间 | 仅看用户端（团队无 availability 字段） |

---

## 四、用户 vs 作品匹配

作品的 `creator` 字段在 DB view 中携带扩展信息，但 TypeScript 类型只声明了基础字段（`id/name/role/avatar_url`）。

算法代码通过 `creator as unknown as Record<string, unknown>` 访问可能存在的 `skills`/`interests` 字段。当这些字段存在时用标准 Jaccard，否则降级为 tags 重叠。

---

## 五、筛选维度（SearchFilterBar）

| 参数（URL query） | 字段 | 说明 |
|---|---|---|
| `q` | searchQuery | 全文搜索（标题/描述/名字/tag） |
| `role` | roleFilter | 4 角色之一 |
| `category` | categoryFilter | Engineering/Design/Art/Science/Business/Other |
| `availability` | availabilityFilter | full-time/flexible/evenings/weekends |
| `track` | trackFilter | 赛道（Engineering/Design/Business/Science/Social Impact） |
| `type` | contentType | all/works/teams |

筛选结果实时同步到 URL，支持分享与刷新复原。

---

## 六、New Creators This Week 区块

- 数据源：`ProfileRepository.getRecentProfiles(days=7, limit=20)`
- 过滤：`onboarding_complete = true` 且 `role IS NOT NULL`
- 展示：水平横滑卡片，显示头像、角色徽章、匹配分数、首条技能
- 空数据时自动隐藏整个区块

---

## 七、Connect 按钮

**WorkCard**：点击打开 `SendCollabModal`，目标为作品创作者  
**TeamCard**：点击打开 `SendCollabModal`，目标为团队 owner（`team.owner_id`）

Modal 数据流：
```
useAuth().user (sender) → SendCollabModal → useSendCollabRequest → CollabRepository.sendRequest
```

已实现去重：对同一接收方只允许一条 pending 请求（useExistingRequest）。

---

## 八、排序逻辑

- 已登录：按 `matchScore` 降序，相同分数按 `created_at` 降序
- 未登录：仅按 `created_at` 降序

---

## 九、后续优化方向

- [ ] 接入真实 AI tags（DeepSeek），用向量相似度替代 Jaccard
- [ ] "New Creators" 改为基于活跃度而非注册时间（last_active 字段）
- [ ] 服务端计算匹配分数（避免客户端重复计算）
- [ ] A/B 测试不同权重组合的留存差异
