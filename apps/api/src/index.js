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
