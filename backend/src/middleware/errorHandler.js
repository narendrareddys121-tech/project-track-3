// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(`[Error] ${req.method} ${req.path}:`, err.message)

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' })
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, message: messages.join(', ') })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' })
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' })
  }

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
