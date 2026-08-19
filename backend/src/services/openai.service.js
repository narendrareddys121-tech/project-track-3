const OpenAI = require('openai')

let openaiClient = null

const getClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your_openai_api_key') {
    return null
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

/**
 * Call OpenAI chat completion.
 * Falls back to a mock response if OPENAI_API_KEY is not set.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model
 * @returns {Promise<string>}
 */
const chatCompletion = async (messages, model = 'gpt-3.5-turbo') => {
  const client = getClient()

  if (!client) {
    // Fallback mock response for development without API key
    return getMockResponse(messages)
  }

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || 'No response generated'
}

const getMockResponse = (messages) => {
  const lastMsg = messages[messages.length - 1]?.content || ''

  if (lastMsg.includes('Suggest 5 tasks')) {
    return `- Set up project repository: Initialize Git repo, configure CI/CD pipeline, and set up branch protection rules.
- Design database schema: Create ERD diagrams, define tables/collections, and review with team.
- Build REST API endpoints: Implement CRUD operations with proper error handling and validation.
- Create frontend UI components: Build reusable React components following the design system.
- Write unit and integration tests: Achieve 80% test coverage for all critical business logic.`
  }

  if (lastMsg.includes('summary')) {
    return `📊 Task Summary:\nYour project has a mix of tasks at various stages. Focus on completing in-progress items before starting new ones. Prioritize high-priority tasks first. Consider breaking down any large tasks into smaller subtasks for better progress tracking.`
  }

  if (lastMsg.includes('description')) {
    return `This task involves implementing the core functionality as described in the title. Success criteria: the feature is complete, tested, code-reviewed, and deployed to staging. Ensure documentation is updated and edge cases are handled appropriately.`
  }

  return `[AI Mock Response] This is a placeholder response. Add your OPENAI_API_KEY to .env to enable real AI responses.`
}

module.exports = { chatCompletion }
