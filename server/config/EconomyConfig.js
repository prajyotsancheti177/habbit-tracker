/**
 * Economy Configuration
 * 
 * Centralized, configurable constants for the coin-based incentive engine.
 * All values are tunable for economic balancing without code changes.
 * 
 * DESIGN PHILOSOPHY:
 * - Optimize for psychological sustainability, not maximum engagement
 * - Anti-burnout: rewards should feel earned, not farmed
 * - Long-term stability over short-term dopamine spikes
 */

// ============================
// CORE ECONOMIC CONSTANTS
// ============================

/**
 * BASE reward before any multipliers.
 * This is the foundation of all coin calculations.
 * Auto-calibration may adjust this ±5% weekly to maintain target output.
 */
export const BASE = 5;

/**
 * Maximum coins earnable in a single day.
 * Hard cap that overrides all multipliers.
 */
export const DAILY_COIN_CAP = 60;

/**
 * Maximum coins earnable in a single week.
 * Prevents grinding over weekends.
 */
export const WEEKLY_COIN_CAP = 350;

/**
 * Number of actions before diminishing returns kick in.
 * Encourages quality over quantity.
 */
export const DAILY_ACTION_CAP = 10;

/**
 * Target daily coin output for calibration.
 * System will auto-adjust BASE to approach this target.
 */
export const TARGET_DAILY_COINS = 50;

// ============================
// DIFFICULTY MULTIPLIERS
// ============================

/**
 * Strict difficulty enum with fixed multipliers.
 * NO custom values allowed - this prevents gaming the system.
 * 
 * Rationale:
 * - EASY (1.0x): Simple habits like drinking water
 * - MEDIUM (1.5x): Moderate effort like 30min exercise
 * - HARD (2.0x): Challenging tasks requiring focus
 * - EXTREME (3.0x): Major accomplishments, use sparingly
 */
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXTREME: 'extreme'
};

export const DIFFICULTY_MULTIPLIERS = {
  [DIFFICULTY.EASY]: 1.0,
  [DIFFICULTY.MEDIUM]: 1.5,
  [DIFFICULTY.HARD]: 2.0,
  [DIFFICULTY.EXTREME]: 3.0
};

/**
 * Default difficulty for items without explicit setting.
 */
export const DEFAULT_DIFFICULTY = DIFFICULTY.MEDIUM;

// ============================
// CONSISTENCY (STREAK) SETTINGS
// ============================

/**
 * Streak multiplier growth factor.
 * Using logarithmic growth to prevent exponential inflation.
 * Formula: 1 + log2(streak + 1) × STREAK_GROWTH_FACTOR
 */
export const STREAK_GROWTH_FACTOR = 0.2;

/**
 * Maximum streak multiplier to prevent runaway growth.
 */
export const MAX_STREAK_MULTIPLIER = 2.0;

// ============================
// SCARCITY (DIMINISHING RETURNS)
// ============================

/**
 * Minimum scarcity multiplier floor.
 * Even after many completions, you still earn something.
 */
export const MIN_SCARCITY_MULTIPLIER = 0.5;

// ============================
// PENALTY SYSTEM (COIN SINKS)
// ============================

/**
 * Penalty amounts for various negative events.
 * These create a balanced economy by removing coins.
 * 
 * Rationale:
 * - Penalties should sting but not devastate
 * - Keeps coins feeling valuable
 * - Prevents "hoard and never lose" mentality
 */
export const PENALTIES = {
  MISS_HABIT: -5,         // Missed a scheduled habit
  BREAK_STREAK: -10,      // Streak was broken
  SNOOZE_TASK: -2,        // Postponed a task
  FAIL_DEEP_WORK: -5      // Didn't complete focused work session
};

/**
 * Penalty event types for logging.
 */
export const PENALTY_TYPES = {
  MISS_HABIT: 'miss_habit',
  BREAK_STREAK: 'break_streak',
  SNOOZE_TASK: 'snooze_task',
  FAIL_DEEP_WORK: 'fail_deep_work'
};

// ============================
// CALIBRATION SETTINGS
// ============================

/**
 * How much to adjust BASE during weekly calibration.
 * Small adjustments prevent wild swings.
 */
export const CALIBRATION_FACTOR = 0.05; // 5% adjustment

/**
 * Minimum BASE value to prevent zero rewards.
 */
export const MIN_BASE = 2;

/**
 * Maximum BASE value to prevent inflation.
 */
export const MAX_BASE = 10;

// ============================
// HELPER: Get current config as object
// ============================

export const getConfig = () => ({
  BASE,
  DAILY_COIN_CAP,
  WEEKLY_COIN_CAP,
  DAILY_ACTION_CAP,
  TARGET_DAILY_COINS,
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_DIFFICULTY,
  STREAK_GROWTH_FACTOR,
  MAX_STREAK_MULTIPLIER,
  MIN_SCARCITY_MULTIPLIER,
  PENALTIES,
  CALIBRATION_FACTOR,
  MIN_BASE,
  MAX_BASE
});

export default {
  BASE,
  DAILY_COIN_CAP,
  WEEKLY_COIN_CAP,
  DAILY_ACTION_CAP,
  TARGET_DAILY_COINS,
  DIFFICULTY,
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_DIFFICULTY,
  STREAK_GROWTH_FACTOR,
  MAX_STREAK_MULTIPLIER,
  MIN_SCARCITY_MULTIPLIER,
  PENALTIES,
  PENALTY_TYPES,
  CALIBRATION_FACTOR,
  MIN_BASE,
  MAX_BASE,
  getConfig
};
