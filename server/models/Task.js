import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['short-term', 'long-term'],
    default: 'short-term'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  // Progress tracking (0-100)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  // Tracking type: 'progress' (percentage), 'subtasks', or 'value' (numeric target)
  trackingType: {
    type: String,
    enum: ['progress', 'subtasks', 'value'],
    default: 'progress'
  },
  // For value-based tracking (e.g., 10000 steps)
  targetValue: {
    type: Number,
    default: null
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: '' // e.g., 'steps', 'hours', 'pages'
  },
  // Customizable fields
  effort: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // Economy: Difficulty for coin calculation
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'extreme'],
    default: 'medium'
  },
  feeling: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  timeRequired: {
    type: Number, // in minutes
    default: null
  },
  timeTaken: {
    type: Number, // in minutes
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  // Tags (epic-style tagging)
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  // Subtasks
  subtasks: [subtaskSchema],
  // Rewards
  coinsReward: {
    type: Number,
    default: 20,
    min: 0
  },
  // UI Customization
  color: {
    type: String,
    default: '#8b5cf6'
  },
  icon: {
    type: String,
    default: '📋'
  },
  // Ordering for Kanban
  order: {
    type: Number,
    default: 0
  },
  // Completion
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook: Auto-calculate progress and update status based on subtasks
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedCount = this.subtasks.filter(st => st.completed).length;
    const totalCount = this.subtasks.length;
    
    // Update progress
    this.progress = Math.round((completedCount / totalCount) * 100);
    
    // Auto-update status
    if (completedCount === totalCount) {
      // All subtasks done - mark task as done
      this.status = 'done';
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    } else if (completedCount > 0 && this.status === 'todo') {
      // Some subtasks done - move to in-progress
      this.status = 'in-progress';
    }
  }
  next();
});

// Index for efficient querying
taskSchema.index({ status: 1, type: 1, priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ tags: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

