const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const prisma = require('../config/prisma')

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

// Zod validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    const token = signToken(user)
    res.status(201).json({ success: true, token, user })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = signToken(user)
    const { password: _, ...safeUser } = user
    res.json({ success: true, token, user: safeUser })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    })
    if (!user) { return res.status(404).json({ success: false, message: 'User not found' }) }
    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
const logout = (_req, res) => {
  // JWT is stateless; client should discard the token
  res.json({ success: true, message: 'Logged out successfully' })
}

// GET /api/auth/google
const googleRedirect = (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const callbackUrl = encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback')
  const scope = encodeURIComponent('profile email')
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=${scope}`
  res.redirect(googleAuthUrl)
}

// GET /api/auth/google/callback
const googleCallback = async (req, res) => {
  // In a full implementation this would exchange code for token
  // For now return a friendly message
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`)
}

module.exports = { register, login, getMe, logout, googleRedirect, googleCallback }
