const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'created_task', 'updated_task', 'deleted_task', 'created_project'
    },
    resourceType: {
      type: String,
      enum: ['task', 'project', 'user'],
      required: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ resourceType: 1, resourceId: 1 })

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
module.exports = ActivityLog
