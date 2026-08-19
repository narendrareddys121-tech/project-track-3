const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/', projectController.getAllProjects)
router.post('/', projectController.createProject)
router.get('/:id', projectController.getProjectById)
router.put('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)
router.post('/:id/members', projectController.addMember)

module.exports = router
