import express from 'express';
import User from '../models/User.js';
import CompletionLog from '../models/CompletionLog.js';
import Reward from '../models/Reward.js';

const router = express.Router();

// Get current coin balance
router.get('/balance', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = new User();
      await user.save();
    }
    
    res.json({
      coins: user.coins,
      totalCoinsEarned: user.totalCoinsEarned
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get coin transaction history (both earnings and spendings)
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Find logs where coinsEarned is NOT 0 (so both positive earnings and negative spendings)
    const [history, total] = await Promise.all([
      CompletionLog.find({ coinsEarned: { $ne: 0 } })
        .sort('-completedAt')
        .skip(skip)
        .limit(parseInt(limit))
        .select('itemType itemTitle coinsEarned completedAt completionType'),
      CompletionLog.countDocuments({ coinsEarned: { $ne: 0 } })
    ]);
    
    res.json({
      history,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Marketplace Routes ---

// Get all available rewards
router.get('/items', async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ cost: 1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new reward
router.post('/items', async (req, res) => {
  try {
    const reward = new Reward(req.body);
    await reward.save();
    res.status(201).json(reward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a reward
router.delete('/items/:id', async (req, res) => {
  try {
    await Reward.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reward deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem (buy) a reward
router.post('/items/:id/redeem', async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    let user = await User.findOne();
    if (!user) {
      user = new User();
    }
    
    // Check balance
    if (user.coins < reward.cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Deduct coins
    user.coins -= reward.cost;
    await user.save();
    
    // Log transaction (negative coinsEarned represents spending)
    const log = new CompletionLog({
      itemType: 'reward',
      itemId: reward._id,
      itemTitle: reward.title,
      completionType: 'redemption',
      completedAt: new Date(),
      coinsEarned: -reward.cost, // Negative value for spending
      notes: `Redeemed: ${reward.title}`
    });
    await log.save();
    
    res.json({
      message: 'Redemption successful',
      newBalance: user.coins,
      reward
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/settings', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = new User();
    }
    
    if (req.body.name) user.name = req.body.name;
    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = new User();
      await user.save();
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get economy status
router.get('/economy', async (req, res) => {
  try {
    const EconomyState = (await import('../models/EconomyState.js')).default;
    const CoinEconomy = (await import('../services/CoinEconomy.js')).default;
    const config = (await import('../config/EconomyConfig.js')).default;
    
    let economyState = await EconomyState.getState();
    
    // Handle resets if needed
    if (CoinEconomy.needsDailyReset(economyState.lastDailyReset)) {
      economyState.performDailyReset();
      await economyState.save();
    }
    if (CoinEconomy.needsWeeklyReset(economyState.lastWeeklyReset)) {
      economyState.performWeeklyReset();
      await economyState.save();
    }
    
    res.json({
      ...economyState.getEconomyStatus(),
      config: config.getConfig()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply penalty
router.post('/penalty', async (req, res) => {
  try {
    const { type } = req.body;
    const CoinEconomy = (await import('../services/CoinEconomy.js')).default;
    const EconomyState = (await import('../models/EconomyState.js')).default;
    
    let user = await User.findOne();
    if (!user) {
      user = new User();
    }
    
    const result = CoinEconomy.calculatePenalty(type, user.coins);
    
    if (result.applied) {
      user.coins = result.newBalance;
      await user.save();
      
      // Log penalty
      let economyState = await EconomyState.getState();
      economyState.recordPenalty(type, result.penalty, user.coins + result.penalty, user.coins);
      await economyState.save();
    }
    
    res.json({
      ...result,
      currentBalance: user.coins
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force weekly calibration (for testing)
router.post('/calibrate', async (req, res) => {
  try {
    const EconomyState = (await import('../models/EconomyState.js')).default;
    
    let economyState = await EconomyState.getState();
    const calibration = economyState.performWeeklyReset();
    await economyState.save();
    
    res.json({
      message: 'Calibration complete',
      calibration,
      newBase: economyState.currentBase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
