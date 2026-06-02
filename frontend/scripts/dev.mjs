import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'

// Load env file if present (convenience: repository keeps env files in /env)
// This will not override already set environment variables.
try {
  const candidates = [
    resolve(process.cwd(), '../env/frontend.env'),
    resolve(process.cwd(), '../../env/frontend.env'),
    resolve(process.cwd(), 'env/frontend.env'),
    resolve(process.cwd(), '.env'),
  ]

  for (const p of candidates) {
    try {
      const raw = readFileSync(p, 'utf8')
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return
        const eq = trimmed.indexOf('=')
        if (eq === -1) return
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        // Remove surrounding quotes if present
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (process.env[key] === undefined) {
          process.env[key] = value
        }
      })
      // stop after the first file we could read
      break
    } catch (e) {
      // ignore unreadable candidate
    }
  }
} catch (e) {
  // ignore env-load errors
}

const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173'
const backendUrl = process.env.VITE_API_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:8081'
const viteBin = resolve('node_modules', 'vite', 'bin', 'vite.js')
const viteArgs = [viteBin, ...process.argv.slice(2)]

console.log('Project endpoints:')
console.log(`- Frontend: ${frontendUrl}`)
console.log(`- Backend: ${backendUrl}`)
console.log('')

const viteProcess = spawn(process.execPath, viteArgs, {
  stdio: 'inherit',
  env: process.env,
})

viteProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
