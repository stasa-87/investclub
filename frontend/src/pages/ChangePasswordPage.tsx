import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Callout, Card, Text, TextInput } from '@tremor/react'
import AuthLayout from '../components/AuthLayout'
import { forgotPasswordWithBackend, readAuthSession } from '../lib/auth'

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

function ChangePasswordPage() {
  const navigate = useNavigate()
  const session = readAuthSession()
  const [email, setEmail] = useState(session?.email ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>({
    tone: 'blue',
    title: 'Change password',
    message: 'Request a fresh reset token for your logged-in account, then complete the update on the reset password page.',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await forgotPasswordWithBackend(email)
      setFeedback({
        tone: 'teal',
        title: 'Change password link ready',
        message: result.resetToken
          ? `${result.message} Redirecting you to the reset password page with the local-dev token.`
          : result.message,
      })

      if (result.resetToken) {
        window.setTimeout(() => {
          navigate(`/reset-password?token=${encodeURIComponent(result.resetToken ?? '')}`)
        }, 1000)
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Could not start password change flow'

      setFeedback({
        tone: 'red',
        title: 'Password change failed',
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
      badge="Account settings"
      title="Change your password."
      description="This private page is available only when you are logged in. It starts the password change flow for the current account."
      sidePanel={
        <Card className="border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Secure flow
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                This page is private and visible only to authenticated users.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                The backend will generate a reset token for the signed-in account.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                In local development you are redirected to the reset form automatically.
              </div>
            </div>
          </div>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Security</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Request a password update</h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          Confirm the account email and we will start the password reset flow for your current user.
        </Text>
      </div>

      {feedback ? (
        <Callout title={feedback.title} color={feedbackColor}>
          {feedback.message}
        </Callout>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="change-password-email">
            Account email
          </label>
          <TextInput
            id="change-password-email"
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setEmail(event.currentTarget.value)
            }}
          />
        </div>

        <Button className="w-full justify-center" loading={isSubmitting} type="submit">
          Continue to reset password
        </Button>
      </form>

      <div className="text-sm text-slate-500">
        Back to dashboard?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to="/dashboard">
          Return here.
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ChangePasswordPage
