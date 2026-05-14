import { spawn, type Subprocess } from 'bun'

const PORT = process.env.PORT ?? '3001'

// Kill any stale process on the server port
const stale = Bun.spawnSync(['bash', '-c', `lsof -ti :${PORT} | xargs kill -9 2>/dev/null; true`])
if (stale.exitCode !== 0 && stale.exitCode !== null) {
  // non-fatal — port was simply free
}

const colors = { reset: '\x1b[0m', dim: '\x1b[2m', cyan: '\x1b[36m', yellow: '\x1b[33m' }

function prefix(label: string, color: string) {
  return `${color}[${label}]${colors.reset} `
}

function pipe(proc: Subprocess, label: string, color: string) {
  const pfx = prefix(label, color)
  ;(async () => {
    for await (const chunk of proc.stdout as AsyncIterable<Uint8Array>) {
      process.stdout.write(pfx + new TextDecoder().decode(chunk).trimEnd() + '\n')
    }
  })()
  ;(async () => {
    for await (const chunk of proc.stderr as AsyncIterable<Uint8Array>) {
      process.stderr.write(pfx + new TextDecoder().decode(chunk).trimEnd() + '\n')
    }
  })()
}

const server = spawn(['bun', '--hot', 'src/server/index.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})

const client = spawn(['bun', 'run', 'dev:client'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})

pipe(server, 'server', colors.cyan)
pipe(client, 'client', colors.yellow)

function shutdown() {
  try { server.kill('SIGKILL') } catch {}
  try { client.kill('SIGKILL') } catch {}
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const [serverExit] = await Promise.race([
  server.exited.then((code) => ['server', code] as const),
  client.exited.then((code) => ['client', code] as const),
])

console.error(`\n${serverExit} process exited — shutting down`)
shutdown()
