/**
 * Custom Charts Routes
 * 
 * CRUD operations for user's custom analytics charts.
 */

import express from 'express';
import mongoose from 'mongoose';
import CustomChart from '../models/CustomChart.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import CompletionLog from '../models/CompletionLog.js';

const router = express.Router();

// Get all custom charts
router.get('/', async (req, res) => {
  try {
    const charts = await CustomChart.find().sort('order');
    res.json(charts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new chart
router.post('/', async (req, res) => {
  try {
    // Get max order
    const maxOrder = await CustomChart.findOne().sort('-order').select('order');
    const order = maxOrder ? maxOrder.order + 1 : 0;
    
    const chart = new CustomChart({
      ...req.body,
      order
    });
    await chart.save();
    res.status(201).json(chart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update chart
router.put('/:id', async (req, res) => {
  try {
    const chart = await CustomChart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }
    res.json(chart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete chart
router.delete('/:id', async (req, res) => {
  try {
    const chart = await CustomChart.findByIdAndDelete(req.params.id);
    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }
    res.json({ message: 'Chart deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chart data (for rendering)
router.get('/:id/data', async (req, res) => {
  try {
    const chart = await CustomChart.findById(req.params.id);
    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }
    
    const { timeRange, dataSource } = chart;
    const now = new Date();
    let startDate;
    
    // Calculate date range using UTC to avoid timezone issues
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const today = todayUTC;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(today);
        startDate.setUTCDate(today.getUTCDate() - 7);
        break;
      case 'month':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        break;
      case 'quarter':
        startDate = new Date(today);
        startDate.setUTCMonth(today.getUTCMonth() - 3);
        break;
      case 'year':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        break;
      default:
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }
    
    let data = [];
    
    if (dataSource.sourceType === 'habit' && dataSource.itemId) {
      // Get completion data for specific habit
      const habit = await Habit.findById(dataSource.itemId);
      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      
      // Convert itemId to ObjectId for proper matching
      const itemObjectId = new mongoose.Types.ObjectId(dataSource.itemId);
      
      const completions = await CompletionLog.find({
        itemType: 'habit',
        itemId: itemObjectId,
        completedAt: { $gte: startDate }
      }).sort('completedAt');
      
      // Group by date - sum values for value-based habits
      const dateMap = {};
      completions.forEach(c => {
        const dateKey = c.completedAt.toISOString().split('T')[0];
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { count: 0, coins: 0, valueSum: 0 };
        }
        dateMap[dateKey].count += 1;
        dateMap[dateKey].coins += c.coinsEarned || 0;
        dateMap[dateKey].valueSum += c.valueLogged || 0;
      });
      
      // Determine if this is a value-based habit
      const isValueBased = habit.trackingType === 'value';
      
      // Build daily data (use 'today' to ensure current day is included)
      const current = new Date(startDate);
      while (current <= today) {
        const dateKey = current.toISOString().split('T')[0];
        const dayData = dateMap[dateKey] || { count: 0, coins: 0, valueSum: 0 };
        
        // Calculate progress based on habit type
        let progress;
        if (isValueBased && habit.targetValue) {
          progress = Math.min(100, (dayData.valueSum / habit.targetValue) * 100);
        } else if (habit.target) {
          progress = Math.min(100, (dayData.count / habit.target) * 100);
        } else {
          progress = dayData.count > 0 ? 100 : 0;
        }
        
        data.push({
          date: dateKey,
          day: current.getDate(),
          dayOfWeek: current.getDay(),
          count: isValueBased ? dayData.valueSum : dayData.count,
          coins: dayData.coins,
          progress: Math.round(progress)
        });
        
        current.setDate(current.getDate() + 1);
      }
    } else if (dataSource.sourceType === 'all-habits') {
      // Get all habit completions
      const completions = await CompletionLog.find({
        itemType: 'habit',
        completedAt: { $gte: startDate }
      }).sort('completedAt');
      
      // Group by date
      const dateMap = {};
      completions.forEach(c => {
        const dateKey = c.completedAt.toISOString().split('T')[0];
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { count: 0, coins: 0 };
        }
        dateMap[dateKey].count += 1;
        dateMap[dateKey].coins += c.coinsEarned || 0;
      });
      
      // Build daily data
      const current = new Date(startDate);
      while (current <= today) {
        const dateKey = current.toISOString().split('T')[0];
        const dayData = dateMap[dateKey] || { count: 0, coins: 0 };
        
        data.push({
          date: dateKey,
          day: current.getDate(),
          dayOfWeek: current.getDay(),
          count: dayData.count,
          coins: dayData.coins,
          progress: Math.min(100, dayData.count * 20) // Rough estimate: 5 completions = 100%
        });
        
        current.setDate(current.getDate() + 1);
      }
    }
    
    res.json({
      chart,
      data,
      startDate,
      endDate: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder charts
router.post('/reorder', async (req, res) => {
  try {
    const { charts } = req.body; // Array of { id, order }
    
    const updates = charts.map(({ id, order }) =>
      CustomChart.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updates);
    res.json({ message: 'Charts reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
