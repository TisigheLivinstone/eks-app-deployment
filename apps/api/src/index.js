const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/healthz/live', (req, res) => res.json({ status: 'ok' }))

app.get('/healthz/ready', async (req, res) => {
  try {
    res.json({ status: 'ok' })
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message })
  }
})

app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'API is running',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    pod: process.env.POD_NAME || 'unknown',
  })
})

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>livinstone.dev — API</title>
  <style>
    body {
      margin: 0;
      background: #0d1117;
      color: #8b949e;
      font-family: -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    h1 { color: #f0f6fc; font-size: 24px; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; max-width: 360px; margin: 0 auto 24px; }
    a { color: #58a6ff; text-decoration: none; margin: 0 10px; font-size: 14px; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #3fb950; border-radius: 50%; margin-right: 6px; }
    .status { color: #3fb950; font-size: 13px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div>
    <div class="status"><span class="dot"></span>All systems running</div>
    <h1>This is a live Kubernetes deployment.</h1>
    <p>Built to demonstrate deploying and scaling applications on AWS EKS — provisioned with Terraform, packaged with Helm, and scaled automatically with HPA.</p>
    <div>
      <a href="https://livinstone.dev" target="_blank">Portfolio</a>
      <a href="/api/v1/status">API Status</a>
      <a href="https://github.com/TisigheLivinstone/eks-app-deployment" target="_blank">GitHub</a>
    </div>
  </div>
</body>
</html>`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully')
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 25000)
})

const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))