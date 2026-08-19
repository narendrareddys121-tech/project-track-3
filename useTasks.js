import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useGetTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll(filters).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tasksAPI.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task'),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => tasksAPI.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update task'),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => tasksAPI.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete task'),
  })
}
