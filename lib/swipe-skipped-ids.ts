/**
 * 右滑已发送协作请求的用户 ID，按当前登录用户隔离存储。
 * 避免同一浏览器换账号后仍读取上一账号的 `mc_swiped` 导致池子几乎为空。
 */
export const LEGACY_SWIPE_SKIPPED_KEY = 'mc_swiped'

export function swipeSkippedIdsStorageKey(userId: string): string {
  return `mc_swiped:${userId}`
}

export function parseSkippedIdsJson(raw: string | null): string[] {
  try {
    const parsed = JSON.parse(raw ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

/** 浏览器内读取当前用户已右滑（已发请求）的对方 id 列表（仅分用户键，不读全局 legacy，避免换账号串数据） */
export function readSwipeSkippedIds(userId: string): string[] {
  if (typeof window === 'undefined') return []
  return parseSkippedIdsJson(localStorage.getItem(swipeSkippedIdsStorageKey(userId)))
}

/** 右滑发请求成功后追加对方 id（去重） */
export function appendSwipeSkippedId(userId: string, profileId: string): void {
  if (typeof window === 'undefined') return
  const key = swipeSkippedIdsStorageKey(userId)
  const next = readSwipeSkippedIds(userId)
  if (!next.includes(profileId)) next.push(profileId)
  localStorage.setItem(key, JSON.stringify(next))
}
