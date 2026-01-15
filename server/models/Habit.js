import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
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
    enum: ['recurring', 'one-time'],
    default: 'recurring'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  // Tracking type: 'count' (X times) or 'value' (X units like steps, calories)
  trackingType: {
    type: String,
    enum: ['count', 'value'],
    default: 'count'
  },
  // For count-based tracking
  target: {
    type: Number,
    default: 1,
    min: 1
  },
  completions: {
    type: Number,
    default: 0,
    min: 0
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
    default: '' // e.g., 'steps', 'calories', 'pages', 'km'
  },
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
    type: String // Array of image URLs/paths
  }],
  // Recurring habit fields
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  daysOfWeek: [{
    type: Number, // 0-6 for Sun-Sat
    min: 0,
    max: 6
  }],
  // Rewards
  coinsReward: {
    type: Number,
    default: 10,
    min: 0
  },
  // UI Customization
  color: {
    type: String,
    default: '#3b82f6'
  },
  icon: {
    type: String,
    default: '⭐'
  },
  // Tags (epic-style tagging)
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  // Subtasks
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null }
  }],
  // Ordering for Kanban
  order: {
    type: Number,
    default: 0
  },
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastCompletedAt: {
    type: Date,
    default: null
  },
  // Period tracking for recurring habits
  periodCompletions: {
    type: Number,
    default: 0
  },
  periodStartDate: {
    type: Date,
    default: Date.now
  },
  // Custom log fields for structured logging (e.g., Download Speed, Upload Speed, Ping)
  logFields: [{
    name: { type: String, required: true },
    unit: { type: String, default: '' },
    fieldType: { type: String, enum: ['number', 'text'], default: 'number' }
  }],
  // Current period's log field values (resets with period)
  currentLogFieldValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map()
  },
  // Archive feature: Paused habits that don't show in daily tracking
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Convert currentLogFieldValues Map to plain object for JSON serialization
      if (ret.currentLogFieldValues instanceof Map) {
        ret.currentLogFieldValues = Object.fromEntries(ret.currentLogFieldValues);
      }
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      // Convert currentLogFieldValues Map to plain object
      if (ret.currentLogFieldValues instanceof Map) {
        ret.currentLogFieldValues = Object.fromEntries(ret.currentLogFieldValues);
      }
      return ret;
    }
  }
});

// Pre-save hook: Auto-update status based on subtasks
habitSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedCount = this.subtasks.filter(st => st.completed).length;
    const totalCount = this.subtasks.length;
    
    if (completedCount === totalCount) {
      // All subtasks done - mark habit as done
      this.status = 'done';
    } else if (completedCount > 0 && this.status === 'todo') {
      // Some subtasks done - move to in-progress
      this.status = 'in-progress';
    }
  }
  next();
});

// Index for efficient querying
habitSchema.index({ status: 1, type: 1 });
habitSchema.index({ createdAt: -1 });
habitSchema.index({ tags: 1 });

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;

