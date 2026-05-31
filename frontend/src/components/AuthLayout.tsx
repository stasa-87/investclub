import type { ReactNode } from 'react'
import { Badge, Card, Text } from '@tremor/react'

type AuthLayoutProps = {
  accent: 'blue' | 'emerald'
  badge: string
  title: string
  description: string
  sidePanel: ReactNode
  children: ReactNode
}

function AuthLayout({ accent, badge, title, description, sidePanel, children }: AuthLayoutProps) {
  const glowClass = accent === 'emerald' ? 'bg-emerald-400/15' : 'bg-cyan-400/15'
  const orbClass = accent === 'emerald' ? 'bg-cyan-500/20' : 'bg-violet-500/20'
  const shadowClass = accent === 'emerald' ? 'shadow-emerald-950/20' : 'shadow-cyan-950/20'

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 lg:grid lg:grid-cols-[1.08fr_minmax(360px,460px)] lg:items-center lg:px-6">
        <section className="relative space-y-6">
          <div className={`pointer-events-none absolute inset-x-8 top-0 -z-10 h-72 rounded-full ${glowClass} blur-3xl`} />
          <div className={`pointer-events-none absolute -left-10 top-36 -z-10 h-44 w-44 rounded-full ${orbClass} blur-3xl`} />

          <Badge color={accent}>{badge}</Badge>

          <div className="space-y-4">
            <h1 className="max-w-[12ch] text-5xl font-semibold tracking-tight text-white md:text-6xl">
              {title}
            </h1>
            <Text className="max-w-2xl text-base leading-7 text-slate-300">{description}</Text>
          </div>

          {sidePanel}
        </section>

        <Card className={`border border-white/10 bg-white p-6 shadow-2xl ${shadowClass} md:p-8`}>
          <div className="space-y-6 text-slate-900">{children}</div>
        </Card>
      </div>
    </main>
  )
}

export default AuthLayout
