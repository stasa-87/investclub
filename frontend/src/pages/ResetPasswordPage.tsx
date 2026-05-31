import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Callout, Card, Text, TextInput } from '@tremor/react'
import AuthLayout from '../components/AuthLayout'
import { resetPasswordWithBackend } from '../lib/auth'

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

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') ?? ''
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; token?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>({
    tone: 'blue',
    title: 'Reset password',
    message: 'Provide the reset token and choose a new password for your account.',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: { newPassword?: string; confirmPassword?: string; token?: string } = {}

    if (!token.trim()) {
      nextErrors.token = 'Reset token is required'
    }

    if (newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters'
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        tone: 'red',
        title: 'Reset failed',
        message: 'Fix the highlighted fields and try again.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await resetPasswordWithBackend(token.trim(), newPassword)
      setFeedback({
        tone: 'teal',
        title: 'Password updated',
        message: `${result.message} Redirecting to login...`,
      })

      window.setTimeout(() => {
        navigate('/')
      }, 1200)
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Password reset failed'

      setFeedback({
        tone: 'red',
        title: 'Reset failed',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const feedbackColor = feedback ? mapToneToColor(feedback.tone) : 'blue'

  return (
    <AuthLayout
      accent="emerald"
      badge="Reset password"
      title="Choose a new password."
      description="Use the reset token generated from forgot-password and set a new password that meets backend requirements."
      sidePanel={
        <Card className="border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Reset notes
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                The backend expects a valid reset token and a new password with at least 8 characters.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                In local development, forgot-password currently returns the reset token directly.
              </div>
            </div>
          </div>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Complete reset</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Create your new password
        </h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          Paste the token and confirm the new password to finish the reset flow.
        </Text>
      </div>

      {feedback ? (
        <Callout title={feedback.title} color={feedbackColor}>
          {feedback.message}
        </Callout>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="reset-token">
            Reset token
          </label>
          <TextInput
            id="reset-token"
            value={token}
            error={Boolean(errors.token)}
            errorMessage={errors.token}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setToken(event.currentTarget.value)
              setErrors((current) => ({ ...current, token: undefined }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="reset-new-password">
            New password
          </label>
          <TextInput
            id="reset-new-password"
            type="password"
            value={newPassword}
            error={Boolean(errors.newPassword)}
            errorMessage={errors.newPassword}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setNewPassword(event.currentTarget.value)
              setErrors((current) => ({ ...current, newPassword: undefined }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="reset-confirm-password">
            Confirm new password
          </label>
          <TextInput
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            error={Boolean(errors.confirmPassword)}
            errorMessage={errors.confirmPassword}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setConfirmPassword(event.currentTarget.value)
              setErrors((current) => ({ ...current, confirmPassword: undefined }))
            }}
          />
        </div>

        <Button className="w-full justify-center" loading={isSubmitting} type="submit">
          Reset password
        </Button>
      </form>

      <div className="text-sm text-slate-500">
        Back to login?{' '}
        <Link className="font-medium text-emerald-700 hover:text-emerald-900" to="/">
          Return here.
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ResetPasswordPage
