'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const FEATURES = [
  {
    icon: '🔍',
    title: '智能匹配',
    desc: '5 维加权算法——技能互补、角色匹配、兴趣共鸣——帮你找到最合拍的创作伙伴',
  },
  {
    icon: '💫',
    title: '滑动模式',
    desc: '像刷卡一样浏览创作者，右滑连接，AI 自动生成破冰开场白',
  },
  {
    icon: '🚀',
    title: '组队作战',
    desc: '创建队伍、邀请成员、上传作品集，整个赛季历程一键记录',
  },
]

const STATS = [
  { num: '4', label: '创作者类型' },
  { num: '∞', label: '连接可能' },
  { num: '0', label: '门槛' },
]

export default function LandingPage() {
  const { sessionUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && sessionUser) router.push('/explore')
  }, [loading, sessionUser, router])

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0b1120' }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-[#e46d2e]/30 border-t-[#e46d2e] animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ backgroundColor: '#0b1120', color: '#fff' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(11,17,32,0.9)' }}>
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-sm sm:text-base tracking-wide">
              Meta<span style={{ color: '#E7770F' }}>Create</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              登录
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white rounded-full px-4 py-1.5 transition-colors"
              style={{ backgroundColor: '#E7770F' }}
            >
              立即加入
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 px-5 text-center">
          {/* Glow */}
          <div
            className="pointer-events-none absolute inset-0 flex items-start justify-center"
            aria-hidden
          >
            <div
              className="h-[460px] w-[460px] rounded-full opacity-20 blur-[120px] mt-8"
              style={{ background: 'radial-gradient(circle, #E7770F 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative max-w-2xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 border border-[#e46d2e]/30 rounded-full px-3 py-1 text-xs text-[#e46d2e] mb-6 bg-[#e46d2e]/5">
              <span>✦</span>
              <span>正在开放内测</span>
            </div>

            <h1 className="text-[42px] sm:text-6xl font-extrabold leading-tight tracking-tight mb-5">
              找到你的<br />
              <span style={{ color: '#E7770F' }}>创作星伙伴</span>
            </h1>

            <p className="text-white/55 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
              MetaCreate 是面向青年创作者的匹配平台。<br className="hidden sm:block" />
              无论你是 Visionary、Builder、Strategist 还是 Connector——<br className="hidden sm:block" />
              这里总有人在等你。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl text-white font-semibold text-base px-8 py-3.5 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E7770F 0%, #f5a623 100%)' }}
              >
                免费开始 →
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm px-8 py-3.5 border border-white/10 text-white/70 hover:border-white/30 hover:text-white transition-colors"
              >
                已有账号？登录
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-12">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black" style={{ color: '#E7770F' }}>
                    {s.num}
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/[0.07] p-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-white mt-3 mb-2">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Roles ──────────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-white mb-6">你是哪种创作者？</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { role: 'Visionary', emoji: '🌟', desc: '有想法，带方向' },
              { role: 'Builder', emoji: '⚙️', desc: '动手落地，越难越燃' },
              { role: 'Strategist', emoji: '🧭', desc: '逻辑清晰，执行有章法' },
              { role: 'Connector', emoji: '🤝', desc: '人脉即资源，善于串联' },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-2xl border border-white/[0.07] p-4 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-2xl">{r.emoji}</span>
                <p className="font-semibold text-white text-sm mt-2">{r.role}</p>
                <p className="text-xs text-white/40 mt-1 leading-snug">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
        <section className="px-5 pb-24 max-w-2xl mx-auto text-center">
          <div
            className="rounded-3xl border border-[#e46d2e]/20 p-8"
            style={{ background: 'linear-gradient(135deg, rgba(231,119,15,0.08) 0%, rgba(245,166,35,0.04) 100%)' }}
          >
            <p className="text-2xl font-bold text-white mb-2">准备好了吗？</p>
            <p className="text-white/50 text-sm mb-6">
              和数百名同学一起，在这里找到属于你的星伙伴
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl text-white font-semibold px-8 py-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E7770F' }}
            >
              立即创建账号 →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-6 px-5 text-center">
        <p className="text-xs text-white/25">
          © 2025 MetaCreate · Built for creators, by creators
        </p>
      </footer>
    </div>
  )
}
