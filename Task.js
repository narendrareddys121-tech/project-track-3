const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // References PostgreSQL project id (UUID string)
    projectId: {
      type: String,
      default: null,
    },
    // References PostgreSQL user id (UUID string)
    assignedTo: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    aiSuggestion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index for common queries
taskSchema.index({ createdBy: 1, status: 1 })
taskSchema.index({ projectId: 1 })

const Task = mongoose.model('Task', taskSchema)
module.exports = Task
