const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const { verifyToken } = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimiter')

router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)
router.get('/me', verifyToken, authController.getMe)
router.post('/logout', verifyToken, authController.logout)

// Google OAuth
router.get('/google', authController.googleRedirect)
router.get('/google/callback', authController.googleCallback)

module.exports = router
