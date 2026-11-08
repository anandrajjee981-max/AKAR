import express from 'express'
import cors from 'cors'
import { createProxyServer } from 'httpxy'

const app = express()

// Full CORS support including PATCH & POST for agent file updates and iframe previews
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}))
app.get('/router/health', (req, res) => {
  res.send('req is healthy ')
})

const proxy = createProxyServer({
  changeOrigin: true,
  ws: true,
})

proxy.on('error', (err, req, res) => {
  console.error('[Router Proxy Error]:', err?.message || err)
  if (res && res.writeHead && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end(`Target not reachable: ${err?.message || err}`)
  } else if (res && res.destroy) {
    res.destroy()
  }
})

export function getTarget(req) {
  const host = (req.headers.host || '').replace(/:\d+$/, '')
  const [firstLabel, secondLabel] = host.split('.')

  if (secondLabel === 'agent' || firstLabel.endsWith('-agent')) {
    const sandboxid = secondLabel === 'agent'
      ? firstLabel
      : firstLabel.slice(0, -'-agent'.length)
    return `http://sandbox-service-${sandboxid}:3000`
  }

  const sandboxid = firstLabel.endsWith('-preview')
    ? firstLabel.slice(0, -'-preview'.length)
    : firstLabel

  return `http://sandbox-service-${sandboxid}:80`
}

app.use(async (req, res, next) => {
  try {
    const target = getTarget(req)
    await proxy.web(req, res, { target })
  } catch (err) {
    next(err)
  }
})

export function handleUpgrade(req, socket, head) {
  try {
    const target = getTarget(req)
    proxy.ws(req, socket, { target }, head)
  } catch (err) {
    console.error('[Router Upgrade Error]:', err?.message || err)
    socket.destroy()
  }
}

export default app
