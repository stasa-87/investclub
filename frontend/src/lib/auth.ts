export const AUTH_STORAGE_KEY = 'investclub.auth.session'

export type AuthSession = {
  accessToken: string
  email: string
  displayName: string
  loggedInAt: string
  profilePhotoUrl?: string | null
  refreshToken: string
}

function deriveDisplayName(email: string) {
  const baseName = email.split('@')[0] ?? 'investor'

  return baseName
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export type AuthUser = {
  email: string
  profilePhotoUrl?: string | null
  username: string
}

export type LoginApiResponse = {
  refreshToken: string
  token: string
  user: AuthUser
}

export type BackendErrorResponse = {
  fieldErrors?: Record<string, string>
  message?: string
}

type RequestOptions = RequestInit & {
  auth?: boolean
  retryOnUnauthorized?: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || ''

const isDev = import.meta.env.DEV === true

function buildApiUrl(path: string) {
  return `${apiBaseUrl}${path}`
}

function debugLog(...args: unknown[]) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[investclub:api]', ...args)
  }
}

async function throwApiError(response: Response): Promise<never> {
  throw {
    response,
    ...(await parseApiError(response)),
  }
}

export async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const { auth = false, retryOnUnauthorized = auth, headers, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (auth) {
    const session = readAuthSession()

    if (!session?.accessToken) {
      throw new Error('Missing access token')
    }

    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const url = buildApiUrl(path)

  // Log the outgoing request in dev so the developer can see where requests go
  try {
    const headerObj: Record<string, string> = {}
    for (const [k, v] of requestHeaders.entries()) headerObj[k] = v
    debugLog('request:start', { method: (rest as any).method || 'GET', url, auth, headers: headerObj, bodyPreview: typeof (rest as any).body === 'string' ? ((rest as any).body as string).slice(0, 200) : undefined })
  } catch (e) {
    // ignore logging errors
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    })
  } catch (err) {
    debugLog('request:error', { url, err })
    throw err
  }

  if (auth && retryOnUnauthorized && response.status === 401) {
    const refreshed = await refreshAuthSession()
    requestHeaders.set('Authorization', `Bearer ${refreshed.token}`)

    response = await fetch(buildApiUrl(path), {
      ...rest,
      headers: requestHeaders,
    })
  }

  debugLog('request:finish', { url, status: response.status, ok: response.ok })
  return response
}

export async function parseApiError(response: Response) {
  try {
    const data = (await response.json()) as BackendErrorResponse
    return data
  } catch {
    return {
      message: 'Unexpected server response',
    } satisfies BackendErrorResponse
  }
}

export function readAuthSession(): AuthSession | null {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function writeAuthSession(payload: LoginApiResponse) {
  const session: AuthSession = {
    accessToken: payload.token,
    displayName: payload.user.username || deriveDisplayName(payload.user.email),
    email: payload.user.email,
    loggedInAt: new Date().toISOString(),
    profilePhotoUrl: payload.user.profilePhotoUrl,
    refreshToken: payload.refreshToken,
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isAuthenticated() {
  return readAuthSession() !== null
}

export async function loginWithBackend(usernameOrEmail: string, password: string) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password,
      usernameOrEmail,
    }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const payload = (await response.json()) as LoginApiResponse
  writeAuthSession(payload)
  return payload
}

export async function registerWithBackend(payload: {
  email: string
  password: string
  profilePhotoUrl?: string
  username: string
}) {
  const response = await request('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return (await response.json()) as AuthUser
}

export async function uploadProfilePhoto(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await request('/api/auth/me/profile-photo', {
    auth: true,
    method: 'PATCH',
    body: formData,
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const user = (await response.json()) as AuthUser
  const currentSession = readAuthSession()

  if (currentSession) {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        ...currentSession,
        displayName: user.username || currentSession.displayName,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
      } satisfies AuthSession),
    )
  }

  return user
}

export async function forgotPasswordWithBackend(email: string) {
  const response = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return (await response.json()) as { message: string; resetToken?: string | null }
}

export async function refreshAuthSession() {
  const session = readAuthSession()

  if (!session?.refreshToken) {
    clearAuthSession()
    throw new Error('No refresh token available')
  }

  const response = await request('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
    }),
  })

  if (!response.ok) {
    clearAuthSession()
    await throwApiError(response)
  }

  const payload = (await response.json()) as LoginApiResponse
  writeAuthSession(payload)
  return payload
}

export async function fetchCurrentUserProfile() {
  const response = await request('/api/auth/me', {
    auth: true,
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const user = (await response.json()) as AuthUser
  const currentSession = readAuthSession()

  if (currentSession) {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        ...currentSession,
        displayName: user.username || currentSession.displayName,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
      } satisfies AuthSession),
    )
  }

  return user
}

export async function resetPasswordWithBackend(token: string, newPassword: string) {
  const response = await request('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newPassword,
      token,
    }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return (await response.json()) as { message: string }
}
