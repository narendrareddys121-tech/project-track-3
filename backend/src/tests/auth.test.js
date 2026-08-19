const request = require('supertest')
const app = require('../index')
const prisma = require('../config/prisma')
const mongoose = require('mongoose')

// Test user data
const testUser = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
}

afterAll(async () => {
  // Clean up test user
  await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {})
  await mongoose.connection.close()
  await prisma.$disconnect()
})

describe('POST /api/auth/register', () => {
  it('should register a new user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(testUser.email)
    expect(res.body.user.password).toBeUndefined() // password not returned
  })

  it('should return 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'pass123' })

    expect(res.status).toBe(400)
  })

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'new@example.com', password: '123' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
  })

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  let token

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
    token = res.body.token
  })

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(testUser.email)
  })

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
