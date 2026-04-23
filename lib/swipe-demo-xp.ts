/** Discover / swipe demo XP — single source for level curve + bar display */

export type SwipeDemoLevelCfg = { name: string; color: string; xpRequired: number; xpMax: number }

export const SWIPE_DEMO_LEVEL_CONFIG: Record<number, SwipeDemoLevelCfg> = {
  1: { name: 'Ember', color: '#f59e0b', xpRequired: 0, xpMax: 100 },
  2: { name: 'Spark', color: '#e46d2e', xpRequired: 100, xpMax: 300 },
  3: { name: 'Flame', color: '#8b5cf6', xpRequired: 300, xpMax: 600 },
  4: { name: 'Torch', color: '#0d9488', xpRequired: 600, xpMax: 600 },
}

export const SWIPE_DEMO_INITIAL_XP: { xp: number; level: number } = { xp: 60, level: 1 }

export function swipeDemoLevelFromXp(xp: number): number {
  if (xp >= 600) return 4
  if (xp >= 300) return 3
  if (xp >= 100) return 2
  return 1
}

export type SwipeXpBarDisplay = {
  level: number
  label: string
  levelColor: string
  fillPct: number
  countLabel: string
  /** per level 1..4: filled dot color or dim */
  dotBg: (lvl: number) => string
}

type SwipeXpBarI18n = {
  levelName?: (level: number, fallbackName: string) => string
  levelLabel?: (level: number, levelName: string) => string
  countLabel?: (xp: number, xpMax: number) => string
}

export function getSwipeXpBarDisplay(xp: number, i18n?: SwipeXpBarI18n): SwipeXpBarDisplay {
  const level = swipeDemoLevelFromXp(xp)
  const cfg = SWIPE_DEMO_LEVEL_CONFIG[level]
  const xpInLevel = xp - cfg.xpRequired
  const xpRange = cfg.xpMax - cfg.xpRequired
  const fillPct = level === 4 ? 100 : Math.min(100, (xpInLevel / xpRange) * 100)
  const levelName = i18n?.levelName ? i18n.levelName(level, cfg.name) : cfg.name
  const label = i18n?.levelLabel ? i18n.levelLabel(level, levelName) : `Lv${level} ${levelName}`
  const countLabel = i18n?.countLabel ? i18n.countLabel(xp, cfg.xpMax) : `${xp} / ${cfg.xpMax} XP`
  const dotBg = (lvl: number) =>
    lvl <= level ? SWIPE_DEMO_LEVEL_CONFIG[lvl as 1 | 2 | 3 | 4].color : 'rgba(255,255,255,0.15)'
  return {
    level,
    label,
    levelColor: cfg.color,
    fillPct,
    countLabel,
    dotBg,
  }
}
