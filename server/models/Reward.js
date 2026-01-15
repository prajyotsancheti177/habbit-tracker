import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  icon: {
    type: String,
    default: '🎁'
  },
  type: {
    type: String,
    enum: ['custom', 'permission', 'voucher'],
    default: 'custom'
  },
  color: {
    type: String,
    default: '#10b981' // Green
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
