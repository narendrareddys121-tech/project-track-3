import { useState } from 'react'
import { aiAPI } from '../services/api'
import { Sparkles, Copy, Check, Loader2, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AIAssistant({ tasks = [] }) {
  const [context, setContext] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeAction, setActiveAction] = useState(null)

  const handleSuggestTasks = async () => {
    if (!context.trim()) return toast.error('Describe your project first')
    setIsLoading(true)
    setActiveAction('suggest')
    try {
      const { data } = await aiAPI.suggestTasks({ context })
      setResult(data.suggestions)
    } catch {
      toast.error('AI is unavailable. Check your API key.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (tasks.length === 0) return toast.error('No tasks to summarize')
    setIsLoading(true)
    setActiveAction('summarize')
    try {
      const { data } = await aiAPI.summarize({
        tasks: tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority })),
      })
      setResult(data.summary)
    } catch {
      toast.error('AI is unavailable. Check your API key.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 rounded-xl p-5 text-white flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <p className="text-xs text-indigo-300">Powered by GPT</p>
        </div>
      </div>

      {/* Context input */}
      <div>
        <label className="text-xs text-indigo-300 mb-1 block">Project context</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Describe your project or goals..."
          rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSuggestTasks}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isLoading && activeAction === 'suggest' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          Suggest Tasks
        </button>
        <button
          onClick={handleSummarize}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isLoading && activeAction === 'summarize' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Summarize
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white/10 rounded-lg p-3 relative animate-fade-in">
          <pre className="text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-6">
            {result}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  )
}
