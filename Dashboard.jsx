import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGetTasks } from '../hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import { CheckSquare, FolderKanban, Clock, TrendingUp, Plus } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: tasksData, isLoading: tasksLoading } = useGetTasks()
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((r) => r.data),
  })

  const tasks = tasksData?.tasks || []
  const projects = projectsData?.projects || []

  const stats = [
    {
      label: 'Total Tasks',
      value: tasks.length,
      icon: CheckSquare,
      color: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      label: 'In Progress',
      value: tasks.filter((t) => t.status === 'in_progress').length,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Completed',
      value: tasks.filter((t) => t.status === 'done').length,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100',
    },
    {
      label: 'Projects',
      value: projects.length,
      icon: FolderKanban,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  ]

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const completionPct = tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your projects today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, border }) => (
            <div key={label} className={`card p-5 border ${border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="card p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800">Overall Progress</h3>
              <span className="text-sm font-bold text-indigo-600">{completionPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {tasks.filter((t) => t.status === 'done').length} of {tasks.length} tasks completed
            </p>
          </div>
        )}

        {/* Recent Tasks + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Tasks</h2>
              <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all →
              </Link>
            </div>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No tasks yet</p>
                <p className="text-slate-400 text-sm mt-1">Create your first task to get started</p>
                <Link to="/tasks" className="btn-primary mt-4 inline-flex">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {recentTasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <Link to="/tasks" className="card p-4 flex items-center gap-4 hover:border-indigo-300 cursor-pointer group block">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Plus className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">New Task</p>
                <p className="text-xs text-slate-500">Add a task to your board</p>
              </div>
            </Link>
            <Link to="/projects" className="card p-4 flex items-center gap-4 hover:border-purple-300 cursor-pointer group block">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <FolderKanban className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">New Project</p>
                <p className="text-xs text-slate-500">Organize tasks by project</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
