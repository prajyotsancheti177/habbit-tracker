import mongoose from 'mongoose';

const completionLogSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['habit', 'task'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemTitle: {
    type: String,
    required: true
  },
  // Type of completion entry
  completionType: {
    type: String,
    enum: ['regular', 'value_log', 'period_end'],
    default: 'regular'
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    default: null
  },
  feeling: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  // For value-based tracking
  valueLogged: {
    type: Number,
    default: null
  },
  // Final percentage for period-end completions
  finalPercentage: {
    type: Number,
    default: null
  },
  // Structured log field values (e.g., { "Download Speed": 100, "Upload Speed": 50, "Ping": 12 })
  logFieldValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map()
  },
  // Status category: complete (100%), partial (1-99%), missed (0%)
  completionStatus: {
    type: String,
    enum: ['complete', 'partial', 'missed', null],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
completionLogSchema.index({ completedAt: -1 });
completionLogSchema.index({ itemType: 1, completedAt: -1 });
completionLogSchema.index({ itemId: 1, completedAt: -1 });

const CompletionLog = mongoose.model('CompletionLog', completionLogSchema);

export default CompletionLog;
