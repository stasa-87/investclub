import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Metric, Text } from '@tremor/react'
import TradesList from '../components/TradesList'
import { useAuth } from '../context/AuthContext'

const portfolioCards = [
  { label: 'Active ideas', value: '12', accent: 'Watchlist and research in motion' },
  { label: 'Tracked sectors', value: '8', accent: 'Energy, AI, fintech, healthcare' },
  { label: 'Next reviews', value: '3', accent: 'High-conviction setups this week' },
] as const

function DashboardPage() {
  const navigate = useNavigate()
  const { logout, refreshProfile, session } = useAuth()
  const [profileState, setProfileState] = useState({
    error: '',
    loading: true,
  })
  const displayName = session?.displayName ?? 'Investclub User'
  const avatarFallback = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const profilePhotoUrl = session?.profilePhotoUrl?.startsWith('http')
    ? session.profilePhotoUrl
    : session?.profilePhotoUrl
      ? `${import.meta.env.VITE_API_BASE_URL?.trim() || ''}${session.profilePhotoUrl}`
      : ''

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        await refreshProfile()

        if (!isMounted) {
          return
        }

        setProfileState({
          error: '',
          loading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Could not load current user profile'

        setProfileState({
          error: message,
          loading: false,
        })
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/70 p-8 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <Badge color="blue">Private dashboard</Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Welcome to the private Investclub workspace.
                </h1>
                <Text className="max-w-2xl text-base leading-7 text-slate-300">
                  This page is accessible only after login in the current frontend flow. It gives a
                  clean starting point for portfolio reviews, research, and account tools.
                </Text>
              </div>
            </div>

            <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur xl:w-[360px]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-lg font-semibold text-white">
                  {profilePhotoUrl ? (
                    <img
                      alt={`${displayName} profile`}
                      className="h-full w-full rounded-2xl object-cover"
                      src={profilePhotoUrl}
                    />
                  ) : (
                    avatarFallback || 'IU'
                  )}
                </div>

                <div className="space-y-1">
                  <Text className="text-sm text-slate-400">Signed in user</Text>
                  <Text className="text-lg font-medium text-white">{displayName}</Text>
                  <Text className="text-sm text-slate-400">{session?.email ?? 'Unknown user'}</Text>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  className="font-medium text-rose-300 transition hover:text-rose-200"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
                <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/forgot-password">
                  Security & recovery
                </Link>
                <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/change-password">
                  Change password
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button color="gray" variant="secondary" onClick={() => navigate('/register')}>
              Add another member
            </Button>
            <Button color="blue" onClick={() => navigate('/forgot-password')}>
              Open account tools
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {portfolioCards.map((card) => (
              <Card key={card.label} className="border border-white/10 bg-white/5 p-5 backdrop-blur">
                <Text className="text-sm font-medium text-slate-300">{card.label}</Text>
                <Metric className="mt-3 text-white">{card.value}</Metric>
                <Text className="mt-2 text-sm text-slate-400">{card.accent}</Text>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Session
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current access details</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-sm text-slate-400">Signed in as</Text>
                  <Text className="mt-2 text-lg font-medium text-white">{session?.email ?? 'Unknown user'}</Text>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-sm text-slate-400">Display name</Text>
                  <Text className="mt-2 text-lg font-medium text-white">{displayName}</Text>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-sm text-slate-400">Access model</Text>
                  <Text className="mt-2 text-lg font-medium text-white">Frontend-only private route</Text>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-sm text-slate-400">User tools</Text>
                  <Text className="mt-2 text-lg font-medium text-white">Avatar, logout, future settings</Text>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="text-sm text-slate-400">Profile sync</Text>
                <Text className="mt-2 text-sm text-white">
                  {profileState.loading
                    ? 'Loading current user from backend...'
                    : profileState.error || 'Dashboard is synced with GET /api/auth/me.'}
                </Text>
              </div>

              <Text className="text-sm leading-6 text-slate-400">
                Until the real backend authentication is connected, this dashboard is protected with
                client-side session state. The UX is ready now, and the route guard can later be
                replaced with token/session validation from the API.
              </Text>
            </div>
          </Card>
           <Card className="border border-white/10 bg-white p-6 shadow-xl shadow-cyan-950/20">
            <div className="space-y-4 text-slate-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                  Settings
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Account controls and future settings
                </h2>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Avatar and profile editor can live here at a later stage.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Security settings, password updates, and device sessions can be added here later.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Notification preferences and account customization can also sit in this panel.
                </div>
              </div>

              <div className="text-sm text-slate-500">
                Want to update your password?{' '}
                <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/change-password">
                  Open change password.
                </Link>
              </div>
            </div>
          </Card>
        </section>
        
        <section>
          <TradesList />
        </section>
      </div>
    </main>
  )
}

export default DashboardPage
