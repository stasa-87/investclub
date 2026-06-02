import { Button, Card, Text } from '@tremor/react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

function NotFoundPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const homePath = isLoggedIn ? '/dashboard' : '/'

  return (
    <AuthLayout
      accent="blue"
      badge="404 • Route not found"
      title="This page took a wrong turn."
      description="The route you opened does not exist in the current Investclub app. Use the button to get back to the right starting point."
      sidePanel={
        <Card className="border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Route diagnostics
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-6xl font-semibold tracking-tight text-white">404</p>
              <Text className="mt-3 text-sm leading-6 text-slate-300">
                We could not match this URL to a known page. The safest next step is to return to your
                main landing page.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 backdrop-blur">
                Authenticated users return to the dashboard.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 backdrop-blur">
                Guests return to the login landing page.
              </div>
            </div>
          </div>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Page not found</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">We couldn&apos;t find that page</h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          The address may be incorrect, outdated, or no longer available in this version of the app.
        </Text>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <Text className="text-sm leading-6 text-slate-600">
          Use the primary action below to return to the correct home screen for your current session.
        </Text>
      </div>

      <Button className="w-full justify-center" onClick={() => navigate(homePath)}>
        Go home
      </Button>
    </AuthLayout>
  )
}

export default NotFoundPage
