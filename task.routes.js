const express = require('express')
const router = express.Router()
const taskController = require('../controllers/task.controller')
const { verifyToken } = require('../middleware/auth')

// All task routes require authentication
router.use(verifyToken)

router.get('/', taskController.getAllTasks)
router.post('/', taskController.createTask)
router.get('/:id', taskController.getTaskById)
router.put('/:id', taskController.updateTask)
router.delete('/:id', taskController.deleteTask)
router.post('/:id/ai-suggest', taskController.getAISuggestion)

module.exports = router
