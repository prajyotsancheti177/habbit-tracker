import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6' // Default blue
  },
  icon: {
    type: String,
    default: '🏷️'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
