'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/supabase/utils/client'
import { useAuth } from '@/hooks/useAuth'
import { MessageRepository } from '@/supabase/repos/messages'
import { CollabRepository } from '@/supabase/repos/collab'

type MessagesInboxContextValue = {
  /** 未读会话数 + 待处理协作请求条数（Explore 左上角单一数字） */
  inboxBadgeTotal: number
  /** 仅待处理协作请求数（/messages「协作请求」角标） */
  pendingCollabCount: number
  refreshUnread: () => Promise<void>
}

const MessagesInboxContext = createContext<MessagesInboxContextValue | null>(null)

export function useMessagesInbox(): MessagesInboxContextValue {
  const ctx = useContext(MessagesInboxContext)
  if (!ctx) throw new Error('useMessagesInbox must be used within MessagesInboxProvider')
  return ctx
}

export function useMessagesInboxOptional(): MessagesInboxContextValue | null {
  return useContext(MessagesInboxContext)
}

const HEARTBEAT_MS = 22_000
const DEBOUNCE_MS = 400

export function MessagesInboxProvider({ children }: { children: ReactNode }) {
  const { sessionUser } = useAuth()
  const [unreadConversationCount, setUnreadConversationCount] = useState(0)
  const [pendingCollabCount, setPendingCollabCount] = useState(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const refreshUnread = useCallback(async () => {
    if (!sessionUser?.id) {
      setUnreadConversationCount(0)
      setPendingCollabCount(0)
      return
    }
    try {
      const [unread, pending] = await Promise.all([
        new MessageRepository().countUnreadConversations(sessionUser.id),
        new CollabRepository().countPendingInbox(sessionUser.id),
      ])
      setUnreadConversationCount(unread)
      setPendingCollabCount(pending)
    } catch {
      setUnreadConversationCount(0)
      setPendingCollabCount(0)
    }
  }, [sessionUser?.id])

  const scheduleRefresh = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      void refreshUnread()
    }, DEBOUNCE_MS)
  }, [refreshUnread])

  useEffect(() => {
    void refreshUnread()
  }, [refreshUnread])

  useEffect(() => {
    if (!sessionUser?.id) return

    const uid = sessionUser.id
    const channel = supabase
      .channel(`inbox:${uid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => {
          scheduleRefresh()
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => {
          scheduleRefresh()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collab_requests',
          filter: `receiver_id=eq.${uid}`,
        },
        () => {
          scheduleRefresh()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collab_requests',
          filter: `receiver_id=eq.${uid}`,
        },
        () => {
          scheduleRefresh()
        },
      )
      .subscribe()

    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void refreshUnread()
      }
    }, HEARTBEAT_MS)

    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshUnread()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(heartbeat)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [sessionUser?.id, supabase, refreshUnread, scheduleRefresh])

  const inboxBadgeTotal = unreadConversationCount + pendingCollabCount

  const value = useMemo(
    () => ({
      inboxBadgeTotal,
      pendingCollabCount,
      refreshUnread,
    }),
    [inboxBadgeTotal, pendingCollabCount, refreshUnread],
  )

  return (
    <MessagesInboxContext.Provider value={value}>{children}</MessagesInboxContext.Provider>
  )
}
