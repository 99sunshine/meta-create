export class ContentSafetyError extends Error {
  code = 'CONTENT_SAFETY'
}

// MVP: small, explicit blacklist. Keep it short and easy to audit.
const BANNED: Array<{ re: RegExp; hint: string }> = [
  { re: /(?:色情|成人视频|约炮|裸聊|招嫖)/i, hint: '涉黄内容' },
  { re: /(?:赌博|博彩|下注|外围)/i, hint: '涉赌内容' },
  { re: /(?:毒品|冰毒|大麻|可卡因|K粉)/i, hint: '涉毒内容' },
]

export function assertSafeText(input: string | null | undefined, fieldLabel: string): void {
  const text = (input ?? '').trim()
  if (!text) return
  for (const b of BANNED) {
    if (b.re.test(text)) {
      throw new ContentSafetyError(`${fieldLabel}包含不允许的内容（${b.hint}），请修改后再提交。`)
    }
  }
}

