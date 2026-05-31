import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

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
