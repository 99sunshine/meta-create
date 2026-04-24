'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { WorkUploadForm } from '@/components/features/works'

export default function CreatePersonalWorkPage() {
  const router = useRouter()
  const { sessionUser, loading } = useAuth()

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  if (loading) return null
  if (!sessionUser) return null

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
        <p className="text-base font-semibold text-white">上传作品（个人）</p>
      </div>

      <WorkUploadForm
        teamId={null}
        userId={sessionUser.id}
        redirectAfterSave="/profile"
      />
    </div>
  )
}
