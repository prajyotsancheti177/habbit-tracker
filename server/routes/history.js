/**
 * History Routes
 * 
 * API endpoints for viewing completion history.
 */

import express from 'express';
import mongoose from 'mongoose';
import CompletionLog from '../models/CompletionLog.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';

const router = express.Router();

// Get history data for calendar view
router.get('/', async (req, res) => {
  try {
    const { 
      year = new Date().getUTCFullYear(), 
      month, // 0-11, if not provided returns full year
      itemId, // filter by specific habit/task
      itemType = 'all' // 'habit', 'task', or 'all'
    } = req.query;
    
    // Build date range
    let startDate, endDate;
    if (month !== undefined) {
      startDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
      endDate = new Date(Date.UTC(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59));
    } else {
      startDate = new Date(Date.UTC(parseInt(year), 0, 1));
      endDate = new Date(Date.UTC(parseInt(year), 11, 31, 23, 59, 59));
    }
    
    // Build query
    const query = {
      completedAt: { $gte: startDate, $lte: endDate }
    };
    
    if (itemId) {
      query.itemId = new mongoose.Types.ObjectId(itemId);
    }
    
    if (itemType !== 'all') {
      query.itemType = itemType;
    }
    
    // Get completions
    const completions = await CompletionLog.find(query)
      .sort('completedAt')
      .lean();
    
    // Group by date
    const dateMap = {};
    completions.forEach(c => {
      const dateKey = c.completedAt.toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          items: [],
          totalCount: 0,
          totalCoins: 0
        };
      }
      dateMap[dateKey].items.push({
        id: c._id,
        itemId: c.itemId,
        itemType: c.itemType,
        itemTitle: c.itemTitle,
        completionType: c.completionType || 'regular',
        completionStatus: c.completionStatus || null,
        finalPercentage: c.finalPercentage,
        valueLogged: c.valueLogged,
        coinsEarned: c.coinsEarned || 0,
        completedAt: c.completedAt
      });
      dateMap[dateKey].totalCount += 1;
      dateMap[dateKey].totalCoins += c.coinsEarned || 0;
    });
    
    // Get all habits/tasks for filter dropdown
    const habits = await Habit.find({}, 'title icon color').lean();
    const tasks = await Task.find({}, 'title icon color').lean();
    
    res.json({
      year: parseInt(year),
      month: month !== undefined ? parseInt(month) : null,
      startDate,
      endDate,
      history: Object.values(dateMap),
      filters: {
        habits: habits.map(h => ({ id: h._id, title: h.title, icon: h.icon, color: h.color })),
        tasks: tasks.map(t => ({ id: t._id, title: t.title, icon: t.icon, color: t.color }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary stats for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const completions = await CompletionLog.find({
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort('completedAt').lean();
    
    res.json({
      date,
      completions,
      totalCount: completions.length,
      totalCoins: completions.reduce((sum, c) => sum + (c.coinsEarned || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
