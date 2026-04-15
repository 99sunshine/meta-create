'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { useSendCollabRequest, useExistingRequest } from '@/hooks/useCollabRequests'
import type { CollabType } from '@/supabase/repos/collab'
import { generateIceBreaker } from '@/lib/icebreaker'
import { trackEvent } from '@/lib/analytics'

interface SendCollabModalProps {
  open: boolean
  onClose: () => void
  senderId: string
  receiverId: string
  receiverName: string
  receiverRole?: string
  senderRole?: string
  senderName?: string
  matchScore?: number
}

const TYPE_OPTIONS: Array<{ value: CollabType; label: string; desc: string }> = [
  { value: 'just_connect', label: '🤝 Just Connect', desc: 'Introduce yourself and start a conversation' },
  { value: 'join_project', label: '🚀 Join Project', desc: 'Ask to collaborate on a specific project or work' },
  { value: 'invite_to_team', label: '👥 Invite to Team', desc: 'Invite them to join your team' },
]

export function SendCollabModal({
  open,
  onClose,
  senderId,
  receiverId,
  receiverName,
  receiverRole,
  senderRole,
  senderName,
  matchScore,
}: SendCollabModalProps) {
  const { send, sending } = useSendCollabRequest()
  const existingStatus = useExistingRequest(senderId, receiverId)
  const [type, setType] = useState<CollabType>('just_connect')
  const [message, setMessage] = useState('')
  const [iceBreaker, setIceBreaker] = useState('')
  const [result, setResult] = useState<'ok' | 'already_sent' | 'error' | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted) return null

  const generateSuggestion = () => {
    const suggestion = generateIceBreaker({
      senderName: senderName ?? 'Someone',
      senderRole: senderRole,
      receiverName,
      receiverRole,
      type,
    })
    setIceBreaker(suggestion)
  }

  const handleSend = async () => {
    const outcome = await send({
      senderId,
      receiverId,
      type,
      message: message.trim() || undefined,
      iceBreakerText: iceBreaker.trim() || undefined,
      matchScore,
    })
    setResult(outcome)
    if (outcome === 'ok') {
      trackEvent('collab_request_sent', { request_type: type, match_score: matchScore ?? null })
      setTimeout(onClose, 1500)
    }
  }

  const alreadySent = existingStatus === 'pending' || result === 'already_sent'

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 p-6"
        style={{ backgroundColor: '#131d3f' }}
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Connect with {receiverName}</h2>
            {matchScore && matchScore > 0 ? (
              <p className="text-xs mt-0.5" style={{ color: '#f5a623' }}>🎯 {matchScore}% match</p>
            ) : (
              <p className="text-xs text-white/40 mt-0.5">{receiverRole ?? 'Creator'}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        {result === 'ok' ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="text-3xl">🚀</span>
            <p className="text-white font-semibold">Request sent!</p>
            <p className="text-white/50 text-sm">{receiverName} will be notified.</p>
          </div>
        ) : alreadySent ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="text-3xl">✅</span>
            <p className="text-white font-semibold">Already requested</p>
            <p className="text-white/50 text-sm">You have a pending request to {receiverName}.</p>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/60 hover:text-white mt-2">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Request type */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Request type</label>
              <div className="space-y-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors ${
                      type === opt.value
                        ? 'border-orange-400/60 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/8'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Ice-breaker suggestion */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-white/50">Ice-breaker (optional)</label>
                <button
                  onClick={generateSuggestion}
                  className="text-xs hover:text-white transition-colors underline"
                  style={{ color: '#f5a623' }}
                >
                  ✨ Generate suggestion
                </button>
              </div>
              <textarea
                value={iceBreaker}
                onChange={(e) => setIceBreaker(e.target.value)}
                rows={2}
                placeholder="Start with something personal…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-orange-400/60 focus:outline-none resize-none"
              />
            </div>

            {/* Custom message */}
            <div>
              <label className="block text-xs text-white/50 mb-1">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Tell them what you have in mind…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-orange-400/60 focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50 hover:text-white">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending}
                className="text-white font-medium"
                style={{ backgroundColor: '#E7770F' }}
              >
                {sending ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
