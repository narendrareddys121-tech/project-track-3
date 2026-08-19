const Task = require('../models/Task')
const ActivityLog = require('../models/ActivityLog')
const { chatCompletion } = require('../services/openai.service')
const { cacheGet, cacheSet, cacheDel } = require('../config/redis')

const logActivity = async (userId, action, resourceType, resourceId, details = {}) => {
  try {
    await ActivityLog.create({ userId, action, resourceType, resourceId, details })
  } catch { /* non-fatal */ }
}

// GET /api/tasks
const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority, projectId, page = 1, limit = 20 } = req.query
    const cacheKey = `tasks:${req.user.id}:${JSON.stringify(req.query)}`

    const cached = await cacheGet(cacheKey)
    if (cached) { return res.json({ success: true, ...cached, fromCache: true }) }

    const filter = { createdBy: req.user.id }
    if (status) { filter.status = status }
    if (priority) { filter.priority = priority }
    if (projectId) { filter.projectId = projectId }

    const skip = (Number(page) - 1) * Number(limit)
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ])

    const result = { tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    await cacheSet(cacheKey, result, 60)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, projectId, assignedTo, dueDate, tags } = req.body
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      status,
      priority,
      projectId,
      assignedTo,
      dueDate,
      tags,
      createdBy: req.user.id,
    })

    await cacheDel(`tasks:${req.user.id}:*`)
    await logActivity(req.user.id, 'created_task', 'task', task._id, { title: task.title })

    // Emit socket event
    const io = req.app.get('io')
    if (io && projectId) {
      io.to(`project:${projectId}`).emit('task:created', task)
    }

    res.status(201).json({ success: true, task })
  } catch (err) {
    next(err)
  }
}

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user.id })
    if (!task) { return res.status(404).json({ success: false, message: 'Task not found' }) }
    res.json({ success: true, task })
  } catch (err) {
    next(err)
  }
}

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!task) { return res.status(404).json({ success: false, message: 'Task not found' }) }

    await cacheDel(`tasks:${req.user.id}:*`)
    await logActivity(req.user.id, 'updated_task', 'task', task._id, { changes: Object.keys(req.body) })

    const io = req.app.get('io')
    if (io && task.projectId) {
      io.to(`project:${task.projectId}`).emit('task:updated', task)
    }

    res.json({ success: true, task })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id })
    if (!task) { return res.status(404).json({ success: false, message: 'Task not found' }) }

    await cacheDel(`tasks:${req.user.id}:*`)
    await logActivity(req.user.id, 'deleted_task', 'task', req.params.id, { title: task.title })

    res.json({ success: true, message: 'Task deleted' })
  } catch (err) {
    next(err)
  }
}

// POST /api/tasks/:id/ai-suggest
const getAISuggestion = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user.id })
    if (!task) { return res.status(404).json({ success: false, message: 'Task not found' }) }

    const messages = [
      { role: 'system', content: 'You are a helpful productivity assistant. Give a concise, actionable improvement suggestion for the given task. Keep it under 100 words.' },
      { role: 'user', content: `Task: "${task.title}"\nDescription: "${task.description || 'none'}"\nStatus: ${task.status}\nPriority: ${task.priority}\n\nGive one specific, actionable suggestion to improve or complete this task.` },
    ]

    const suggestion = await chatCompletion(messages)
    task.aiSuggestion = suggestion
    await task.save()

    res.json({ success: true, suggestion, task })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAllTasks, createTask, getTaskById, updateTask, deleteTask, getAISuggestion }
