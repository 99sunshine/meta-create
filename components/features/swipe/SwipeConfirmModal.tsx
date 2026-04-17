'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { UserProfile } from '@/types'

interface Props {
  profile: UserProfile
  iceBreakerText: string
  onConfirm: (message: string) => void
  onCancel: () => void
  sending?: boolean
}

export function SwipeConfirmModal({ profile, iceBreakerText, onConfirm, onCancel, sending }: Props) {
  const [message, setMessage] = useState(iceBreakerText)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setMessage(iceBreakerText) }, [iceBreakerText])

  if (!mounted) return null

  const initials = (profile.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 p-5 mb-2"
        style={{ backgroundColor: '#101837' }}
      >
        {/* Profile row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)', fontSize: 16 }}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{profile.name ?? 'Creator'}</p>
            {profile.role && <p className="text-xs text-white/40">{profile.role}</p>}
          </div>
        </div>

        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          ✦ 破冰消息（可编辑）
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none resize-none"
          placeholder="Write a personalised message…"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white/60 hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!message.trim() || sending}
            onClick={() => onConfirm(message)}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#E7770F' }}
          >
            {sending ? '发送中…' : '发送请求 🚀'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
