import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Callout, Card, Metric, Text, TextInput } from '@tremor/react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

type FeedbackState = {
  tone: 'blue' | 'red' | 'teal'
  title: string
  message: string
}

type LoginFormState = {
  email: string
  password: string
}

type LoginFormErrors = {
  email?: string
  password?: string
}

type HealthResponse = {
  status: string
}

type DemoResponse = {
  message: string
  service: string
  status: string
}

type ApiState = {
  loading: boolean
  error: string | null
  health: HealthResponse | null
  demo: DemoResponse | null
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || ''
const apiBaseLabel = apiBaseUrl || 'same-origin (/api via reverse proxy)'

const demoCredentials = {
  email: 'demo@investclub.dev',
  password: 'Demo123',
}

const featureItems = [
  'Dedicated login landing page',
  'Live backend connectivity visibility',
  'Tremor UI + Tailwind standard frontend stack',
] as const

function mapToneToColor(tone: FeedbackState['tone']) {
  switch (tone) {
    case 'red':
      return 'red'
    case 'teal':
      return 'emerald'
    default:
      return 'blue'
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const { isLoading, isLoggedIn, login } = useAuth()
  const [form, setForm] = useState<LoginFormState>({
    email: demoCredentials.email,
    password: demoCredentials.password,
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>({
    tone: 'blue',
    title: 'Demo access',
    message: 'Use demo@investclub.dev / Demo123 to preview the login flow locally.',
  })
  const [apiState, setApiState] = useState<ApiState>({
    loading: true,
    error: null,
    health: null,
    demo: null,
  })

  const loadBackendStatus = async (signal?: AbortSignal) => {
    setApiState((current) => ({ ...current, loading: true, error: null }))

    try {
      const [healthResponse, demoResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/health`, { signal }),
        fetch(`${apiBaseUrl}/api/demo`, { signal }),
      ])

      if (!healthResponse.ok || !demoResponse.ok) {
        throw new Error('The backend returned a non-success response.')
      }

      const [health, demo] = (await Promise.all([
        healthResponse.json(),
        demoResponse.json(),
      ])) as [HealthResponse, DemoResponse]

      setApiState({ loading: false, error: null, health, demo })
    } catch (error) {
      if (signal?.aborted) {
        return
      }

      setApiState({
        loading: false,
        error:
          error instanceof Error
            ? `${error.message} Check that the backend is running behind ${apiBaseLabel}.`
            : `Could not reach the backend at ${apiBaseLabel}.`,
        health: null,
        demo: null,
      })
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadBackendStatus(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      navigate('/dashboard')
    }
  }, [isLoading, isLoggedIn, navigate])

  const validateForm = () => {
    const nextErrors: LoginFormErrors = {}

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      setFeedback({
        tone: 'red',
        title: 'Check your details',
        message: 'Fix the highlighted fields and try again.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await login(form.email, form.password)
      setFeedback({
        tone: 'teal',
        title: 'Login successful',
        message: 'Welcome back. Redirecting to your dashboard...',
      })
      navigate('/dashboard')
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Login failed'

      setFeedback({
        tone: 'red',
        title: 'Login failed',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const backendStatusColor = apiState.error ? 'red' : apiState.loading ? 'blue' : 'emerald'
  const feedbackColor = feedback ? mapToneToColor(feedback.tone) : 'blue'

  return (
    <AuthLayout
      accent="blue"
      badge="Investclub access"
      title="Log in to your investor workflow."
      description="This is now the default landing page. Use your existing credentials, or move to the registration page if you still need an account."
      sidePanel={
        <>
          <div className="grid gap-3">
            {featureItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>

          <Card className="border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Backend API
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">Spring Boot connectivity</p>
              </div>
              <Badge color={backendStatusColor}>
                {apiState.error ? 'Disconnected' : apiState.loading ? 'Checking' : 'Connected'}
              </Badge>
            </div>

            <Text className="mt-4 text-sm text-slate-400">Base URL: {apiBaseLabel}</Text>

            {apiState.error ? (
              <div className="mt-4">
                <Callout title="Backend unavailable" color="red">
                  {apiState.error}
                </Callout>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Card className="border border-white/10 bg-white/5 p-5">
                <Text className="text-sm font-medium text-white">Health endpoint</Text>
                <Text className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  GET /api/health
                </Text>
                <div className="mt-4">
                  <Metric>{apiState.health?.status ?? (apiState.loading ? 'Loading…' : 'Unavailable')}</Metric>
                </div>
              </Card>

              <Card className="border border-white/10 bg-white/5 p-5">
                <Text className="text-sm font-medium text-white">Demo endpoint</Text>
                <Text className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  GET /api/demo
                </Text>
                <p className="mt-4 text-lg font-medium text-white">
                  {apiState.demo?.message ?? (apiState.loading ? 'Loading…' : 'Unavailable')}
                </p>
              </Card>
            </div>

            <div className="mt-5">
              <Button loading={apiState.loading} onClick={() => void loadBackendStatus()}>
                Refresh backend status
              </Button>
            </div>
          </Card>
        </>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Welcome back</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Log in to Investclub
        </h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          This page expects only your email and password.
        </Text>
      </div>

      {feedback ? (
        <Callout title={feedback.title} color={feedbackColor}>
          {feedback.message}
        </Callout>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">
            Email
          </label>
          <TextInput
            id="login-email"
            placeholder="demo@investclub.dev"
            value={form.email}
            error={Boolean(errors.email)}
            errorMessage={errors.email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setForm((current) => ({ ...current, email: event.currentTarget.value }))
              setErrors((current) => ({ ...current, email: undefined }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
            Password
          </label>
          <TextInput
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            error={Boolean(errors.password)}
            errorMessage={errors.password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setForm((current) => ({ ...current, password: event.currentTarget.value }))
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
        </div>

        <Button className="w-full justify-center" type="submit" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <div className="rounded-2xl bg-slate-950 p-5 text-slate-100">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Demo credentials
        </p>
        <p className="mt-3 text-sm text-slate-300">Email: {demoCredentials.email}</p>
        <p className="mt-1 text-sm text-slate-300">Password: {demoCredentials.password}</p>
      </div>

      <div className="text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/register">
          Create one here.
        </Link>
      </div>

      <div className="text-sm text-slate-500">
        Forgot your password?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/forgot-password">
          Recover access here.
        </Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
