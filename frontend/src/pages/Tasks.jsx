import { useState } from 'react'
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import AIAssistant from '../components/AIAssistant'
import { Plus, Search, X, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]
const PRIORITIES = ['', 'low', 'medium', 'high']

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', projectId: '', dueDate: '', tags: '' }

export default function Tasks() {
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useGetTasks(filters)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((r) => r.data),
  })
  const projects = projectsData?.projects || []
  const tasks = (data?.tasks || []).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditTask(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (task) => {
    setEditTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      projectId: task.projectId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tags: (task.tags || []).join(', '),
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      dueDate: form.dueDate || undefined,
    }
    try {
      if (editTask) {
        await updateTask.mutateAsync({ id: editTask._id, ...payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      setShowModal(false)
    } catch { /* toast handled in hook */ }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    await deleteTask.mutateAsync(id)
  }

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>

        <div className="flex gap-6">
          {/* Left: filters + tasks */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="input-field pl-9 py-2"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <div className="flex gap-1">
                  {STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ ...filters, status: value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.status === value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input-field py-1.5 w-auto text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}</option>
                ))}
              </select>
            </div>

            {/* Tasks grid */}
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1,2,3,4].map((i) => <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-lg mb-2">No tasks found</p>
                <button onClick={openCreate} className="btn-primary gap-2">
                  <Plus className="w-4 h-4" /> Create first task
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Right: AI Assistant */}
          <div className="hidden xl:block w-72 shrink-0">
            <AIAssistant tasks={tasks} />
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input value={form.title} onChange={update('title')} placeholder="Task title" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={update('description')} placeholder="Optional description..." rows={3} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={update('status')} className="input-field">
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={update('priority')} className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <select value={form.projectId} onChange={update('projectId')} className="input-field">
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due date</label>
                <input type="date" value={form.dueDate} onChange={update('dueDate')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={update('tags')} placeholder="design, backend, urgent" className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createTask.isPending || updateTask.isPending} className="btn-primary flex-1">
                  {editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
