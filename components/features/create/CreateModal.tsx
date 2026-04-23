'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CreateTeamForm } from './CreateTeamForm'
import { CreateWorkForm } from './CreateWorkForm'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
  type: 'team' | 'work'
  /** When creating a work under a team (from FAB flow) */
  defaultTeamId?: string | null
  defaultTeamName?: string | null
}

export function CreateModal({
  isOpen,
  onClose,
  onCreated,
  type,
  defaultTeamId,
  defaultTeamName,
}: CreateModalProps) {
  const handleSuccess = () => {
    onCreated?.()
    onClose()
  }
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {type === 'team' ? 'Create Team' : 'Create Work'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {type === 'team'
                ? 'Start a new team and recruit collaborators'
                : defaultTeamId
                  ? `将作品关联到队伍：${defaultTeamName ?? '队伍'}`
                  : '个人作品，或稍后在队伍中展示'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {type === 'team' ? (
            <CreateTeamForm onSuccess={handleSuccess} onCancel={onClose} />
          ) : (
            <CreateWorkForm
              key={defaultTeamId ?? 'personal'}
              onSuccess={handleSuccess}
              onCancel={onClose}
              defaultTeamId={defaultTeamId ?? undefined}
              defaultTeamName={defaultTeamName ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
