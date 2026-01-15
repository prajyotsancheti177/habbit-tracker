/**
 * CustomChart Model
 * 
 * Stores user's custom chart configurations for the analytics page.
 * Supports various chart types including Apple Health-style ring calendar.
 */

import mongoose from 'mongoose';

const customChartSchema = new mongoose.Schema({
  // Chart display name
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Chart type
  type: {
    type: String,
    enum: ['ring-calendar', 'line', 'bar', 'heatmap', 'pie'],
    default: 'ring-calendar'
  },
  
  // Data source configuration
  dataSource: {
    // Type of data: 'habit', 'task', 'all-habits', 'all-tasks'
    sourceType: {
      type: String,
      enum: ['habit', 'task', 'all-habits', 'all-tasks'],
      default: 'habit'
    },
    // Specific item ID (for single habit/task)
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // Item title (cached for display)
    itemTitle: {
      type: String,
      default: ''
    },
    // For value-based tracking: which field to show
    valueField: {
      type: String,
      enum: ['completions', 'currentValue', 'streak', 'coins'],
      default: 'completions'
    }
  },
  
  // Visual style
  style: {
    // Color theme
    color: {
      type: String,
      default: '#3b82f6'
    },
    // Show as Apple Health rings
    useRings: {
      type: Boolean,
      default: true
    },
    // Ring size
    ringSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },
  
  // Time range
  timeRange: {
    type: String,
    enum: ['week', 'month', 'quarter', 'year'],
    default: 'month'
  },
  
  // Display order
  order: {
    type: Number,
    default: 0
  },
  
  // Card size
  size: {
    type: String,
    enum: ['small', 'medium', 'wide', 'full'],
    default: 'wide'
  }
}, {
  timestamps: true
});

// Index for ordering
customChartSchema.index({ order: 1 });

const CustomChart = mongoose.model('CustomChart', customChartSchema);

export default CustomChart;
