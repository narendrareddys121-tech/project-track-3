import { Trash2, Pencil, Calendar, Tag } from 'lucide-react'

const STATUS_STYLES = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}
const STATUS_LABELS = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' }

const PRIORITY_STYLES = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export default function TaskCard({ task, onEdit, onDelete }) {
  const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.todo
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium

  const formatDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div className="card p-4 flex flex-col gap-3 animate-slide-up group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug flex-1">{task.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit?.(task)}
            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(task._id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* AI Suggestion */}
      {task.aiSuggestion && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-2">
          <p className="text-xs text-indigo-700 flex gap-1">
            <span className="font-semibold shrink-0">🤖 AI:</span>
            <span className="line-clamp-2">{task.aiSuggestion}</span>
          </p>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`badge ${statusStyle}`}>{STATUS_LABELS[task.status]}</span>
        <span className={`badge ${priorityStyle} capitalize`}>{task.priority}</span>
      </div>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Tag className="w-3 h-3 text-slate-400" />
          {task.tags.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs mt-auto ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Calendar className="w-3.5 h-3.5" />
          {isOverdue && <span className="font-semibold">Overdue · </span>}
          {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  )
}
