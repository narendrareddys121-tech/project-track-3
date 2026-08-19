const express = require('express')
const router = express.Router()
const aiController = require('../controllers/ai.controller')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.post('/suggest-tasks', aiController.suggestTasks)
router.post('/summarize', aiController.summarizeTasks)
router.post('/generate-description', aiController.generateDescription)

module.exports = router
