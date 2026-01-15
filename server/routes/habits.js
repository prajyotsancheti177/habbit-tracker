import express from 'express';
import Habit from '../models/Habit.js';
import CompletionLog from '../models/CompletionLog.js';
import User from '../models/User.js';
import EconomyState from '../models/EconomyState.js';
import CoinEconomy from '../services/CoinEconomy.js';

const router = express.Router();

// Helper: Get the start of the current period based on frequency
const getPeriodStart = (date, frequency) => {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case 'weekly':
      // Start of week (Sunday)
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek;
      return new Date(d.getFullYear(), d.getMonth(), diff);
    case 'monthly':
      return new Date(d.getFullYear(), d.getMonth(), 1);
    default:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
};

// Helper: Get the end of a period based on its start and frequency
// Use 18:00 instead of 23:59 to avoid UTC timezone date shift issues
const getPeriodEnd = (periodStart, frequency) => {
  const start = new Date(periodStart);
  switch (frequency) {
    case 'daily':
      return new Date(start.getFullYear(), start.getMonth(), start.getDate(), 18, 0, 0, 0);
    case 'weekly':
      const endOfWeek = new Date(start);
      endOfWeek.setDate(start.getDate() + 6);
      endOfWeek.setHours(18, 0, 0, 0);
      return endOfWeek;
    case 'monthly':
      return new Date(start.getFullYear(), start.getMonth() + 1, 0, 18, 0, 0, 0);
    default:
      return new Date(start.getFullYear(), start.getMonth(), start.getDate(), 18, 0, 0, 0);
  }
};

// Helper: Advance to next period start
const getNextPeriodStart = (periodStart, frequency) => {
  const start = new Date(periodStart);
  switch (frequency) {
    case 'daily':
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    case 'weekly':
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    case 'monthly':
      return new Date(start.getFullYear(), start.getMonth() + 1, 1);
    default:
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  }
};

// Helper: Calculate final percentage for a habit's progress
const calculateFinalPercentage = (habit) => {
  if (habit.trackingType === 'value' && habit.targetValue) {
    return Math.min(100, Math.round((habit.currentValue / habit.targetValue) * 100));
  } else if (habit.target) {
    return Math.min(100, Math.round((habit.periodCompletions / habit.target) * 100));
  } else {
    return habit.periodCompletions > 0 ? 100 : 0;
  }
};

// Helper: Determine completion status from percentage
const getCompletionStatus = (percentage) => {
  if (percentage >= 100) return 'complete';
  if (percentage > 0) return 'partial';
  return 'missed';
};

// Main function: Process ALL missed periods for a recurring habit
// Returns habit data and array of all missed period logs
const processAllMissedPeriods = (habit, mockTime = null) => {
  if (habit.type !== 'recurring') return { habit, missedPeriods: [] };
  
  // Use mock time if provided (for testing), otherwise use current time
  const now = mockTime ? new Date(mockTime) : new Date();
  const currentPeriodStart = getPeriodStart(now, habit.frequency);
  const habitPeriodStart = getPeriodStart(new Date(habit.periodStartDate), habit.frequency);
  
  // Check if we need to reset (habit's period is before current period)
  if (habitPeriodStart >= currentPeriodStart) {
    return { habit, missedPeriods: [] };
  }
  
  const missedPeriods = [];
  let iterPeriodStart = new Date(habitPeriodStart);
  
  // Track the habit's progress for the first (actual) period
  let currentPeriodCompletions = habit.periodCompletions || 0;
  let currentValue = habit.currentValue || 0;
  
  // Iterate through all missed periods until we reach the current period
  while (iterPeriodStart < currentPeriodStart) {
    const periodEnd = getPeriodEnd(iterPeriodStart, habit.frequency);
    
    // Calculate percentage for this period
    const finalPercentage = calculateFinalPercentage({
      ...habit,
      periodCompletions: currentPeriodCompletions,
      currentValue: currentValue
    });
    
    const completionStatus = getCompletionStatus(finalPercentage);
    
    // Log this period
    missedPeriods.push({
      periodStartDate: new Date(iterPeriodStart),
      periodEndDate: periodEnd,
      periodCompletions: currentPeriodCompletions,
      currentValue: currentValue,
      targetValue: habit.targetValue,
      target: habit.target,
      trackingType: habit.trackingType,
      finalPercentage,
      completionStatus,
      habitId: habit._id,
      habitTitle: habit.title
    });
    
    // Move to next period - reset tracked values (they had no activity)
    iterPeriodStart = getNextPeriodStart(iterPeriodStart, habit.frequency);
    currentPeriodCompletions = 0;
    currentValue = 0;
  }
  
  // Reset habit for new period
  habit.periodCompletions = 0;
  habit.currentValue = 0;
  habit.periodStartDate = currentPeriodStart;
  habit.currentLogFieldValues = new Map(); // Reset log field values for new period
  
  // Reset status to 'todo' (from BOTH 'done' AND 'in-progress')
  if (habit.status === 'done' || habit.status === 'in-progress') {
    habit.status = 'todo';
  }
  
  // Reset subtasks for new period
  if (habit.subtasks && habit.subtasks.length > 0) {
    habit.subtasks = habit.subtasks.map(st => ({
      ...st,
      completed: false,
      completedAt: null
    }));
  }
  
  return { habit, missedPeriods };
};

// Get archived habits
router.get('/archived/list', async (req, res) => {
  try {
    const habits = await Habit.find({ isArchived: true }).sort('-archivedAt');
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all habits with optional filtering (with auto-reset for recurring)
router.get('/', async (req, res) => {
  try {
    const { type, status, sort = '-createdAt', includeArchived = 'false' } = req.query;
    const filter = {};
    
    // Get mock time from header (for testing)
    const mockTime = req.headers['x-debug-mock-time'] || null;
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    // Exclude archived habits by default
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    let habits = await Habit.find(filter).sort(sort);
    
    // Check and reset periods for recurring habits (skip archived)
    const updates = [];
    const completionLogs = [];
    
    habits = habits.map(habit => {
      // Skip period reset for archived habits
      if (habit.isArchived) {
        return habit.toObject();
      }
      
      const { habit: processedHabit, missedPeriods } = processAllMissedPeriods(habit.toObject(), mockTime);
      
      if (missedPeriods.length > 0) {
        // Update habit in database (including subtasks reset and log field values reset)
        updates.push(
          Habit.findByIdAndUpdate(habit._id, {
            periodCompletions: processedHabit.periodCompletions,
            currentValue: processedHabit.currentValue,
            periodStartDate: processedHabit.periodStartDate,
            status: processedHabit.status,
            subtasks: processedHabit.subtasks,
            currentLogFieldValues: new Map()
          })
        );
        
        // Log EACH missed period (not just the last one)
        missedPeriods.forEach(period => {
          completionLogs.push(
            new CompletionLog({
              itemType: 'habit',
              itemId: habit._id,
              itemTitle: habit.title,
              completionType: 'period_end',
              completedAt: period.periodEndDate,
              finalPercentage: period.finalPercentage,
              completionStatus: period.completionStatus,
              notes: `Period: ${period.periodStartDate.toLocaleDateString()} - ${period.periodEndDate.toLocaleDateString()}`,
              coinsEarned: 0
            }).save()
          );
        });
      }
      
      return processedHabit;
    });
    
    // Save any updates and logs in background
    if (updates.length > 0 || completionLogs.length > 0) {
      Promise.all([...updates, ...completionLogs]).catch(console.error);
    }
    
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single habit
router.get('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new habit
router.post('/', async (req, res) => {
  try {
    const habit = new Habit(req.body);
    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update habit
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive habit (pause without deleting)
router.patch('/:id/archive', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    habit.isArchived = true;
    habit.archivedAt = new Date();
    await habit.save();
    
    res.json({ 
      message: 'Habit archived successfully',
      habit 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unarchive habit (resume tracking)
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    habit.isArchived = false;
    habit.archivedAt = null;
    // Reset period to now so it doesn't mark archived time as "missed"
    habit.periodStartDate = new Date();
    habit.periodCompletions = 0;
    habit.currentValue = 0;
    habit.status = 'todo';
    await habit.save();
    
    res.json({ 
      message: 'Habit unarchived successfully',
      habit 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current value (for value-based tracking like steps) or log structured field values
router.patch('/:id/value', async (req, res) => {
  try {
    const { value, increment = false, logFieldValues } = req.body;
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // If we have log field values (structured logging), store in habit and create log entry
    if (logFieldValues && Object.keys(logFieldValues).length > 0) {
      // Store current values in habit for display
      const currentValues = habit.currentLogFieldValues || new Map();
      Object.entries(logFieldValues).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          currentValues.set(key, value);
        }
      });
      habit.currentLogFieldValues = currentValues;
      
      // Mark habit as in-progress if it was todo
      if (habit.status === 'todo') {
        habit.status = 'in-progress';
      }
      
      await habit.save();
      
      // Also log to completion history
      const log = new CompletionLog({
        itemType: 'habit',
        itemId: habit._id,
        itemTitle: habit.title,
        completionType: 'value_log',
        completedAt: new Date(),
        logFieldValues: logFieldValues,
        coinsEarned: 0
      });
      await log.save();
      
      return res.json(habit);
    }
    
    // Otherwise, handle traditional value-based tracking
    if (value !== null && value !== undefined) {
      // Update current value (either set or increment)
      if (increment) {
        habit.currentValue = (habit.currentValue || 0) + value;
      } else {
        habit.currentValue = value;
      }
      
      // Auto-update status based on progress
      if (habit.targetValue && habit.currentValue >= habit.targetValue) {
        habit.status = 'done';
      } else if (habit.currentValue > 0 && habit.status === 'todo') {
        habit.status = 'in-progress';
      }
      
      await habit.save();
      
      // Calculate completion percentage for logging
      const percentage = habit.targetValue 
        ? Math.min(100, Math.round((habit.currentValue / habit.targetValue) * 100))
        : 100;
      const completionStatus = percentage >= 100 ? 'complete' : 'partial';
      
      // Log the value update for chart tracking
      const log = new CompletionLog({
        itemType: 'habit',
        itemId: habit._id,
        itemTitle: habit.title,
        completionType: 'value_log',
        completedAt: new Date(),
        valueLogged: value,
        finalPercentage: percentage,
        completionStatus: completionStatus,
        coinsEarned: 0 // Coins are awarded separately through complete endpoint
      });
      await log.save();
    }
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle subtask completion
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const subtask = habit.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    // Get mock time from header (for testing)
    const mockTime = req.headers['x-debug-mock-time'];
    const now = mockTime ? new Date(mockTime) : new Date();
    
    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? now : null;
    
    await habit.save(); // This will trigger the pre-save hook to update status
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete habit (increment completions, award coins, log completion)
router.post('/:id/complete', async (req, res) => {
  try {
    const { duration, feeling, notes } = req.body;
    const habit = await Habit.findById(req.params.id);
    
    // Get mock time from header (for testing)
    const mockTime = req.headers['x-debug-mock-time'];
    const now = mockTime ? new Date(mockTime) : new Date();
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Increment completions
    habit.completions += 1;
    habit.lastCompletedAt = now;
    
    // For recurring habits, also track period completions
    if (habit.type === 'recurring') {
      habit.periodCompletions = (habit.periodCompletions || 0) + 1;
    }
    
    // Update feeling and time if provided
    if (feeling) habit.feeling = feeling;
    if (duration) habit.timeTaken = (habit.timeTaken || 0) + duration;
    
    // Update streak
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const lastCompleted = habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : null;
    
    if (lastCompleted) {
      lastCompleted.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        habit.currentStreak += 1;
      } else {
        habit.currentStreak = 1;
      }
    } else {
      habit.currentStreak = 1;
    }
    
    if (habit.currentStreak > habit.longestStreak) {
      habit.longestStreak = habit.currentStreak;
    }
    
    // Check if target reached (use periodCompletions for recurring habits)
    const completionsToCheck = habit.type === 'recurring' 
      ? habit.periodCompletions 
      : habit.completions;
    
    if (completionsToCheck >= habit.target) {
      habit.status = 'done';
    } else if (habit.status === 'todo') {
      habit.status = 'in-progress';
    }
    
    await habit.save();
    
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
      difficulty: habit.difficulty || 'medium',
      streak: habit.currentStreak,
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
      itemType: 'habit',
      itemId: habit._id,
      itemTitle: habit.title,
      completionType: 'regular',
      completedAt: now,
      duration,
      feeling,
      notes,
      coinsEarned: rewardResult.coins,
      completionStatus: 'complete' // User-initiated completions are always complete
    });
    await log.save();
    
    res.json({
      habit,
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

// Uncomplete habit (decrement completions, remove last log, refund coins)
router.post('/:id/uncomplete', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Check if there are completions to undo
    const completionsToCheck = habit.type === 'recurring' 
      ? habit.periodCompletions 
      : habit.completions;
    
    if (completionsToCheck <= 0) {
      return res.status(400).json({ error: 'No completions to undo' });
    }
    
    // Find and remove the most recent completion log
    const lastLog = await CompletionLog.findOne({
      itemType: 'habit',
      itemId: habit._id,
      completionType: 'regular'
    }).sort({ completedAt: -1 });
    
    let coinsRefunded = 0;
    if (lastLog) {
      coinsRefunded = lastLog.coinsEarned || 0;
      await CompletionLog.findByIdAndDelete(lastLog._id);
    }
    
    // Decrement completions
    habit.completions = Math.max(0, habit.completions - 1);
    if (habit.type === 'recurring') {
      habit.periodCompletions = Math.max(0, (habit.periodCompletions || 0) - 1);
    }
    
    // Update streak (reduce by 1, but don't go below 0)
    habit.currentStreak = Math.max(0, habit.currentStreak - 1);
    
    // Update status based on new completion count
    const newCompletionsToCheck = habit.type === 'recurring' 
      ? habit.periodCompletions 
      : habit.completions;
    
    if (newCompletionsToCheck >= habit.target) {
      habit.status = 'done';
    } else if (newCompletionsToCheck > 0) {
      habit.status = 'in-progress';
    } else {
      habit.status = 'todo';
    }
    
    await habit.save();
    
    // Refund coins if any were earned
    if (coinsRefunded > 0) {
      let user = await User.findOne();
      if (user) {
        user.coins = Math.max(0, user.coins - coinsRefunded);
        user.totalCoinsEarned = Math.max(0, user.totalCoinsEarned - coinsRefunded);
        await user.save();
      }
    }
    
    res.json({
      habit,
      coinsRefunded,
      message: 'Completion undone successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder habits (for Kanban drag-drop)
router.post('/reorder', async (req, res) => {
  try {
    const { habits } = req.body; // Array of { id, order, status }
    
    const updates = habits.map(({ id, order, status }) => 
      Habit.findByIdAndUpdate(id, { order, status }, { new: true })
    );
    
    await Promise.all(updates);
    res.json({ message: 'Habits reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
