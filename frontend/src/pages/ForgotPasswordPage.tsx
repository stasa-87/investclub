import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Callout, Card, Text, TextInput } from '@tremor/react'
import AuthLayout from '../components/AuthLayout'
import { forgotPasswordWithBackend } from '../lib/auth'

type FeedbackState = {
  tone: 'blue' | 'red' | 'teal'
  title: string
  message: string
}

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

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>({
    tone: 'blue',
    title: 'Password recovery',
    message: 'Enter your email and we will prepare a password reset flow for the future backend integration.',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address')
      setFeedback({
        tone: 'red',
        title: 'Invalid email',
        message: 'Provide the email for the account you want to recover.',
      })
      return
    }

    setError(null)
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await forgotPasswordWithBackend(email)
      setFeedback({
        tone: 'teal',
        title: 'Reset request created',
        message: result.resetToken
          ? `${result.message} Local-dev reset token: ${result.resetToken}`
          : result.message,
      })

      if (result.resetToken) {
        window.setTimeout(() => {
          navigate(`/reset-password?token=${encodeURIComponent(result.resetToken ?? '')}`)
        }, 900)
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Password recovery failed'

      setFeedback({
        tone: 'red',
        title: 'Recovery failed',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const feedbackColor = feedback ? mapToneToColor(feedback.tone) : 'blue'

  return (
    <AuthLayout
      accent="blue"
      badge="Account recovery"
      title="Reset your password."
      description="Use this page when you forgot your password. It currently runs as a frontend-only placeholder until the backend recovery flow is implemented."
      sidePanel={
        <Card className="border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Recovery notes
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Enter the email address tied to your account.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                The real reset email flow will be connected to the backend later.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                You can always return to login or create a new account if needed.
              </div>
            </div>
          </div>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
          Forgot password
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Recover account access
        </h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          This page expects only the account email so we can start a recovery request.
        </Text>
      </div>

      {feedback ? (
        <Callout title={feedback.title} color={feedbackColor}>
          {feedback.message}
        </Callout>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="forgot-password-email">
            Email
          </label>
          <TextInput
            id="forgot-password-email"
            placeholder="demo@investclub.dev"
            value={email}
            error={Boolean(error)}
            errorMessage={error ?? undefined}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setEmail(event.currentTarget.value)
              setError(null)
            }}
          />
        </div>

        <Button className="w-full justify-center" loading={isSubmitting} type="submit">
          Send recovery request
        </Button>
      </form>

      <div className="text-sm text-slate-500">
        Remembered your password?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/">
          Go back to login.
        </Link>
      </div>

      <div className="text-sm text-slate-500">
        Need a brand new account?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/register">
          Go to registration.
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
