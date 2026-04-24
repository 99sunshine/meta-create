'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { WorkUploadForm } from '@/components/features/works'
import { TeamsRepository } from '@/supabase/repos/teams'

export default function CreateTeamWorkPage() {
  const { id: teamId } = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionUser, loading } = useAuth()
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!teamId) return
    let cancelled = false
    new TeamsRepository()
      .getTeamById(teamId)
      .then((t) => {
        if (!cancelled && t?.name) setTeamName(t.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [teamId])

  if (loading) return null
  if (!sessionUser || !teamId) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      <div
        className="h-14 flex items-center gap-3 px-4 border-b border-white/8 sticky top-0 z-10"
        style={{ backgroundColor: '#101837' }}
      >
        <button
          type="button"
          className="text-white/60 hover:text-white p-1 text-xl"
          onClick={() => router.back()}
        >
          ←
        </button>
        <p className="text-base font-semibold text-white">上传作品</p>
      </div>

      <WorkUploadForm
        teamId={teamId}
        teamName={teamName}
        userId={sessionUser.id}
        redirectAfterSave={`/teams/${teamId}`}
      />
    </div>
  )
}
