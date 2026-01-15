import express from 'express';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import CompletionLog from '../models/CompletionLog.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 30); // Default 30 days
  }
  
  return { start, end: now };
};

// Get overall summary
router.get('/summary', async (req, res) => {
  try {
    const user = await User.findOne() || { coins: 0, totalCoinsEarned: 0 };
    
    const [
      totalHabits,
      completedHabits,
      inProgressHabits,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todayCompletions
    ] = await Promise.all([
      Habit.countDocuments(),
      Habit.countDocuments({ status: 'done' }),
      Habit.countDocuments({ status: 'in-progress' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Task.countDocuments({ status: 'in-progress' }),
      CompletionLog.countDocuments({
        completedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);
    
    // Get longest streak
    const habitWithLongestStreak = await Habit.findOne().sort('-longestStreak');
    
    res.json({
      coins: user.coins,
      totalCoinsEarned: user.totalCoinsEarned,
      habits: {
        total: totalHabits,
        completed: completedHabits,
        inProgress: inProgressHabits,
        todo: totalHabits - completedHabits - inProgressHabits
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: totalTasks - completedTasks - inProgressTasks
      },
      todayCompletions,
      longestStreak: habitWithLongestStreak?.longestStreak || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get habit analytics
router.get('/habits', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);
    
    // Get completions over time
    const completions = await CompletionLog.aggregate([
      {
        $match: {
          itemType: 'habit',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'daily' ? '%H:00' : '%Y-%m-%d', 
              date: '$completedAt' 
            }
          },
          count: { $sum: 1 },
          coinsEarned: { $sum: '$coinsEarned' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get habits by type
    const byType = await Habit.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get top habits by completions
    const topHabits = await Habit.find()
      .sort('-completions')
      .limit(5)
      .select('title completions coinsReward color icon');
    
    // Get current streaks
    const streaks = await Habit.find({ currentStreak: { $gt: 0 } })
      .sort('-currentStreak')
      .limit(5)
      .select('title currentStreak longestStreak color icon');
    
    res.json({
      completions,
      byType,
      topHabits,
      streaks,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task analytics
router.get('/tasks', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);
    
    // Get completions over time
    const completions = await CompletionLog.aggregate([
      {
        $match: {
          itemType: 'task',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'daily' ? '%H:00' : '%Y-%m-%d', 
              date: '$completedAt' 
            }
          },
          count: { $sum: 1 },
          coinsEarned: { $sum: '$coinsEarned' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get tasks by type and status
    const byType = await Task.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          },
          avgProgress: { $avg: '$progress' }
        }
      }
    ]);
    
    // Get tasks by priority
    const byPriority = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get in-progress tasks with their progress
    const inProgressTasks = await Task.find({ status: { $in: ['in-progress', 'todo'] } })
      .sort('-progress')
      .limit(10)
      .select('title progress type priority color icon dueDate');
    
    res.json({
      completions,
      byType,
      byPriority,
      inProgressTasks,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get coin analytics
router.get('/coins', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);
    
    const earnings = await CompletionLog.aggregate([
      {
        $match: {
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$completedAt' 
              }
            },
            type: '$itemType'
          },
          amount: { $sum: '$coinsEarned' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Reshape data
    const formattedEarnings = {};
    earnings.forEach(e => {
      if (!formattedEarnings[e._id.date]) {
        formattedEarnings[e._id.date] = { date: e._id.date, habit: 0, task: 0, total: 0 };
      }
      formattedEarnings[e._id.date][e._id.type] = e.amount;
      formattedEarnings[e._id.date].total += e.amount;
    });
    
    res.json({
      earnings: Object.values(formattedEarnings),
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get completion heatmap data (like GitHub contribution graph)
router.get('/heatmap', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    const completions = await CompletionLog.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object for easy lookup
    const heatmapData = {};
    completions.forEach(c => {
      heatmapData[c._id] = c.count;
    });
    
    res.json({ year: parseInt(year), data: heatmapData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feeling/effort trends
router.get('/feelings', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);
    
    const trends = await CompletionLog.aggregate([
      {
        $match: {
          completedAt: { $gte: start, $lte: end },
          feeling: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          avgFeeling: { $avg: '$feeling' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({ trends, period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
