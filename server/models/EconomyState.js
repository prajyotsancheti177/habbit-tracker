/**
 * Economy State Model
 * 
 * Tracks daily/weekly economy metrics for cap enforcement and calibration.
 * This is a singleton document that persists economy state across sessions.
 */

import mongoose from 'mongoose';
import config from '../config/EconomyConfig.js';

const economyStateSchema = new mongoose.Schema({
  // Current BASE value (may differ from config due to auto-calibration)
  currentBase: {
    type: Number,
    default: config.BASE
  },
  
  // Daily tracking
  coinsToday: {
    type: Number,
    default: 0
  },
  completionsToday: {
    type: Number,
    default: 0
  },
  lastDailyReset: {
    type: Date,
    default: Date.now
  },
  
  // Weekly tracking
  coinsThisWeek: {
    type: Number,
    default: 0
  },
  completionsThisWeek: {
    type: Number,
    default: 0
  },
  lastWeeklyReset: {
    type: Date,
    default: Date.now
  },
  
  // Calibration history
  calibrationHistory: [{
    date: { type: Date, default: Date.now },
    previousBase: Number,
    newBase: Number,
    avgDailyCoins: Number,
    reason: String
  }],
  
  // Penalty log
  penaltyLog: [{
    date: { type: Date, default: Date.now },
    type: String,
    amount: Number,
    balanceBefore: Number,
    balanceAfter: Number
  }],
  
  // Daily coin history for calibration (last 7 days)
  dailyCoinHistory: [{
    date: Date,
    coins: Number,
    completions: Number
  }]
}, {
  timestamps: true
});

// Static method to get or create singleton
economyStateSchema.statics.getState = async function() {
  let state = await this.findOne();
  if (!state) {
    state = new this();
    await state.save();
  }
  return state;
};

// Method to record a completion
economyStateSchema.methods.recordCompletion = function(coins) {
  this.coinsToday += coins;
  this.completionsToday += 1;
  this.coinsThisWeek += coins;
  this.completionsThisWeek += 1;
};

// Method to record a penalty
economyStateSchema.methods.recordPenalty = function(type, amount, balanceBefore, balanceAfter) {
  this.penaltyLog.push({
    date: new Date(),
    type,
    amount,
    balanceBefore,
    balanceAfter
  });
  
  // Keep only last 100 penalties
  if (this.penaltyLog.length > 100) {
    this.penaltyLog = this.penaltyLog.slice(-100);
  }
};

// Method to perform daily reset
economyStateSchema.methods.performDailyReset = function() {
  // Archive today's data
  this.dailyCoinHistory.push({
    date: new Date(this.lastDailyReset),
    coins: this.coinsToday,
    completions: this.completionsToday
  });
  
  // Keep only last 7 days
  if (this.dailyCoinHistory.length > 7) {
    this.dailyCoinHistory = this.dailyCoinHistory.slice(-7);
  }
  
  // Reset daily counters
  this.coinsToday = 0;
  this.completionsToday = 0;
  this.lastDailyReset = new Date();
};

// Method to perform weekly reset and calibration
economyStateSchema.methods.performWeeklyReset = function() {
  // Calculate average daily coins
  const avgDailyCoins = this.dailyCoinHistory.length > 0
    ? this.dailyCoinHistory.reduce((sum, day) => sum + day.coins, 0) / this.dailyCoinHistory.length
    : 0;
  
  // Import calibration function
  const { calculateCalibration } = require('../services/CoinEconomy.js');
  
  // Calculate calibration
  const calibration = calculateCalibration(avgDailyCoins, this.currentBase);
  
  // Record calibration
  if (calibration.reason !== 'no_change') {
    this.calibrationHistory.push({
      date: new Date(),
      previousBase: calibration.previousBase,
      newBase: calibration.newBase,
      avgDailyCoins: calibration.avgDailyCoins,
      reason: calibration.reason
    });
    
    // Keep only last 52 calibrations (1 year)
    if (this.calibrationHistory.length > 52) {
      this.calibrationHistory = this.calibrationHistory.slice(-52);
    }
    
    // Apply new BASE
    this.currentBase = calibration.newBase;
  }
  
  // Reset weekly counters
  this.coinsThisWeek = 0;
  this.completionsThisWeek = 0;
  this.lastWeeklyReset = new Date();
  
  return calibration;
};

// Method to get current multipliers and state
economyStateSchema.methods.getEconomyStatus = function() {
  return {
    currentBase: this.currentBase,
    coinsToday: this.coinsToday,
    completionsToday: this.completionsToday,
    coinsThisWeek: this.coinsThisWeek,
    dailyCoinCap: config.DAILY_COIN_CAP,
    weeklyCoinCap: config.WEEKLY_COIN_CAP,
    remainingToday: Math.max(0, config.DAILY_COIN_CAP - this.coinsToday),
    remainingThisWeek: Math.max(0, config.WEEKLY_COIN_CAP - this.coinsThisWeek),
    lastCalibration: this.calibrationHistory.length > 0 
      ? this.calibrationHistory[this.calibrationHistory.length - 1] 
      : null
  };
};

const EconomyState = mongoose.model('EconomyState', economyStateSchema);

export default EconomyState;
