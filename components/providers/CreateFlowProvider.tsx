'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TeamsRepository } from '@/supabase/repos/teams'
import type { TeamWithMembers } from '@/types'

export type CreateFlowContextValue = {
  openPrimaryPicker: () => void
  subscribeEntityCreated: (listener: () => void) => () => void
  notifyEntityCreated: () => void
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null)

export function useCreateFlow(): CreateFlowContextValue {
  const ctx = useContext(CreateFlowContext)
  if (!ctx) throw new Error('useCreateFlow must be used within CreateFlowProvider')
  return ctx
}

export function useCreateFlowOptional(): CreateFlowContextValue | null {
  return useContext(CreateFlowContext)
}

const sheetBackdrop =
  'fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 pb-6'
const sheetPanel =
  'w-full max-w-md rounded-2xl border border-white/8 bg-[#101837] p-5 shadow-2xl'

export function CreateFlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { sessionUser } = useAuth()
  const [primaryOpen, setPrimaryOpen] = useState(false)
  const [workScopeOpen, setWorkScopeOpen] = useState(false)
  const [teamPickOpen, setTeamPickOpen] = useState(false)
  const [myTeams, setMyTeams] = useState<TeamWithMembers[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const createdListenersRef = useRef<Set<() => void>>(new Set())

  const subscribeEntityCreated = useCallback((fn: () => void) => {
    createdListenersRef.current.add(fn)
    return () => {
      createdListenersRef.current.delete(fn)
    }
  }, [])

  const notifyEntityCreated = useCallback(() => {
    createdListenersRef.current.forEach((fn) => fn())
  }, [])

  const openPrimaryPicker = useCallback(() => {
    setPrimaryOpen(true)
  }, [])

  const loadMyTeams = useCallback(async () => {
    if (!sessionUser) return
    setTeamsLoading(true)
    try {
      const teams = await new TeamsRepository().getTeamsForUser(sessionUser.id)
      setMyTeams(teams)
    } catch {
      setMyTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }, [sessionUser])

  useEffect(() => {
    if (!sessionUser) {
      setPrimaryOpen(false)
      setWorkScopeOpen(false)
      setTeamPickOpen(false)
    }
  }, [sessionUser])

  const ctx = useMemo(
    () => ({ openPrimaryPicker, subscribeEntityCreated, notifyEntityCreated }),
    [openPrimaryPicker, subscribeEntityCreated, notifyEntityCreated],
  )

  return (
    <CreateFlowContext.Provider value={ctx}>
      {children}

      {primaryOpen && (
        <div
          className={sheetBackdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPrimaryOpen(false)
          }}
        >
          <div className={sheetPanel}>
            <p className="text-[15px] font-semibold text-white mb-1">创建</p>
            <p className="text-xs text-white/40 mb-4">选择要创建的内容</p>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 min-h-12 rounded-xl bg-[#E7770F] px-3 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 active:scale-[0.99]"
                onClick={() => {
                  setPrimaryOpen(false)
                  router.push('/teams/create')
                }}
              >
                创建队伍
              </button>
              <button
                type="button"
                className="flex-1 min-h-12 rounded-xl border border-white/15 bg-white/8 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 active:scale-[0.99]"
                onClick={() => {
                  setPrimaryOpen(false)
                  setWorkScopeOpen(true)
                }}
              >
                创建作品
              </button>
            </div>
          </div>
        </div>
      )}

      {workScopeOpen && (
        <div
          className={sheetBackdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setWorkScopeOpen(false)
          }}
        >
          <div className={sheetPanel}>
            <p className="text-[15px] font-semibold text-white mb-1">作品归属</p>
            <p className="text-xs text-white/40 mb-4">个人作品或挂载到队伍</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full min-h-12 rounded-xl bg-[#E7770F] px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 active:scale-[0.99]"
                onClick={() => {
                  setWorkScopeOpen(false)
                  router.push('/works/create')
                }}
              >
                个人作品
              </button>
              <button
                type="button"
                className="w-full min-h-12 rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 active:scale-[0.99]"
                onClick={() => {
                  setWorkScopeOpen(false)
                  void loadMyTeams()
                  setTeamPickOpen(true)
                }}
              >
                队伍作品
              </button>
            </div>
          </div>
        </div>
      )}

      {teamPickOpen && (
        <div
          className={sheetBackdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setTeamPickOpen(false)
          }}
        >
          <div className={sheetPanel}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-semibold text-white">选择队伍</p>
              <button
                type="button"
                className="text-xs text-white/45 hover:text-white"
                onClick={() => setTeamPickOpen(false)}
              >
                关闭
              </button>
            </div>
            {teamsLoading ? (
              <p className="text-sm text-white/40 py-8 text-center">加载中…</p>
            ) : myTeams.length === 0 ? (
              <p className="text-sm text-white/45 py-6 text-center leading-relaxed">
                你还没有加入任何队伍。
                <br />
                <button
                  type="button"
                  className="mt-3 text-[#e46d2e] font-medium"
                  onClick={() => {
                    setTeamPickOpen(false)
                    router.push('/teams/create')
                  }}
                >
                  去创建队伍 →
                </button>
              </p>
            ) : (
              <ul className="max-h-[min(50vh,320px)] overflow-y-auto space-y-2">
                {myTeams.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition-colors hover:bg-white/10 active:scale-[0.99]"
                      onClick={() => {
                        setTeamPickOpen(false)
                        router.push(`/teams/${t.id}/works/create`)
                      }}
                    >
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">
                        {(t.member_count ?? 0)} 名成员
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </CreateFlowContext.Provider>
  )
}
