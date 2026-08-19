const prisma = require('../config/prisma')
const ActivityLog = require('../models/ActivityLog')

const logActivity = async (userId, action, resourceId, details = {}) => {
  try {
    await ActivityLog.create({ userId, action, resourceType: 'project', resourceId, details })
  } catch { /* non-fatal */ }
}

// GET /api/projects
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, projects })
  } catch (err) {
    next(err)
  }
}

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: { _count: { select: { members: true } } },
    })

    await logActivity(req.user.id, 'created_project', project.id, { name: project.name })
    res.status(201).json({ success: true, project })
  } catch (err) {
    next(err)
  }
}

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { members: true } },
      },
    })
    if (!project) { return res.status(404).json({ success: false, message: 'Project not found' }) }
    res.json({ success: true, project })
  } catch (err) {
    next(err)
  }
}

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, ownerId: req.user.id },
      data: { name, description },
    })
    if (project.count === 0) { return res.status(404).json({ success: false, message: 'Project not found or unauthorized' }) }
    const updated = await prisma.project.findUnique({ where: { id: req.params.id } })
    res.json({ success: true, project: updated })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await prisma.project.deleteMany({
      where: { id: req.params.id, ownerId: req.user.id },
    })
    if (project.count === 0) { return res.status(404).json({ success: false, message: 'Project not found or unauthorized' }) }
    await logActivity(req.user.id, 'deleted_project', req.params.id)
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    next(err)
  }
}

// POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'MEMBER' } = req.body
    if (!userId) { return res.status(400).json({ success: false, message: 'userId is required' }) }

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId, role },
    })
    res.status(201).json({ success: true, member })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAllProjects, createProject, getProjectById, updateProject, deleteProject, addMember }
