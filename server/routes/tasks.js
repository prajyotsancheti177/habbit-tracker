import express from 'express';
import Task from '../models/Task.js';
import CompletionLog from '../models/CompletionLog.js';
import User from '../models/User.js';
import EconomyState from '../models/EconomyState.js';
import CoinEconomy from '../services/CoinEconomy.js';

const router = express.Router();

// Get all tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, status, priority, sort = '-createdAt' } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const tasks = await Task.find(filter).sort(sort);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current value (for value-based tracking)
router.patch('/:id/value', async (req, res) => {
  try {
    const { value, increment = false } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update current value (either set or increment)
    if (increment) {
      task.currentValue = (task.currentValue || 0) + value;
    } else {
      task.currentValue = value;
    }
    
    // Calculate progress as percentage of target
    if (task.targetValue) {
      task.progress = Math.min(100, Math.round((task.currentValue / task.targetValue) * 100));
    }
    
    // Auto-update status based on progress
    if (task.targetValue && task.currentValue >= task.targetValue) {
      task.status = 'done';
    } else if (task.currentValue > 0 && task.status === 'todo') {
      task.status = 'in-progress';
    }
    
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle subtask completion
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    subtask.completed = !subtask.completed;
    await task.save(); // This will trigger the pre-save hook to update progress
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete task (mark done, award coins, log completion)
router.post('/:id/complete', async (req, res) => {
  try {
    const { duration, feeling, notes } = req.body;
    const task = await Task.findById(req.params.id);
    
    // Get mock time from header (for testing)
    const mockTime = req.headers['x-debug-mock-time'];
    const now = mockTime ? new Date(mockTime) : new Date();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.status = 'done';
    task.progress = 100;
    task.completedAt = now;
    
    if (feeling) task.feeling = feeling;
    if (duration) task.timeTaken = duration;
    
    // Mark all subtasks as complete
    task.subtasks.forEach(st => st.completed = true);
    
    await task.save();
    
    // Get economy state and handle resets
    let economyState = await EconomyState.getState();
    
    if (CoinEconomy.needsDailyReset(economyState.lastDailyReset)) {
      economyState.performDailyReset();
    }
    if (CoinEconomy.needsWeeklyReset(economyState.lastWeeklyReset)) {
      economyState.performWeeklyReset();
    }
    
    // Calculate reward using economy engine
    const rewardResult = CoinEconomy.calculateReward({
      difficulty: task.difficulty || 'medium',
      streak: 0, // Tasks don't have streaks
      completedToday: economyState.completionsToday,
      coinsToday: economyState.coinsToday,
      coinsThisWeek: economyState.coinsThisWeek,
      baseOverride: economyState.currentBase
    });
    
    // Award coins
    let user = await User.findOne();
    if (!user) {
      user = new User();
    }
    user.coins += rewardResult.coins;
    user.totalCoinsEarned += rewardResult.coins;
    await user.save();
    
    // Update economy state
    economyState.recordCompletion(rewardResult.coins);
    await economyState.save();
    
    // Log completion with mock time
    const log = new CompletionLog({
      itemType: 'task',
      itemId: task._id,
      itemTitle: task.title,
      completedAt: now,
      duration,
      feeling,
      notes,
      coinsEarned: rewardResult.coins
    });
    await log.save();
    
    res.json({
      task,
      coinsEarned: rewardResult.coins,
      totalCoins: user.coins,
      rewardBreakdown: rewardResult.breakdown,
      capped: rewardResult.capped,
      cappedReason: rewardResult.cappedReason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder tasks (for Kanban drag-drop)
router.post('/reorder', async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, order, status }
    
    const updates = tasks.map(({ id, order, status }) => 
      Task.findByIdAndUpdate(id, { order, status }, { new: true })
    );
    
    await Promise.all(updates);
    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
