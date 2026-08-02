const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Liveness probe — is the process alive?
app.get('/healthz/live', (req, res) => {
  res.json({ status: 'ok' })
})

// Readiness probe — is the app ready to serve traffic?
// Only returns 200 once all dependencies are reachable
app.get('/healthz/ready', async (req, res) => {
  try {
    // Add real dependency checks here (DB ping, Redis ping, etc.)
    res.json({ status: 'ok' })
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message })
  }
})

// Main API route
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'API is running',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    pod: process.env.POD_NAME || 'unknown',
  })
})

// HTML status page
app.get('/', (req, res) => {
  const pod = process.env.POD_NAME || 'unknown'
  const version = process.env.APP_VERSION || '1.0.0'
  const env = process.env.NODE_ENV || 'production'
  const uptime = Math.floor(process.uptime())
  const uptimeStr = uptime < 60 ? uptime + 's'
    : uptime < 3600 ? Math.floor(uptime / 60) + 'm'
    : Math.floor(uptime / 3600) + 'h ' + Math.floor((uptime % 3600) / 60) + 'm'

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Service — livinstone.dev</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #060910;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .glow {
      position: fixed;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 400px;
      background: radial-gradient(ellipse, #1f6feb18 0%, transparent 70%);
      pointer-events: none;
    }
    .container { width: 100%; max-width: 520px; position: relative; z-index: 1; }
    .header { text-align: center; margin-bottom: 36px; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #0d1f0d;
      border: 1px solid #238636;
      color: #3fb950;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
      margin-bottom: 24px;
    }
    .pulse {
      width: 8px;
      height: 8px;
      background: #3fb950;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    h1 { font-size: 32px; font-weight: 700; color: #f0f6fc; letter-spacing: -0.5px; margin-bottom: 10px; line-height: 1.2; }
    h1 span { color: #58a6ff; }
    .tagline { color: #8b949e; font-size: 15px; line-height: 1.6; max-width: 380px; margin: 0 auto; }
    .card { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; overflow: hidden; margin-bottom: 16px; }
    .card-header {
      padding: 14px 20px;
      border-bottom: 1px solid #21262d;
      font-size: 12px;
      font-weight: 600;
      color: #8b949e;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: #161b22;
    }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; }
    .metric { padding: 18px 20px; border-right: 1px solid #21262d; border-bottom: 1px solid #21262d; }
    .metric:nth-child(2n) { border-right: none; }
    .metric:nth-last-child(-n+2) { border-bottom: none; }
    .metric-label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; font-weight: 500; }
    .metric-value { font-size: 15px; color: #e6edf3; font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .metric-value.green { color: #3fb950; }
    .metric-value.blue { color: #58a6ff; }
    .endpoints { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
    .endpoint { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #21262d; text-decoration: none; transition: background 0.15s; }
    .endpoint:last-child { border-bottom: none; }
    .endpoint:hover { background: #161b22; }
    .method { font-size: 11px; font-weight: 700; font-family: monospace; padding: 3px 8px; border-radius: 5px; background: #1f3a1f; color: #3fb950; min-width: 40px; text-align: center; }
    .path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; color: #58a6ff; flex: 1; }
    .desc { font-size: 12px; color: #8b949e; }
    .footer { text-align: center; font-size: 12px; color: #484f58; line-height: 1.8; }
    .footer a { color: #58a6ff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .divider { margin: 0 8px; opacity: 0.4; }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="container">
    <div class="header">
      <div class="status-pill"><span class="pulse"></span> All systems operational</div>
      <h1>Production <span>API</span> Service</h1>
      <p class="tagline">
        This service runs on a Kubernetes cluster provisioned with Terraform,
        scaled automatically with HPA, and routed through an AWS ALB.
        Every pod you see here was deployed without writing a single server config by hand.
      </p>
    </div>
    <div class="card">
      <div class="card-header">Runtime Info</div>
      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Status</div>
          <div class="metric-value green">healthy</div>
        </div>
        <div class="metric">
          <div class="metric-label">Environment</div>
          <div class="metric-value blue">${env}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Version</div>
          <div class="metric-value">${version}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Uptime</div>
          <div class="metric-value">${uptimeStr}</div>
        </div>
        <div class="metric" style="grid-column: span 2">
          <div class="metric-label">Pod</div>
          <div class="metric-value">${pod}</div>
        </div>
      </div>
    </div>
    <div class="endpoints">
      <div class="card-header">Available Endpoints</div>
      <a href="/api/v1/status" class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/v1/status</span>
        <span class="desc">JSON status</span>
      </a>
      <a href="/healthz/ready" class="endpoint">
        <span class="method">GET</span>
        <span class="path">/healthz/ready</span>
        <span class="desc">Readiness probe</span>
      </a>
      <a href="/healthz/live" class="endpoint">
        <span class="method">GET</span>
        <span class="path">/healthz/live</span>
        <span class="desc">Liveness probe</span>
      </a>
    </div>
    <div class="footer">
      Built by <a href="https://livinstone.dev" target="_blank">Tisighe Livinstone</a>
      <span class="divider">&middot;</span>
      AWS EKS
      <span class="divider">&middot;</span>
      Terraform
      <span class="divider">&middot;</span>
      Helm
      <br />
      <a href="https://github.com/TisigheLivinstone/eks-app-deployment" target="_blank">View source on GitHub</a>
    </div>
  </div>
</body>
</html>`)
})

// Graceful shutdown — handle SIGTERM from Kubernetes
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
  setTimeout(() => {
    console.log('Forcing exit')
    process.exit(1)
  }, 25000)
})

const server = app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
