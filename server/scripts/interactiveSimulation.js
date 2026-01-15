/**
 * Interactive Day-by-Day Simulation Script
 * 
 * This script simulates habit tracking by calling the actual API endpoints,
 * allowing you to see the real coin calculations and website functionality.
 * 
 * It runs day-by-day, making real API calls with mock time headers.
 * 
 * Run with: node scripts/interactiveSimulation.js
 * 
 * Options:
 *   --days=N        Number of days to simulate (default: 90)
 *   --speed=N       Delay between days in ms (default: 100)
 *   --verbose       Show detailed logs
 *   --keep-data     Don't clear existing data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Tag from '../models/Tag.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import CompletionLog from '../models/CompletionLog.js';
import User from '../models/User.js';
import EconomyState from '../models/EconomyState.js';

// HTTP client for API calls
const API_BASE = 'http://localhost:5001/api';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const DAYS_TO_SIMULATE = parseInt(args.days) || 90;
const DELAY_BETWEEN_DAYS = parseInt(args.speed) || 100;
const VERBOSE = args.verbose || false;
const KEEP_DATA = args['keep-data'] || false;

// Helper functions
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API helper with mock time header
async function apiCall(method, endpoint, data = null, mockTime = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (mockTime) {
    options.headers['X-Debug-Mock-Time'] = mockTime.toISOString();
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} - ${text}`);
    }
    return await response.json();
  } catch (error) {
    if (VERBOSE) console.error(`API Error [${method} ${endpoint}]:`, error.message);
    return null;
  }
}

// ===== DATA DEFINITIONS =====
const tagDefinitions = [
  { name: 'Health', color: '#22c55e', icon: '💪' },
  { name: 'Productivity', color: '#3b82f6', icon: '⚡' },
  { name: 'Learning', color: '#8b5cf6', icon: '📚' },
  { name: 'Mindfulness', color: '#06b6d4', icon: '🧘' },
  { name: 'Finance', color: '#f59e0b', icon: '💰' },
  { name: 'Social', color: '#ec4899', icon: '👥' },
];

const habitDefinitions = [
  // Daily habits with different completion rates
  {
    title: 'Morning Exercise',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'medium',
    icon: '🏃',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.75
  },
  {
    title: 'Read 30 mins',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'easy',
    icon: '📖',
    color: '#8b5cf6',
    tags: ['Learning'],
    completionRate: 0.85
  },
  {
    title: 'Meditate',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'easy',
    icon: '🧘',
    color: '#06b6d4',
    tags: ['Mindfulness'],
    completionRate: 0.6
  },
  {
    title: 'Drink Water',
    type: 'recurring',
    frequency: 'daily',
    target: 8,
    difficulty: 'easy',
    icon: '💧',
    color: '#3b82f6',
    tags: ['Health'],
    completionRate: 0.7,
    multiComplete: true
  },
  {
    title: 'No Social Media AM',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'hard',
    icon: '📵',
    color: '#ef4444',
    tags: ['Productivity'],
    completionRate: 0.5
  },

  // Weekly habits
  {
    title: 'Gym Session',
    type: 'recurring',
    frequency: 'weekly',
    target: 3,
    difficulty: 'hard',
    icon: '🏋️',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.6
  },
  {
    title: 'Call Family',
    type: 'recurring',
    frequency: 'weekly',
    target: 1,
    difficulty: 'easy',
    icon: '📞',
    color: '#ec4899',
    tags: ['Social'],
    completionRate: 0.9
  },

  // Value-based habits
  {
    title: 'Running',
    type: 'recurring',
    frequency: 'weekly',
    trackingType: 'value',
    targetValue: 20,
    unit: 'km',
    difficulty: 'hard',
    icon: '🏃‍♂️',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.55
  },
  {
    title: 'Daily Steps',
    type: 'recurring',
    frequency: 'daily',
    trackingType: 'value',
    targetValue: 10000,
    unit: 'steps',
    difficulty: 'medium',
    icon: '👟',
    color: '#3b82f6',
    tags: ['Health'],
    completionRate: 0.5
  }
];

const taskDefinitions = [
  {
    title: 'Complete Project Report',
    priority: 'high',
    difficulty: 'hard',
    icon: '📊',
    tags: ['Productivity'],
    dueInDays: 30
  },
  {
    title: 'Book Dentist Appointment',
    priority: 'medium',
    difficulty: 'easy',
    icon: '🦷',
    tags: ['Health'],
    dueInDays: 14
  },
  {
    title: 'Review Budget',
    priority: 'medium',
    difficulty: 'medium',
    icon: '💰',
    tags: ['Finance'],
    dueInDays: 7
  }
];

// ===== MAIN SIMULATION =====
async function runInteractiveSimulation() {
  console.log('='.repeat(60));
  console.log('INTERACTIVE DAY-BY-DAY SIMULATION');
  console.log('='.repeat(60));
  console.log(`Days to simulate: ${DAYS_TO_SIMULATE}`);
  console.log(`Delay between days: ${DELAY_BETWEEN_DAYS}ms`);
  console.log(`Verbose mode: ${VERBOSE}`);
  console.log('='.repeat(60));
  
  // Connect to DB for initial setup
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data unless --keep-data
  if (!KEEP_DATA) {
    console.log('\n🗑️  Clearing existing data...');
    await Tag.deleteMany({});
    await Habit.deleteMany({});
    await Task.deleteMany({});
    await CompletionLog.deleteMany({});
    await User.deleteMany({});
    await EconomyState.deleteMany({});
    
    // Create initial user
    const user = new User({ coins: 0, totalCoinsEarned: 0 });
    await user.save();
    
    const economyState = new EconomyState();
    await economyState.save();
  }

  // Create tags via API
  console.log('\n🏷️  Creating tags...');
  const tagMap = {};
  for (const tagDef of tagDefinitions) {
    const tag = await apiCall('POST', '/tags', tagDef);
    if (tag) {
      tagMap[tagDef.name] = tag._id;
      console.log(`   Created: ${tagDef.icon} ${tagDef.name}`);
    }
  }

  // Create habits via API
  console.log('\n🎯 Creating habits...');
  const habits = [];
  for (const habitDef of habitDefinitions) {
    const habitData = {
      ...habitDef,
      tags: habitDef.tags?.map(t => tagMap[t]).filter(Boolean) || []
    };
    delete habitData.completionRate;
    delete habitData.multiComplete;
    
    const habit = await apiCall('POST', '/habits', habitData);
    if (habit) {
      habits.push({ ...habitDef, _id: habit._id });
      console.log(`   Created: ${habitDef.icon} ${habitDef.title}`);
    }
  }

  // Create tasks via API
  console.log('\n📋 Creating tasks...');
  const tasks = [];
  for (const taskDef of taskDefinitions) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + taskDef.dueInDays);
    
    const taskData = {
      ...taskDef,
      dueDate,
      tags: taskDef.tags?.map(t => tagMap[t]).filter(Boolean) || []
    };
    delete taskData.dueInDays;
    
    const task = await apiCall('POST', '/tasks', taskData);
    if (task) {
      tasks.push({ ...taskDef, _id: task._id });
      console.log(`   Created: ${taskDef.icon} ${taskDef.title}`);
    }
  }

  // Close DB connection - we'll use API from now on
  await mongoose.disconnect();
  console.log('\n📡 Switching to API-only mode...\n');

  // Calculate simulation dates
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS_TO_SIMULATE);
  startDate.setHours(8, 0, 0, 0);

  let totalCoinsEarned = 0;
  let completedHabits = 0;
  let missedHabits = 0;

  console.log('📅 Starting day-by-day simulation...\n');
  console.log('Date                | Actions                              | Coins');
  console.log('-'.repeat(70));

  // Simulate each day
  for (let day = 0; day < DAYS_TO_SIMULATE; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let dayCoins = 0;
    let dayActions = [];

    // First, trigger the habits endpoint to process any period resets
    await apiCall('GET', '/habits', null, currentDate);

    // Process each habit
    for (const habit of habits) {
      const shouldComplete = Math.random() < (habit.completionRate || 0.5);
      
      if (habit.frequency === 'daily') {
        if (habit.trackingType === 'value') {
          // Log value for value-based habits
          const value = shouldComplete 
            ? habit.targetValue + randomBetween(-500, 1000)
            : randomBetween(1000, habit.targetValue * 0.8);
          
          const result = await apiCall('PATCH', `/habits/${habit._id}/value`, {
            value,
            increment: false
          }, currentDate);
          
          if (result) {
            dayActions.push(`${habit.icon}+${value}`);
          }
        } else if (habit.multiComplete && habit.target > 1) {
          // Multiple completions per day
          const numCompletions = shouldComplete 
            ? habit.target 
            : randomBetween(1, habit.target - 1);
          
          for (let i = 0; i < numCompletions; i++) {
            const mockTime = new Date(currentDate);
            mockTime.setHours(8 + i * 2);
            
            const result = await apiCall('POST', `/habits/${habit._id}/complete`, {}, mockTime);
            if (result) {
              dayCoins += result.coinsEarned || 0;
              completedHabits++;
            }
          }
          dayActions.push(`${habit.icon}×${numCompletions}`);
        } else {
          // Single completion
          if (shouldComplete) {
            const mockTime = new Date(currentDate);
            mockTime.setHours(randomBetween(8, 20));
            
            const result = await apiCall('POST', `/habits/${habit._id}/complete`, {}, mockTime);
            if (result) {
              dayCoins += result.coinsEarned || 0;
              completedHabits++;
              dayActions.push(`${habit.icon}✓`);
            }
          } else {
            missedHabits++;
            if (VERBOSE) dayActions.push(`${habit.icon}✗`);
          }
        }
      } else if (habit.frequency === 'weekly' && dayOfWeek === randomBetween(1, 5)) {
        // Weekly habits - complete on random weekday
        if (shouldComplete) {
          if (habit.trackingType === 'value') {
            const value = randomBetween(habit.targetValue * 0.8, habit.targetValue * 1.2);
            await apiCall('PATCH', `/habits/${habit._id}/value`, {
              value,
              increment: true
            }, currentDate);
            dayActions.push(`${habit.icon}+${value}`);
          } else {
            const result = await apiCall('POST', `/habits/${habit._id}/complete`, {}, currentDate);
            if (result) {
              dayCoins += result.coinsEarned || 0;
              completedHabits++;
              dayActions.push(`${habit.icon}✓`);
            }
          }
        }
      }
    }

    // Randomly complete tasks
    for (const task of tasks) {
      if (Math.random() < 0.02) { // 2% chance per day
        const result = await apiCall('POST', `/tasks/${task._id}/complete`, {}, currentDate);
        if (result) {
          dayCoins += result.coinsEarned || 0;
          dayActions.push(`📋✓`);
        }
      }
    }

    totalCoinsEarned += dayCoins;

    // Print day summary
    const dateStr = currentDate.toISOString().split('T')[0];
    const actionsStr = dayActions.slice(0, 6).join(' ') || '-';
    const coinsStr = dayCoins > 0 ? `+${dayCoins} 🪙` : '';
    
    console.log(`${dateStr}  | ${actionsStr.padEnd(36)} | ${coinsStr}`);

    // Short delay to not overwhelm the API
    await sleep(DELAY_BETWEEN_DAYS);
  }

  console.log('-'.repeat(70));
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Days simulated:     ${DAYS_TO_SIMULATE}`);
  console.log(`Habits completed:   ${completedHabits}`);
  console.log(`Habits missed:      ${missedHabits}`);
  console.log(`Total coins earned: ${totalCoinsEarned} 🪙`);
  console.log('='.repeat(60));
  
  // Get final state from API
  const finalUser = await apiCall('GET', '/rewards/balance');
  if (finalUser) {
    console.log(`\nFinal coin balance: ${finalUser.coins} 🪙`);
  }
}

// Run the simulation
runInteractiveSimulation().catch(console.error);
