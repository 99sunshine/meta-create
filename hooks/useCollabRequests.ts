'use client'

import { useState, useEffect, useCallback } from 'react'
import { CollabRepository, type CollabRequestWithProfiles, type CollabType } from '@/supabase/repos/collab'

const repo = new CollabRepository()

export function useCollabInbox(userId: string | undefined) {
  const [inbox, setInbox] = useState<CollabRequestWithProfiles[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await repo.getInbox(userId)
      setInbox(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  const respond = async (requestId: string, status: 'accepted' | 'declined') => {
    await repo.respond(requestId, status)
    await refetch()
  }

  return { inbox, loading, error, refetch, respond }
}

export function useSendCollabRequest() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (params: {
    senderId: string
    receiverId: string
    type: CollabType
    message?: string
    iceBreakerText?: string
    matchScore?: number
  }): Promise<'ok' | 'already_sent' | 'error'> => {
    setSending(true)
    setError(null)
    try {
      await repo.sendRequest(params)
      return 'ok'
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send'
      if (msg === 'ALREADY_SENT') return 'already_sent'
      setError(msg)
      return 'error'
    } finally {
      setSending(false)
    }
  }

  return { send, sending, error }
}

export function useExistingRequest(senderId: string | undefined, receiverId: string | undefined) {
  const [status, setStatus] = useState<string | null>(null)
  useEffect(() => {
    if (!senderId || !receiverId) return
    repo.checkExisting(senderId, receiverId).then(setStatus).catch(() => {})
  }, [senderId, receiverId])
  return status
}
