require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { createServer } = require('http')
const { Server } = require('socket.io')

const connectMongo = require('./config/db')
const { rateLimiter } = require('./middleware/rateLimiter')
const errorHandler = require('./middleware/errorHandler')

// Routes
const authRoutes = require('./routes/auth.routes')
const taskRoutes = require('./routes/task.routes')
const projectRoutes = require('./routes/project.routes')
const aiRoutes = require('./routes/ai.routes')

const app = express()
const httpServer = createServer(app)

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Attach io to app for use in controllers
app.set('io', io)

// Core middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/ai', aiRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Centralized error handler
app.use(errorHandler)

// Socket.io events
io.on('connection', (socket) => {
  // eslint-disable-next-line no-console
  console.log(`⚡ Socket connected: ${socket.id}`)

  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`)
  })

  socket.on('disconnect', () => {
    // eslint-disable-next-line no-console
    console.log(`⚡ Socket disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 5000
const start = async () => {
  try {
    await connectMongo()
    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 TaskAI Server running on http://localhost:${PORT}`)
      // eslint-disable-next-line no-console
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()

module.exports = app
