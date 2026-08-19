const { chatCompletion } = require('../services/openai.service')

// POST /api/ai/suggest-tasks
const suggestTasks = async (req, res, next) => {
  try {
    const { context } = req.body
    if (!context?.trim()) {
      return res.status(400).json({ success: false, message: 'Project context is required' })
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an expert project manager. Given a project description, suggest 5 specific, actionable tasks. Format each task as: "- [Task Title]: [Brief description]"',
      },
      {
        role: 'user',
        content: `Project context: ${context}\n\nSuggest 5 tasks for this project.`,
      },
    ]

    const suggestions = await chatCompletion(messages)
    res.json({ success: true, suggestions })
  } catch (err) {
    next(err)
  }
}

// POST /api/ai/summarize
const summarizeTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body
    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Tasks array is required' })
    }

    const taskList = tasks
      .map((t, i) => `${i + 1}. ${t.title} [${t.status}/${t.priority}]`)
      .join('\n')

    const messages = [
      {
        role: 'system',
        content: 'You are a productivity analyst. Summarize the given task list, highlight what is completed, what is in progress, and give a recommendation for what to focus on next.',
      },
      {
        role: 'user',
        content: `Task list:\n${taskList}\n\nProvide a brief summary and recommendation.`,
      },
    ]

    const summary = await chatCompletion(messages)
    res.json({ success: true, summary })
  } catch (err) {
    next(err)
  }
}

// POST /api/ai/generate-description
const generateDescription = async (req, res, next) => {
  try {
    const { title } = req.body
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' })
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful project management assistant. Generate a clear, concise task description based on the given title. Keep it under 100 words and include success criteria.',
      },
      {
        role: 'user',
        content: `Task title: "${title}"\n\nGenerate a clear description for this task.`,
      },
    ]

    const description = await chatCompletion(messages)
    res.json({ success: true, description })
  } catch (err) {
    next(err)
  }
}

module.exports = { suggestTasks, summarizeTasks, generateDescription }
