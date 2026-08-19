const request = require('supertest')
const app = require('../index')
const mongoose = require('mongoose')
const prisma = require('../config/prisma')
const Task = require('../models/Task')

let token
let createdTaskId
const testEmail = `tasktest_${Date.now()}@example.com`

beforeAll(async () => {
  // Register and login test user
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Task Tester', email: testEmail, password: 'password123' })
  token = res.body.token
})

afterAll(async () => {
  await Task.deleteMany({ createdBy: { $regex: /./ } }) // clean test tasks
  await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {})
  await mongoose.connection.close()
  await prisma.$disconnect()
})

describe('GET /api/tasks', () => {
  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })

  it('should return tasks list for authenticated user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })
})

describe('POST /api/tasks', () => {
  it('should create a task successfully', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'A test task description',
        priority: 'high',
        status: 'todo',
        tags: ['test', 'jest'],
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.task.title).toBe('Test Task')
    expect(res.body.task.priority).toBe('high')
    createdTaskId = res.body.task._id
  })

  it('should return 400 for missing title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('GET /api/tasks/:id', () => {
  it('should return task by id', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.task._id).toBe(createdTaskId)
  })

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /api/tasks/:id', () => {
  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress', priority: 'medium' })

    expect(res.status).toBe(200)
    expect(res.body.task.status).toBe('in_progress')
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should return 404 for already deleted task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})
