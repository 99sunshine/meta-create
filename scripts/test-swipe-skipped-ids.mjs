/**
 * 纯逻辑自检（不依赖 vitest）：node scripts/test-swipe-skipped-ids.mjs
 * 从 TS 源复制与 import 等价的断言，避免额外 devDependency。
 */
import assert from 'node:assert/strict'

function swipeSkippedIdsStorageKey(userId) {
  return `mc_swiped:${userId}`
}

function parseSkippedIdsJson(raw) {
  try {
    const parsed = JSON.parse(raw ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x) => typeof x === 'string')
  } catch {
    return []
  }
}

assert.equal(swipeSkippedIdsStorageKey('u1'), 'mc_swiped:u1')
assert.deepEqual(parseSkippedIdsJson(null), [])
assert.deepEqual(parseSkippedIdsJson('[]'), [])
assert.deepEqual(parseSkippedIdsJson('["a","b"]'), ['a', 'b'])
assert.deepEqual(parseSkippedIdsJson('[1,2]'), [])
assert.deepEqual(parseSkippedIdsJson('not-json'), [])

console.log('swipe-skipped-ids logic OK')
