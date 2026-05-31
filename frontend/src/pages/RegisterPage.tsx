import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Callout, Card, Divider, Text, TextInput } from '@tremor/react'
import AuthLayout from '../components/AuthLayout'
import { loginWithBackend, registerWithBackend, uploadProfilePhoto } from '../lib/auth'

type FormState = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
  profilePhotoName: string
  profilePhotoPreview: string
}

type FormErrors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreedToTerms?: string
}

type FeedbackState = {
  tone: 'blue' | 'red' | 'teal'
  title: string
  message: string
}

const demoCredentials = {
  email: 'demo@investclub.dev',
  password: 'Demo123',
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

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: demoCredentials.email,
    password: demoCredentials.password,
    confirmPassword: '',
    agreedToTerms: false,
    profilePhotoName: '',
    profilePhotoPreview: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [selectedProfilePhotoFile, setSelectedProfilePhotoFile] = useState<File | null>(null)

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = 'Username must be at least 3 characters'
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters'
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match'
    }

    if (!form.agreedToTerms) {
      nextErrors.agreedToTerms = 'You must agree to the terms and conditions'
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
      await registerWithBackend({
        email: form.email,
        password: form.password,
        profilePhotoUrl: undefined,
        username: form.fullName.trim(),
      })

      await loginWithBackend(form.email, form.password)

      if (selectedProfilePhotoFile) {
        await uploadProfilePhoto(selectedProfilePhotoFile)
      }

      setFeedback({
        tone: 'teal',
        title: 'Registration successful',
        message: 'Your backend account has been created successfully. Redirecting to the dashboard...',
      })
      navigate('/dashboard')
    } catch (error) {
      const backendMessage =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Registration failed'

      const fieldErrors =
        typeof error === 'object' && error !== null && 'fieldErrors' in error && typeof error.fieldErrors === 'object'
          ? (error.fieldErrors as Record<string, string>)
          : null

      if (fieldErrors) {
        setErrors((current) => ({
          ...current,
          email: fieldErrors.email ?? current.email,
          fullName: fieldErrors.username ?? current.fullName,
          password: fieldErrors.password ?? current.password,
        }))
      }

      setFeedback({
        tone: 'red',
        title: 'Registration failed',
        message: backendMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const feedbackColor = feedback ? mapToneToColor(feedback.tone) : 'blue'

  return (
    <AuthLayout
      accent="emerald"
      badge="New member onboarding"
      title="Create your Investclub account."
      description="Registration is now a dedicated route. Here we clearly expect data for a new user profile: user name, email, password, and optionally a profile photo."
      sidePanel={
        <Card className="border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Registration notes
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Expected inputs: new user name, email, password, and optional profile photo.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Validation stays local until the real authentication API is connected.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Frontend UI work in this project should continue using Tremor UI and Tailwind CSS.
              </div>
            </div>
          </div>
        </Card>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Join us</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Create an Investclub account
        </h2>
        <Text className="mt-3 text-sm leading-6 text-slate-600">
          Fill in the new user details below. Name, email, and password are required. Profile photo
          is optional.
        </Text>
      </div>

      {feedback ? (
        <Callout title={feedback.title} color={feedbackColor}>
          {feedback.message}
        </Callout>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-full-name">
            User name
          </label>
          <TextInput
            id="register-full-name"
            placeholder="Stanislav Yordanov"
            value={form.fullName}
            error={Boolean(errors.fullName)}
            errorMessage={errors.fullName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setForm((current) => ({ ...current, fullName: event.currentTarget.value }))
              setErrors((current) => ({ ...current, fullName: undefined }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-email">
            Email
          </label>
          <TextInput
            id="register-email"
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
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-password">
            Password
          </label>
          <TextInput
            id="register-password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            error={Boolean(errors.password)}
            errorMessage={errors.password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setForm((current) => ({ ...current, password: event.currentTarget.value }))
              setErrors((current) => ({
                ...current,
                password: undefined,
                confirmPassword: undefined,
              }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-confirm-password">
            Confirm password
          </label>
          <TextInput
            id="register-confirm-password"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            error={Boolean(errors.confirmPassword)}
            errorMessage={errors.confirmPassword}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setForm((current) => ({ ...current, confirmPassword: event.currentTarget.value }))
              setErrors((current) => ({ ...current, confirmPassword: undefined }))
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-profile-photo">
            Profile photo (optional)
          </label>
            <input
              id="register-profile-photo"
              type="file"
            accept="image/*"
              className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const selectedFile = event.currentTarget.files?.[0]

                if (!selectedFile) {
                  setSelectedProfilePhotoFile(null)
                  setForm((current) => ({
                    ...current,
                    profilePhotoName: '',
                    profilePhotoPreview: '',
                  }))
                  return
                }

                const previewUrl = URL.createObjectURL(selectedFile)
                setSelectedProfilePhotoFile(selectedFile)

                setForm((current) => {
                  if (current.profilePhotoPreview) {
                    URL.revokeObjectURL(current.profilePhotoPreview)
                  }

                  return {
                    ...current,
                    profilePhotoName: selectedFile.name,
                    profilePhotoPreview: previewUrl,
                  }
                })
              }}
            />
            <Text className="text-sm text-slate-500">
              {form.profilePhotoName || 'No photo selected yet.'}
            </Text>
            {form.profilePhotoPreview ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3">
                <img
                  alt="Profile preview"
                  className="h-40 w-40 rounded-2xl object-cover"
                  src={form.profilePhotoPreview}
                />
              </div>
            ) : null}
          </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <input
              id="register-terms"
              type="checkbox"
              checked={form.agreedToTerms}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setForm((current) => ({ ...current, agreedToTerms: event.currentTarget.checked }))
                setErrors((current) => ({ ...current, agreedToTerms: undefined }))
              }}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="register-terms">
                I agree to the terms and conditions
              </label>
              <p className="text-sm leading-6 text-slate-500">
                By continuing, you confirm this is still a local demo experience until the real auth
                API is connected.
              </p>
            </div>
          </div>
          {errors.agreedToTerms ? (
            <p className="mt-3 text-sm text-red-600">{errors.agreedToTerms}</p>
          ) : null}
        </div>

        <Button className="w-full justify-center" type="submit" loading={isSubmitting}>
          Sign up
        </Button>
      </form>

      <Divider />

      <div className="rounded-2xl bg-slate-950 p-5 text-slate-100">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
          Demo credentials
        </p>
        <p className="mt-3 text-sm text-slate-300">Email: {demoCredentials.email}</p>
        <p className="mt-1 text-sm text-slate-300">Password: {demoCredentials.password}</p>
      </div>

      <div className="text-sm text-slate-500">
        Already have an account?{' '}
        <Link className="font-medium text-emerald-700 hover:text-emerald-900" to="/">
          Go back to login.
        </Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
