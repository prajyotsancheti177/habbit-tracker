import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'User'
  },
  coins: {
    type: Number,
    default: 0
  },
  totalCoinsEarned: {
    type: Number,
    default: 0
  },
  settings: {
    theme: {
      type: String,
      default: 'dark'
    },
    accentColor: {
      type: String,
      default: '#3b82f6'
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
