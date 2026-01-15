/**
 * Coin Economy Service
 * 
 * Core reward calculation engine implementing the closed-loop reward economy.
 * 
 * FORMULA: coins = BASE × DifficultyMultiplier × ConsistencyMultiplier × ScarcityMultiplier
 * 
 * This module handles:
 * - Reward calculation with all multipliers
 * - Daily/weekly cap enforcement
 * - Penalty application
 * - Auto-calibration logic
 */

import config from '../config/EconomyConfig.js';

// ============================
// MULTIPLIER CALCULATIONS
// ============================

/**
 * Get difficulty multiplier from enum.
 * Strictly enforced - no custom values allowed.
 * 
 * @param {string} difficulty - One of: easy, medium, hard, extreme
 * @returns {number} Multiplier value (1.0 - 3.0)
 */
export const getDifficultyMultiplier = (difficulty) => {
  const multiplier = config.DIFFICULTY_MULTIPLIERS[difficulty];
  if (multiplier === undefined) {
    // Fallback to default if invalid difficulty
    console.warn(`Invalid difficulty "${difficulty}", using default`);
    return config.DIFFICULTY_MULTIPLIERS[config.DEFAULT_DIFFICULTY];
  }
  return multiplier;
};

/**
 * Calculate consistency (streak) multiplier.
 * Uses logarithmic growth to prevent exponential inflation.
 * 
 * Formula: 1 + log2(streak + 1) × 0.2
 * 
 * Example outputs:
 * - Streak 0: 1.0
 * - Streak 1: 1.2
 * - Streak 7: 1.6
 * - Streak 30: 1.98
 * - Streak 100: 2.0 (capped)
 * 
 * @param {number} streak - Current streak count
 * @returns {number} Consistency multiplier (1.0 - MAX_STREAK_MULTIPLIER)
 */
export const getConsistencyMultiplier = (streak) => {
  if (streak < 0) streak = 0;
  
  // Logarithmic growth: 1 + log2(streak + 1) × growth_factor
  const multiplier = 1 + (Math.log2(streak + 1) * config.STREAK_GROWTH_FACTOR);
  
  // Cap at maximum to prevent runaway growth
  return Math.min(multiplier, config.MAX_STREAK_MULTIPLIER);
};

/**
 * Calculate scarcity multiplier (diminishing returns).
 * Discourages grinding by reducing rewards as daily completions increase.
 * 
 * Formula: max(0.5, 1 - (completedToday / DAILY_ACTION_CAP))
 * 
 * Example outputs:
 * - 0 completed: 1.0
 * - 5 completed: 0.5
 * - 10+ completed: 0.5 (floored)
 * 
 * @param {number} completedToday - Number of completions today
 * @returns {number} Scarcity multiplier (0.5 - 1.0)
 */
export const getScarcityMultiplier = (completedToday) => {
  if (completedToday < 0) completedToday = 0;
  
  const multiplier = 1 - (completedToday / config.DAILY_ACTION_CAP);
  
  // Floor at minimum to ensure some reward
  return Math.max(multiplier, config.MIN_SCARCITY_MULTIPLIER);
};

// ============================
// CORE REWARD CALCULATION
// ============================

/**
 * Calculate reward coins for a completion.
 * This is the ONLY source of coin generation in the system.
 * 
 * @param {Object} params - Calculation parameters
 * @param {string} params.difficulty - Difficulty level (easy/medium/hard/extreme)
 * @param {number} params.streak - Current streak count
 * @param {number} params.completedToday - Completions so far today
 * @param {number} params.coinsToday - Coins earned so far today
 * @param {number} params.coinsThisWeek - Coins earned so far this week
 * @param {number} [params.baseOverride] - Optional BASE override for calibration
 * @returns {Object} { coins, breakdown, capped }
 */
export const calculateReward = ({
  difficulty,
  streak = 0,
  completedToday = 0,
  coinsToday = 0,
  coinsThisWeek = 0,
  baseOverride = null
}) => {
  const base = baseOverride !== null ? baseOverride : config.BASE;
  
  // Calculate all multipliers
  const difficultyMult = getDifficultyMultiplier(difficulty);
  const consistencyMult = getConsistencyMultiplier(streak);
  const scarcityMult = getScarcityMultiplier(completedToday);
  
  // Apply formula: BASE × Difficulty × Consistency × Scarcity
  let rawCoins = base * difficultyMult * consistencyMult * scarcityMult;
  
  // Round to nearest integer
  rawCoins = Math.round(rawCoins);
  
  // Ensure minimum of 1 coin
  rawCoins = Math.max(1, rawCoins);
  
  // Check caps
  let finalCoins = rawCoins;
  let cappedReason = null;
  
  // Daily cap check
  if (coinsToday + rawCoins > config.DAILY_COIN_CAP) {
    finalCoins = Math.max(0, config.DAILY_COIN_CAP - coinsToday);
    cappedReason = 'daily';
  }
  
  // Weekly cap check (takes precedence)
  if (coinsThisWeek + finalCoins > config.WEEKLY_COIN_CAP) {
    finalCoins = Math.max(0, config.WEEKLY_COIN_CAP - coinsThisWeek);
    cappedReason = 'weekly';
  }
  
  return {
    coins: finalCoins,
    rawCoins,
    capped: cappedReason !== null,
    cappedReason,
    breakdown: {
      base,
      difficultyMultiplier: difficultyMult,
      consistencyMultiplier: parseFloat(consistencyMult.toFixed(2)),
      scarcityMultiplier: parseFloat(scarcityMult.toFixed(2)),
      difficulty,
      streak,
      completedToday
    }
  };
};

// ============================
// PENALTY SYSTEM
// ============================

/**
 * Calculate penalty for a negative event.
 * Penalties create coin sinks to maintain economic balance.
 * 
 * @param {string} penaltyType - Type of penalty (from PENALTY_TYPES)
 * @param {number} currentBalance - Current coin balance
 * @returns {Object} { penalty, newBalance, applied }
 */
export const calculatePenalty = (penaltyType, currentBalance = 0) => {
  const penaltyAmount = config.PENALTIES[penaltyType.toUpperCase()] || 0;
  
  if (penaltyAmount === 0) {
    return {
      penalty: 0,
      newBalance: currentBalance,
      applied: false,
      reason: 'Unknown penalty type'
    };
  }
  
  // Calculate new balance (never go below zero)
  const newBalance = Math.max(0, currentBalance + penaltyAmount);
  const actualPenalty = currentBalance - newBalance;
  
  return {
    penalty: actualPenalty,
    penaltyType,
    newBalance,
    applied: true
  };
};

// ============================
// AUTO-CALIBRATION
// ============================

/**
 * Calculate calibration adjustment for BASE.
 * Run weekly to maintain target coin output.
 * 
 * @param {number} avgDailyCoins - Average daily coins over the past week
 * @param {number} currentBase - Current BASE value
 * @returns {Object} { newBase, adjustment, reason }
 */
export const calculateCalibration = (avgDailyCoins, currentBase = config.BASE) => {
  const target = config.TARGET_DAILY_COINS;
  let newBase = currentBase;
  let adjustment = 0;
  let reason = 'no_change';
  
  if (avgDailyCoins > target * 1.1) {
    // Earning too much - reduce BASE by 5%
    adjustment = -config.CALIBRATION_FACTOR;
    newBase = currentBase * (1 + adjustment);
    reason = 'above_target';
  } else if (avgDailyCoins < target * 0.9) {
    // Earning too little - increase BASE by 5%
    adjustment = config.CALIBRATION_FACTOR;
    newBase = currentBase * (1 + adjustment);
    reason = 'below_target';
  }
  
  // Enforce min/max bounds
  newBase = Math.max(config.MIN_BASE, Math.min(config.MAX_BASE, newBase));
  
  // Round to 2 decimal places
  newBase = parseFloat(newBase.toFixed(2));
  
  return {
    previousBase: currentBase,
    newBase,
    adjustment: parseFloat((adjustment * 100).toFixed(1)), // as percentage
    reason,
    avgDailyCoins,
    target
  };
};

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Check if daily reset is needed.
 * @param {Date} lastReset - Last reset timestamp
 * @returns {boolean}
 */
export const needsDailyReset = (lastReset) => {
  if (!lastReset) return true;
  
  const now = new Date();
  const last = new Date(lastReset);
  
  // Check if it's a new day
  return now.toDateString() !== last.toDateString();
};

/**
 * Check if weekly reset is needed.
 * @param {Date} lastReset - Last reset timestamp
 * @returns {boolean}
 */
export const needsWeeklyReset = (lastReset) => {
  if (!lastReset) return true;
  
  const now = new Date();
  const last = new Date(lastReset);
  
  // Get week number
  const getWeek = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date - firstDayOfYear) / 86400000 + firstDayOfYear.getDay() + 1) / 7);
  };
  
  return getWeek(now) !== getWeek(last) || now.getFullYear() !== last.getFullYear();
};

/**
 * Get estimated daily coins for a given usage pattern.
 * Useful for showing users what they can expect.
 * 
 * @param {Object} pattern - Usage pattern
 * @returns {number} Estimated daily coins
 */
export const estimateDailyCoins = ({
  easyCount = 0,
  mediumCount = 0,
  hardCount = 0,
  extremeCount = 0,
  averageStreak = 0
}) => {
  let total = 0;
  let completed = 0;
  
  const addCompletion = (difficulty) => {
    const result = calculateReward({
      difficulty,
      streak: averageStreak,
      completedToday: completed,
      coinsToday: total,
      coinsThisWeek: 0
    });
    total += result.coins;
    completed++;
  };
  
  // Add easy tasks
  for (let i = 0; i < easyCount; i++) addCompletion(config.DIFFICULTY.EASY);
  
  // Add medium tasks
  for (let i = 0; i < mediumCount; i++) addCompletion(config.DIFFICULTY.MEDIUM);
  
  // Add hard tasks
  for (let i = 0; i < hardCount; i++) addCompletion(config.DIFFICULTY.HARD);
  
  // Add extreme tasks
  for (let i = 0; i < extremeCount; i++) addCompletion(config.DIFFICULTY.EXTREME);
  
  return total;
};

export default {
  getDifficultyMultiplier,
  getConsistencyMultiplier,
  getScarcityMultiplier,
  calculateReward,
  calculatePenalty,
  calculateCalibration,
  needsDailyReset,
  needsWeeklyReset,
  estimateDailyCoins
};
