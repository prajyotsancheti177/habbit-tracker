/**
 * Comprehensive Seed Script
 * 
 * Simulates 3 months of habit tracking activity with:
 * - Various tags (health, productivity, learning, etc.)
 * - Different habit types (recurring daily/weekly/monthly, one-time, value-based)
 * - Different difficulties (easy, medium, hard)
 * - Various tasks with subtasks and due dates
 * - Realistic completion patterns (complete, partial, missed)
 * 
 * Run with: node scripts/seedSimulation.js
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

// Configuration
const SIMULATION_START = new Date();
SIMULATION_START.setMonth(SIMULATION_START.getMonth() - 3); // 3 months ago
SIMULATION_START.setDate(1); // Start of month
SIMULATION_START.setHours(0, 0, 0, 0);

const SIMULATION_END = new Date();
SIMULATION_END.setHours(23, 59, 59, 999);

console.log('='.repeat(60));
console.log('HABIT TRACKER SIMULATION SEED SCRIPT');
console.log('='.repeat(60));
console.log(`Simulating from: ${SIMULATION_START.toDateString()}`);
console.log(`            to: ${SIMULATION_END.toDateString()}`);
console.log('='.repeat(60));

// Helper to get random element from array
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number in range
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to create date at specific time
const dateAt = (date, hour = 9, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ===== TAG DEFINITIONS =====
const tagDefinitions = [
  { name: 'Health', color: '#22c55e', icon: '💪', description: 'Physical health and fitness' },
  { name: 'Productivity', color: '#3b82f6', icon: '⚡', description: 'Work and productivity' },
  { name: 'Learning', color: '#8b5cf6', icon: '📚', description: 'Education and skills' },
  { name: 'Mindfulness', color: '#06b6d4', icon: '🧘', description: 'Mental health and meditation' },
  { name: 'Finance', color: '#f59e0b', icon: '💰', description: 'Money and investments' },
  { name: 'Social', color: '#ec4899', icon: '👥', description: 'Relationships and networking' },
  { name: 'Creative', color: '#f97316', icon: '🎨', description: 'Art and creativity' },
  { name: 'Home', color: '#84cc16', icon: '🏠', description: 'Household and chores' },
];

// ===== HABIT DEFINITIONS =====
const habitDefinitions = [
  // Daily recurring habits
  {
    title: 'Morning Exercise',
    description: 'Start the day with 30 minutes of exercise',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'medium',
    icon: '🏃',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.75 // 75% completion rate
  },
  {
    title: 'Read for 30 mins',
    description: 'Read at least 30 minutes daily',
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
    description: '10 minutes of mindful meditation',
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
    title: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    type: 'recurring',
    frequency: 'daily',
    target: 8,
    difficulty: 'easy',
    icon: '💧',
    color: '#3b82f6',
    tags: ['Health'],
    completionRate: 0.7,
    avgCompletions: 6 // Average completions per day when not fully complete
  },
  {
    title: 'No Social Media before noon',
    description: 'Avoid social media distractions in the morning',
    type: 'recurring',
    frequency: 'daily',
    target: 1,
    difficulty: 'hard',
    icon: '📵',
    color: '#ef4444',
    tags: ['Productivity', 'Mindfulness'],
    completionRate: 0.55
  },

  // Weekly recurring habits
  {
    title: 'Weekly Gym Session',
    description: 'Hit the gym at least 3 times this week',
    type: 'recurring',
    frequency: 'weekly',
    target: 3,
    difficulty: 'hard',
    icon: '🏋️',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.65,
    avgCompletions: 2
  },
  {
    title: 'Call Family',
    description: 'Weekly call with family members',
    type: 'recurring',
    frequency: 'weekly',
    target: 1,
    difficulty: 'easy',
    icon: '📞',
    color: '#ec4899',
    tags: ['Social'],
    completionRate: 0.9
  },
  {
    title: 'Meal Prep Sunday',
    description: 'Prepare meals for the week',
    type: 'recurring',
    frequency: 'weekly',
    target: 1,
    difficulty: 'medium',
    icon: '🍱',
    color: '#84cc16',
    tags: ['Health', 'Home'],
    completionRate: 0.7
  },
  {
    title: 'Review Finances',
    description: 'Track expenses and review budget',
    type: 'recurring',
    frequency: 'weekly',
    target: 1,
    difficulty: 'medium',
    icon: '💰',
    color: '#f59e0b',
    tags: ['Finance'],
    completionRate: 0.6
  },

  // Monthly recurring habits
  {
    title: 'Deep Clean House',
    description: 'Thorough cleaning of the entire house',
    type: 'recurring',
    frequency: 'monthly',
    target: 1,
    difficulty: 'hard',
    icon: '🧹',
    color: '#84cc16',
    tags: ['Home'],
    completionRate: 0.8
  },
  {
    title: 'Monthly Budget Review',
    description: 'Complete review of monthly spending and savings',
    type: 'recurring',
    frequency: 'monthly',
    target: 1,
    difficulty: 'medium',
    icon: '📊',
    color: '#f59e0b',
    tags: ['Finance'],
    completionRate: 0.9
  },

  // Value-based habits
  {
    title: 'Running',
    description: 'Track kilometers run',
    type: 'recurring',
    frequency: 'weekly',
    trackingType: 'value',
    targetValue: 20,
    unit: 'km',
    difficulty: 'hard',
    icon: '🏃',
    color: '#22c55e',
    tags: ['Health'],
    completionRate: 0.6,
    avgValue: 15
  },
  {
    title: 'Steps Counter',
    description: 'Daily step count target',
    type: 'recurring',
    frequency: 'daily',
    trackingType: 'value',
    targetValue: 10000,
    unit: 'steps',
    difficulty: 'medium',
    icon: '👟',
    color: '#3b82f6',
    tags: ['Health'],
    completionRate: 0.5,
    avgValue: 7500
  },
  {
    title: 'Calorie Intake',
    description: 'Track daily calories consumed',
    type: 'recurring',
    frequency: 'daily',
    trackingType: 'value',
    targetValue: 2000,
    unit: 'cal',
    difficulty: 'medium',
    icon: '🍽️',
    color: '#f97316',
    tags: ['Health'],
    completionRate: 0.7,
    avgValue: 2200
  },

  // One-time habits
  {
    title: 'Complete Online Course',
    description: 'Finish the JavaScript course on Udemy',
    type: 'one-time',
    target: 1,
    difficulty: 'hard',
    icon: '🎓',
    color: '#8b5cf6',
    tags: ['Learning'],
    subtasks: [
      { title: 'Complete Section 1-3', completed: true },
      { title: 'Complete Section 4-6', completed: true },
      { title: 'Complete Section 7-10', completed: false },
      { title: 'Final Project', completed: false }
    ]
  },
  {
    title: 'Learn to Paint',
    description: 'Complete 10 painting tutorials',
    type: 'one-time',
    target: 10,
    difficulty: 'medium',
    icon: '🎨',
    color: '#f97316',
    tags: ['Creative', 'Learning'],
    completionRate: 0.4
  }
];

// ===== TASK DEFINITIONS =====
const taskDefinitions = [
  // Work tasks
  {
    title: 'Q4 Report Preparation',
    description: 'Prepare quarterly report for stakeholders',
    priority: 'high',
    difficulty: 'hard',
    icon: '📊',
    color: '#3b82f6',
    tags: ['Productivity'],
    dueOffset: -30, // Due 30 days ago
    completed: true,
    subtasks: [
      { title: 'Gather data from all departments', completed: true },
      { title: 'Create charts and visualizations', completed: true },
      { title: 'Write executive summary', completed: true },
      { title: 'Review with manager', completed: true }
    ]
  },
  {
    title: 'Website Redesign Project',
    description: 'Lead the company website redesign initiative',
    priority: 'high',
    difficulty: 'hard',
    icon: '🌐',
    color: '#8b5cf6',
    tags: ['Productivity', 'Creative'],
    dueOffset: -15,
    completed: true,
    subtasks: [
      { title: 'Research competitor websites', completed: true },
      { title: 'Create wireframes', completed: true },
      { title: 'Design mockups', completed: true },
      { title: 'Implement frontend', completed: true },
      { title: 'Testing and QA', completed: true }
    ]
  },
  {
    title: 'Annual Performance Review',
    description: 'Self-assessment and goal setting',
    priority: 'medium',
    difficulty: 'medium',
    icon: '📝',
    color: '#f59e0b',
    tags: ['Productivity'],
    dueOffset: 5,
    completed: false,
    subtasks: [
      { title: 'Complete self-assessment form', completed: true },
      { title: 'List accomplishments', completed: true },
      { title: 'Identify growth areas', completed: false },
      { title: 'Set goals for next year', completed: false }
    ]
  },

  // Personal tasks
  {
    title: 'Renew Passport',
    description: 'Passport expires next month, need to renew',
    priority: 'high',
    difficulty: 'easy',
    icon: '🛂',
    color: '#ef4444',
    tags: [],
    dueOffset: -45,
    completed: true
  },
  {
    title: 'Book Vacation',
    description: 'Plan and book summer vacation',
    priority: 'medium',
    difficulty: 'medium',
    icon: '✈️',
    color: '#06b6d4',
    tags: ['Social'],
    dueOffset: -20,
    completed: true,
    subtasks: [
      { title: 'Research destinations', completed: true },
      { title: 'Compare flight prices', completed: true },
      { title: 'Book hotels', completed: true },
      { title: 'Create itinerary', completed: true }
    ]
  },
  {
    title: 'Organize Garage',
    description: 'Clean and organize the garage',
    priority: 'low',
    difficulty: 'hard',
    icon: '🔧',
    color: '#84cc16',
    tags: ['Home'],
    dueOffset: 14,
    completed: false
  },
  {
    title: 'Car Service Appointment',
    description: 'Schedule and complete annual car service',
    priority: 'medium',
    difficulty: 'easy',
    icon: '🚗',
    color: '#f97316',
    tags: [],
    dueOffset: -60,
    completed: true
  },

  // Learning tasks
  {
    title: 'Complete Python Certification',
    description: 'Get certified in Python programming',
    priority: 'medium',
    difficulty: 'hard',
    icon: '🐍',
    color: '#22c55e',
    tags: ['Learning'],
    dueOffset: 30,
    completed: false,
    subtasks: [
      { title: 'Complete online modules', completed: true },
      { title: 'Practice exercises', completed: true },
      { title: 'Mock exams', completed: false },
      { title: 'Final exam', completed: false }
    ]
  },
  {
    title: 'Read 3 Business Books',
    description: 'Complete reading list for the quarter',
    priority: 'low',
    difficulty: 'medium',
    icon: '📚',
    color: '#8b5cf6',
    tags: ['Learning'],
    dueOffset: -10,
    completed: false,
    subtasks: [
      { title: 'Atomic Habits', completed: true },
      { title: 'Deep Work', completed: true },
      { title: 'The Lean Startup', completed: false }
    ]
  },

  // Health tasks
  {
    title: 'Annual Health Checkup',
    description: 'Complete yearly physical examination',
    priority: 'high',
    difficulty: 'easy',
    icon: '🏥',
    color: '#22c55e',
    tags: ['Health'],
    dueOffset: -75,
    completed: true
  },
  {
    title: 'Dentist Appointment',
    description: 'Bi-annual dental cleaning',
    priority: 'medium',
    difficulty: 'easy',
    icon: '🦷',
    color: '#06b6d4',
    tags: ['Health'],
    dueOffset: -40,
    completed: true
  },

  // Finance tasks
  {
    title: 'Tax Filing',
    description: 'Complete and submit annual tax returns',
    priority: 'high',
    difficulty: 'hard',
    icon: '📑',
    color: '#f59e0b',
    tags: ['Finance'],
    dueOffset: -50,
    completed: true,
    subtasks: [
      { title: 'Gather all documents', completed: true },
      { title: 'Calculate deductions', completed: true },
      { title: 'Fill tax forms', completed: true },
      { title: 'Submit to IRS', completed: true }
    ]
  },
  {
    title: 'Set Up Investment Account',
    description: 'Open and fund a new investment account',
    priority: 'medium',
    difficulty: 'medium',
    icon: '📈',
    color: '#22c55e',
    tags: ['Finance'],
    dueOffset: -25,
    completed: true
  }
];

// ===== MAIN SEEDING FUNCTION =====
async function runSimulation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await Tag.deleteMany({});
    await Habit.deleteMany({});
    await Task.deleteMany({});
    await CompletionLog.deleteMany({});
    await User.deleteMany({});
    await EconomyState.deleteMany({});

    // Create user
    console.log('\n👤 Creating user...');
    const user = new User({ coins: 0, totalCoinsEarned: 0 });
    await user.save();

    // Create economy state
    const economyState = new EconomyState();
    await economyState.save();

    // Create tags
    console.log('\n🏷️  Creating tags...');
    const tags = {};
    for (const tagDef of tagDefinitions) {
      const tag = new Tag(tagDef);
      await tag.save();
      tags[tagDef.name] = tag._id;
      console.log(`   Created tag: ${tagDef.icon} ${tagDef.name}`);
    }

    // Create habits
    console.log('\n🎯 Creating habits...');
    const habits = [];
    for (const habitDef of habitDefinitions) {
      const habitData = { ...habitDef };
      
      // Assign tag IDs
      if (habitDef.tags) {
        habitData.tags = habitDef.tags.map(t => tags[t]).filter(Boolean);
      }
      
      // Remove simulation-specific fields
      delete habitData.completionRate;
      delete habitData.avgCompletions;
      delete habitData.avgValue;
      
      // Set creation date to random time in first week of simulation
      const createdOffset = randomBetween(0, 7);
      const createdAt = new Date(SIMULATION_START);
      createdAt.setDate(createdAt.getDate() + createdOffset);
      habitData.createdAt = createdAt;
      habitData.periodStartDate = createdAt;
      
      const habit = new Habit(habitData);
      await habit.save();
      habits.push({ ...habitDef, _id: habit._id, habit });
      console.log(`   Created habit: ${habitDef.icon} ${habitDef.title} (${habitDef.type}/${habitDef.frequency || 'once'})`);
    }

    // Create tasks
    console.log('\n📋 Creating tasks...');
    const tasks = [];
    for (const taskDef of taskDefinitions) {
      const taskData = { ...taskDef };
      
      // Assign tag IDs
      if (taskDef.tags) {
        taskData.tags = taskDef.tags.map(t => tags[t]).filter(Boolean);
      }
      
      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (taskDef.dueOffset || 0));
      taskData.dueDate = dueDate;
      
      // Set status based on completion
      if (taskDef.completed) {
        taskData.status = 'done';
      } else if (taskDef.subtasks?.some(s => s.completed)) {
        taskData.status = 'in-progress';
      }
      
      delete taskData.dueOffset;
      delete taskData.completed;
      
      const task = new Task(taskData);
      await task.save();
      tasks.push({ ...taskDef, _id: task._id });
      console.log(`   Created task: ${taskDef.icon} ${taskDef.title} (${taskDef.priority} priority)`);
    }

    // Generate completion logs
    console.log('\n📝 Generating completion logs...');
    let totalLogs = 0;
    let totalCoins = 0;

    // Iterate through each day
    const current = new Date(SIMULATION_START);
    while (current <= SIMULATION_END) {
      const dayOfWeek = current.getDay(); // 0 = Sunday
      const dayOfMonth = current.getDate();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isEndOfWeek = dayOfWeek === 0; // Sunday
      const isEndOfMonth = dayOfMonth === new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

      // Process each habit
      for (const habitDef of habits) {
        if (habitDef.habit.createdAt > current) continue; // Skip if habit wasn't created yet

        const shouldComplete = Math.random() < (habitDef.completionRate || 0.5);
        const frequency = habitDef.frequency;

        // Daily habits
        if (frequency === 'daily') {
          if (habitDef.trackingType === 'value') {
            // Value-based habit
            let value;
            if (shouldComplete) {
              value = habitDef.targetValue + randomBetween(-200, 200);
            } else {
              value = (habitDef.avgValue || habitDef.targetValue * 0.7) + randomBetween(-500, 500);
              if (value < 0) value = randomBetween(100, 500);
            }
            
            const percentage = Math.min(100, Math.round((value / habitDef.targetValue) * 100));
            let completionStatus = 'partial';
            if (percentage >= 100) completionStatus = 'complete';
            else if (percentage === 0) completionStatus = 'missed';

            const log = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'value_log',
              completedAt: dateAt(current, randomBetween(6, 22)),
              valueLogged: value,
              finalPercentage: percentage,
              completionStatus,
              coinsEarned: shouldComplete ? randomBetween(5, 15) : 0
            });
            await log.save();
            totalLogs++;
            totalCoins += log.coinsEarned;
          } else if (habitDef.target > 1) {
            // Multiple completions per day
            const completions = shouldComplete 
              ? habitDef.target 
              : randomBetween(0, habitDef.avgCompletions || habitDef.target - 1);
            
            for (let i = 0; i < completions; i++) {
              const log = new CompletionLog({
                itemType: 'habit',
                itemId: habitDef._id,
                itemTitle: habitDef.title,
                completionType: 'regular',
                completedAt: dateAt(current, 8 + i * 2),
                completionStatus: 'complete',
                coinsEarned: randomBetween(2, 5)
              });
              await log.save();
              totalLogs++;
              totalCoins += log.coinsEarned;
            }

            // Log period end at end of day
            const percentage = Math.round((completions / habitDef.target) * 100);
            let status = 'partial';
            if (percentage >= 100) status = 'complete';
            else if (percentage === 0) status = 'missed';

            const periodLog = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'period_end',
              completedAt: dateAt(current, 23, 59),
              finalPercentage: percentage,
              completionStatus: status,
              coinsEarned: 0
            });
            await periodLog.save();
            totalLogs++;
          } else {
            // Single completion per day
            if (shouldComplete) {
              const log = new CompletionLog({
                itemType: 'habit',
                itemId: habitDef._id,
                itemTitle: habitDef.title,
                completionType: 'regular',
                completedAt: dateAt(current, randomBetween(7, 21)),
                completionStatus: 'complete',
                coinsEarned: randomBetween(5, 15)
              });
              await log.save();
              totalLogs++;
              totalCoins += log.coinsEarned;
            } else {
              // Missed - log period end with 0%
              const log = new CompletionLog({
                itemType: 'habit',
                itemId: habitDef._id,
                itemTitle: habitDef.title,
                completionType: 'period_end',
                completedAt: dateAt(current, 23, 59),
                finalPercentage: 0,
                completionStatus: 'missed',
                coinsEarned: 0
              });
              await log.save();
              totalLogs++;
            }
          }
        }

        // Weekly habits - log on Sundays
        else if (frequency === 'weekly' && isEndOfWeek) {
          if (habitDef.trackingType === 'value') {
            let value;
            if (shouldComplete) {
              value = habitDef.targetValue + randomBetween(-2, 5);
            } else {
              value = (habitDef.avgValue || habitDef.targetValue * 0.6) + randomBetween(-5, 5);
            }
            if (value < 0) value = randomBetween(1, 5);

            const percentage = Math.min(100, Math.round((value / habitDef.targetValue) * 100));
            let completionStatus = 'partial';
            if (percentage >= 100) completionStatus = 'complete';
            else if (percentage === 0) completionStatus = 'missed';

            const log = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'period_end',
              completedAt: dateAt(current, 20),
              valueLogged: value,
              finalPercentage: percentage,
              completionStatus,
              coinsEarned: shouldComplete ? randomBetween(10, 25) : 0
            });
            await log.save();
            totalLogs++;
            totalCoins += log.coinsEarned;
          } else {
            const completions = shouldComplete 
              ? habitDef.target 
              : randomBetween(0, habitDef.avgCompletions || habitDef.target - 1);
            
            const percentage = Math.round((completions / habitDef.target) * 100);
            let status = 'partial';
            if (percentage >= 100) status = 'complete';
            else if (percentage === 0) status = 'missed';

            const log = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'period_end',
              completedAt: dateAt(current, 20),
              finalPercentage: percentage,
              completionStatus: status,
              coinsEarned: status === 'complete' ? randomBetween(15, 30) : 0
            });
            await log.save();
            totalLogs++;
            totalCoins += log.coinsEarned;
          }
        }

        // Monthly habits - log on last day of month
        else if (frequency === 'monthly' && isEndOfMonth) {
          if (shouldComplete) {
            const log = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'period_end',
              completedAt: dateAt(current, 18),
              finalPercentage: 100,
              completionStatus: 'complete',
              coinsEarned: randomBetween(25, 50)
            });
            await log.save();
            totalLogs++;
            totalCoins += log.coinsEarned;
          } else {
            const percentage = randomBetween(0, 80);
            const log = new CompletionLog({
              itemType: 'habit',
              itemId: habitDef._id,
              itemTitle: habitDef.title,
              completionType: 'period_end',
              completedAt: dateAt(current, 23, 59),
              finalPercentage: percentage,
              completionStatus: percentage === 0 ? 'missed' : 'partial',
              coinsEarned: 0
            });
            await log.save();
            totalLogs++;
          }
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
      
      // Progress indicator every 10 days
      if (current.getDate() === 1 || current.getDate() === 15) {
        process.stdout.write('.');
      }
    }
    console.log('\n');

    // Log task completions
    console.log('📋 Generating task completion logs...');
    for (const taskDef of tasks) {
      if (taskDef.completed) {
        const completedAt = new Date();
        completedAt.setDate(completedAt.getDate() + taskDef.dueOffset - randomBetween(1, 5));

        const log = new CompletionLog({
          itemType: 'task',
          itemId: taskDef._id,
          itemTitle: taskDef.title,
          completionType: 'regular',
          completedAt,
          completionStatus: 'complete',
          coinsEarned: taskDef.difficulty === 'hard' ? 50 : taskDef.difficulty === 'medium' ? 25 : 10
        });
        await log.save();
        totalLogs++;
        totalCoins += log.coinsEarned;
        console.log(`   ✓ ${taskDef.title}`);
      }
    }

    // Update user coins
    user.coins = totalCoins;
    user.totalCoinsEarned = totalCoins;
    await user.save();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SIMULATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Tags created:       ${tagDefinitions.length}`);
    console.log(`Habits created:     ${habits.length}`);
    console.log(`Tasks created:      ${tasks.length}`);
    console.log(`Completion logs:    ${totalLogs}`);
    console.log(`Total coins earned: ${totalCoins} 🪙`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during simulation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Run the simulation
runSimulation();
