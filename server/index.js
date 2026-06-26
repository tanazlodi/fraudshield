require('dotenv').config({ path: '../.env' })
const express = require('express')
const http = require('http')
const cors = require('cors')
const mongoose = require('mongoose')
const { Server } = require('socket.io')

const transactionRoutes = require('./routes/transactions')
const analyticsRoutes = require('./routes/analytics')
const authRoutes = require('./routes/auth')
const initSocket = require('./socket/index')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Routes
const authenticate = require('./middleware/authenticate')

app.use('/api/auth', authRoutes)
app.use('/api/transactions', (req, res, next) => authenticate(req, res, next), transactionRoutes(io))
app.use('/api/analytics', (req, res, next) => authenticate(req, res, next), analyticsRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'FraudShield API is running' })
})

// Socket.io
initSocket(io)

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    server.listen(process.env.PORT, () => {
      console.log(`✅ Server running on port ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })

module.exports = { io }