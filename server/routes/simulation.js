import express from 'express';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import CompletionLog from '../models/CompletionLog.js';

const router = express.Router();

// Simulation state (in-memory)
let simulationState = {
  currentDate: null,
  isRunning: false,
  habits: {},  // Track habit IDs by name
  tasks: {}    // Track task IDs by name
};

// Define the habits and tasks to create
const HABITS_CONFIG = [
  { title: 'Daily Steps', type: 'recurring', frequency: 'daily', trackingType: 'value', targetValue: 10000, icon: '👟', color: '#3b82f6' },
  { title: 'Morning Exercise', type: 'recurring', frequency: 'daily', trackingType: 'count', target: 1, icon: '🏃', color: '#22c55e' },
  { title: 'Drink 8 Glasses Water', type: 'recurring', frequency: 'daily', trackingType: 'count', target: 8, icon: '💧', color: '#06b6d4' },
  { title: 'Weekly Gym Session', type: 'recurring', frequency: 'weekly', trackingType: 'count', target: 3, icon: '🏋️', color: '#8b5cf6' },
  { title: 'Call Family Weekly', type: 'recurring', frequency: 'weekly', trackingType: 'count', target: 1, icon: '📞', color: '#ec4899' },
  { title: 'Monthly Budget Review', type: 'recurring', frequency: 'monthly', trackingType: 'count', target: 1, icon: '💰', color: '#f59e0b' },
  { title: 'Weekly Running', type: 'recurring', frequency: 'weekly', trackingType: 'value', targetValue: 20, icon: '🏃‍♂️', color: '#ef4444' },
  { title: 'Meditation Challenge', type: 'recurring', frequency: 'daily', trackingType: 'count', target: 1, icon: '🧘', color: '#a855f7' }
];

const TASKS_CONFIG = [
  { title: 'Finish Report', priority: 'high', icon: '📊', color: '#8b5cf6' }
];

// Day-by-day actions from CSV (parsed)
const SIMULATION_ACTIONS = {
  '2025-11-20': [
    { habit: 'Daily Steps', action: 'log_value', value: 8500 },
    { habit: 'Morning Exercise', action: 'complete' },
    { habit: 'Drink 8 Glasses Water', action: 'partial', value: 5 },
    { habit: 'Weekly Gym Session', action: 'increment' },
    { habit: 'Weekly Running', action: 'log_value', value: 5 },
    { habit: 'Meditation Challenge', action: 'complete' }
  ],
  '2025-11-21': [
    { habit: 'Weekly Gym Session', action: 'increment' },
    { habit: 'Weekly Running', action: 'log_value', value: 3 },
    { habit: 'Meditation Challenge', action: 'complete' },
    { task: 'Finish Report', action: 'start' }
  ],
  '2025-11-22': [
    { habit: 'Morning Exercise', action: 'complete' },
    { habit: 'Drink 8 Glasses Water', action: 'complete' },
    { habit: 'Weekly Gym Session', action: 'increment' },
    { habit: 'Call Family Weekly', action: 'complete' },
    { habit: 'Monthly Budget Review', action: 'complete' },
    { habit: 'Weekly Running', action: 'log_value', value: 7 },
    { habit: 'Meditation Challenge', action: 'complete' }
  ],
  '2025-11-23': [
    { habit: 'Daily Steps', action: 'log_value', value: 6000 },
    { habit: 'Weekly Running', action: 'log_value', value: 5 },
    { habit: 'Meditation Challenge', action: 'archive' },
    { task: 'Finish Report', action: 'complete' }
  ],
  '2025-11-24': [],
  '2025-11-25': [],
  '2025-11-26': [],
  '2025-11-27': [],
  '2025-11-28': [
    { habit: 'Call Family Weekly', action: 'complete' },
    { habit: 'Weekly Running', action: 'log_value', value: 10 }
  ],
  '2025-11-29': [],
  '2025-11-30': [],
  '2025-12-01': [
    { habit: 'Meditation Challenge', action: 'unarchive' },
    { task: 'Plan Party', action: 'create' }
  ],
  '2025-12-02': [],
  '2025-12-03': [],
  '2025-12-04': [],
  '2025-12-05': [
    { habit: 'Daily Steps', action: 'log_value', value: 12000 },
    { habit: 'Morning Exercise', action: 'complete' },
    { habit: 'Drink 8 Glasses Water', action: 'partial', value: 3 },
    { habit: 'Weekly Gym Session', action: 'increment' },
    { habit: 'Weekly Gym Session', action: 'increment' },
    { habit: 'Weekly Running', action: 'log_value', value: 18 },
    { habit: 'Meditation Challenge', action: 'complete' },
    { task: 'Plan Party', action: 'complete' }
  ],
  '2025-12-06': [],
  '2025-12-07': [],
  '2025-12-08': [],
  '2025-12-09': [],
  '2025-12-10': [],
  '2025-12-11': [],
  '2025-12-12': [],
  '2025-12-13': [],
  '2025-12-14': [],
  '2025-12-15': []
};

// Serve the simulation HTML page
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Habit Tracker - Step Simulator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; font-size: 2.5rem; }
    .controls {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 30px;
    }
    button {
      padding: 15px 30px;
      font-size: 1.1rem;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }
    .btn-reset {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }
    .btn-advance {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .date-display {
      text-align: center;
      font-size: 3rem;
      font-weight: bold;
      margin: 30px 0;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
    }
    .date-display .day { color: #fbbf24; }
    .actions-log {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .actions-log h2 { margin-bottom: 15px; color: #60a5fa; }
    .action-item {
      padding: 10px 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .action-item.complete { border-left: 4px solid #22c55e; }
    .action-item.partial { border-left: 4px solid #f59e0b; }
    .action-item.archived { border-left: 4px solid #ef4444; }
    .habits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
    }
    .habit-card {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .habit-icon { font-size: 2rem; }
    .habit-info { flex: 1; }
    .habit-title { font-weight: 600; margin-bottom: 5px; }
    .habit-progress { font-size: 0.9rem; color: #94a3b8; }
    .habit-status {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .status-todo { background: #475569; }
    .status-in-progress { background: #f59e0b; color: #000; }
    .status-done { background: #22c55e; color: #000; }
    .status-archived { background: #ef4444; }
    .message {
      text-align: center;
      padding: 20px;
      margin: 20px 0;
      border-radius: 12px;
      font-size: 1.2rem;
    }
    .message.success { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; }
    .message.info { background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; }
    .frequency-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Habit Tracker Simulator</h1>
    
    <div class="controls">
      <button class="btn-reset" onclick="resetSimulation()">🔄 Reset Simulation</button>
      <button class="btn-advance" id="advanceBtn" onclick="advanceDay()" disabled>⏭️ Advance to Next Day</button>
    </div>
    
    <div class="date-display" id="dateDisplay">
      <div>Click "Reset Simulation" to start</div>
    </div>
    
    <div id="message"></div>
    
    <div class="actions-log" id="actionsLog" style="display: none;">
      <h2>📝 Actions Performed Today</h2>
      <div id="actionsList"></div>
    </div>
    
    <h2 style="margin-bottom: 15px;">📊 Current Habit States</h2>
    <div class="habits-grid" id="habitsGrid"></div>
  </div>

  <script>
    const API_BASE = '/api/simulation';
    
    async function resetSimulation() {
      try {
        const res = await fetch(API_BASE + '/reset', { method: 'POST' });
        const data = await res.json();
        
        // Set debug time to Nov 19 (day before simulation starts)
        const debugTimeData = {
          enabled: true,
          date: '2025-11-19',
          time: '12:00'
        };
        localStorage.setItem('debugMockTime', JSON.stringify(debugTimeData));
        window.__DEBUG_MOCK_TIME__ = '2025-11-19T12:00:00';
        
        document.getElementById('dateDisplay').innerHTML = 
          '<div>Ready to start from</div><div class="day">November 20, 2025</div>';
        document.getElementById('advanceBtn').disabled = false;
        document.getElementById('message').innerHTML = 
          '<div class="message success">✅ Database cleared. Debug time synced. Click "Advance" to begin!</div>';
        document.getElementById('actionsLog').style.display = 'none';
        
        // Show initial habits
        updateHabitsGrid([]);
        fetchCurrentState();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
    
    async function advanceDay() {
      try {
        const res = await fetch(API_BASE + '/advance', { method: 'POST' });
        const data = await res.json();
        
        if (data.error) {
          alert(data.error);
          return;
        }
        
        // Update date display
        const date = new Date(data.currentDate);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('dateDisplay').innerHTML = 
          '<div class="day">' + date.toLocaleDateString('en-US', options) + '</div>';
        
        // SYNC DEBUG TIME TO FRONTEND (localStorage)
        // This updates the mock time so the main app at localhost:3001 uses the same date
        const debugTimeData = {
          enabled: true,
          date: data.currentDate,
          time: '12:00'
        };
        localStorage.setItem('debugMockTime', JSON.stringify(debugTimeData));
        
        // Also set global variable for any same-origin requests
        window.__DEBUG_MOCK_TIME__ = data.currentDate + 'T12:00:00';
        
        // Show actions
        const actionsLog = document.getElementById('actionsLog');
        const actionsList = document.getElementById('actionsList');
        actionsLog.style.display = 'block';
        
        actionsList.innerHTML = data.actionsPerformed.map(action => {
          let className = 'action-item';
          if (action.includes('Completed') || action.includes('COMPLETE')) className += ' complete';
          else if (action.includes('Partial') || action.includes('Logged')) className += ' partial';
          else if (action.includes('ARCHIVED')) className += ' archived';
          return '<div class="' + className + '">' + action + '</div>';
        }).join('');
        
        // Update habits grid
        updateHabitsGrid(data.habitStates);
        
        // Check if complete
        if (data.isComplete) {
          document.getElementById('advanceBtn').disabled = true;
          document.getElementById('message').innerHTML = 
            '<div class="message success">🎉 Simulation Complete! You reached December 15, 2025.</div>';
        } else {
          document.getElementById('message').innerHTML = 
            '<div class="message info">💡 Debug time synced! Refresh the main app at <a href="http://localhost:3001" target="_blank" style="color:#60a5fa">localhost:3001</a> to see changes.</div>';
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
    
    function updateHabitsGrid(habits) {
      const grid = document.getElementById('habitsGrid');
      if (!habits || habits.length === 0) {
        grid.innerHTML = '<div style="color: #94a3b8; grid-column: 1/-1; text-align: center;">Habits will appear here after reset</div>';
        return;
      }
      
      grid.innerHTML = habits.map(h => {
        const statusClass = 'status-' + h.status.replace(' ', '-');
        const icon = h.title.includes('Steps') ? '👟' :
                     h.title.includes('Exercise') ? '🏃' :
                     h.title.includes('Water') ? '💧' :
                     h.title.includes('Gym') ? '🏋️' :
                     h.title.includes('Family') ? '📞' :
                     h.title.includes('Budget') ? '💰' :
                     h.title.includes('Running') ? '🏃‍♂️' :
                     h.title.includes('Meditation') ? '🧘' : '📌';
        return '<div class="habit-card">' +
          '<span class="habit-icon">' + icon + '</span>' +
          '<div class="habit-info">' +
            '<div class="habit-title">' + h.title + '<span class="frequency-badge">' + h.frequency + '</span></div>' +
            '<div class="habit-progress">Progress: ' + h.progress + '</div>' +
          '</div>' +
          '<span class="habit-status ' + statusClass + '">' + h.status + '</span>' +
        '</div>';
      }).join('');
    }
    
    async function fetchCurrentState() {
      try {
        const res = await fetch('/api/habits?includeArchived=true');
        const habits = await res.json();
        if (habits.length > 0) {
          const states = habits.map(h => ({
            title: h.title,
            status: h.isArchived ? 'archived' : h.status,
            progress: h.trackingType === 'value' 
              ? (h.currentValue || 0) + '/' + h.targetValue
              : (h.periodCompletions || 0) + '/' + (h.target || 1),
            frequency: h.frequency
          }));
          updateHabitsGrid(states);
        }
      } catch (err) {
        console.error(err);
      }
    }
  </script>
</body>
</html>
  `);
});

// Get simulation status
router.get('/status', (req, res) => {
  res.json({
    isRunning: simulationState.isRunning,
    currentDate: simulationState.currentDate,
    habits: Object.keys(simulationState.habits),
    tasks: Object.keys(simulationState.tasks)
  });
});

// Reset and initialize simulation
router.post('/reset', async (req, res) => {
  try {
    // Clear all data
    await Promise.all([
      Habit.deleteMany({}),
      Task.deleteMany({}),
      CompletionLog.deleteMany({})
    ]);
    
    const startDate = new Date('2025-11-20T00:00:00');
    
    // Create habits
    simulationState.habits = {};
    for (const config of HABITS_CONFIG) {
      const habit = new Habit({
        ...config,
        status: 'todo',
        periodStartDate: startDate,
        periodCompletions: 0,
        currentValue: 0
      });
      await habit.save();
      simulationState.habits[config.title] = habit._id;
    }
    
    // Create initial task
    simulationState.tasks = {};
    for (const config of TASKS_CONFIG) {
      const task = new Task({
        ...config,
        status: 'todo'
      });
      await task.save();
      simulationState.tasks[config.title] = task._id;
    }
    
    simulationState.currentDate = '2025-11-19'; // Day before start
    simulationState.isRunning = true;
    
    res.json({
      message: 'Simulation reset. Ready to start from Nov 20, 2025.',
      currentDate: simulationState.currentDate,
      habitsCreated: Object.keys(simulationState.habits),
      tasksCreated: Object.keys(simulationState.tasks)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advance one day
router.post('/advance', async (req, res) => {
  try {
    if (!simulationState.isRunning) {
      return res.status(400).json({ error: 'Simulation not started. Call /reset first.' });
    }
    
    // Calculate next date
    const currentDate = new Date(simulationState.currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = currentDate.toISOString().split('T')[0];
    
    if (nextDateStr > '2025-12-15') {
      return res.json({
        message: 'Simulation complete! Reached Dec 15, 2025.',
        currentDate: simulationState.currentDate,
        isComplete: true
      });
    }
    
    simulationState.currentDate = nextDateStr;
    const mockTime = new Date(nextDateStr + 'T12:00:00');
    
    const actions = SIMULATION_ACTIONS[nextDateStr] || [];
    const actionsPerformed = [];
    
    // FIRST: Process period resets for all recurring habits (simulating opening the app)
    const allHabitsForReset = await Habit.find({ type: 'recurring', isArchived: { $ne: true } });
    console.log(`\n[${nextDateStr}] Processing ${allHabitsForReset.length} habits for reset...`);
    
    for (const habit of allHabitsForReset) {
      const periodStart = new Date(habit.periodStartDate);
      let shouldReset = false;
      
      // Check if period should reset
      if (habit.frequency === 'daily') {
        const todayStart = new Date(mockTime.getFullYear(), mockTime.getMonth(), mockTime.getDate());
        const periodDayStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
        shouldReset = todayStart > periodDayStart;
        console.log(`  ${habit.title}: periodStart=${periodStart.toDateString()}, today=${todayStart.toDateString()}, shouldReset=${shouldReset}`);
      } else if (habit.frequency === 'weekly') {
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        shouldReset = (mockTime - periodStart) >= weekMs;
      } else if (habit.frequency === 'monthly') {
        shouldReset = mockTime.getMonth() !== periodStart.getMonth() || 
                      mockTime.getFullYear() !== periodStart.getFullYear();
      }
      
      if (shouldReset) {
        // Calculate final percentage
        let finalPercentage;
        if (habit.trackingType === 'value' && habit.targetValue) {
          finalPercentage = Math.min(100, Math.round(((habit.currentValue || 0) / habit.targetValue) * 100));
        } else if (habit.target) {
          finalPercentage = Math.min(100, Math.round(((habit.periodCompletions || 0) / habit.target) * 100));
        } else {
          finalPercentage = (habit.periodCompletions || 0) > 0 ? 100 : 0;
        }
        
        const completionStatus = finalPercentage >= 100 ? 'complete' : 
                                  finalPercentage > 0 ? 'partial' : 'missed';
        
        // Log period end - use 18:00 (not 23:59) to avoid UTC timezone date shift issues
        const periodEndDate = new Date(periodStart);
        if (habit.frequency === 'daily') {
          periodEndDate.setHours(18, 0, 0, 0);
        } else if (habit.frequency === 'weekly') {
          periodEndDate.setDate(periodStart.getDate() + 6);
          periodEndDate.setHours(18, 0, 0, 0);
        } else if (habit.frequency === 'monthly') {
          periodEndDate.setMonth(periodStart.getMonth() + 1);
          periodEndDate.setDate(0);
          periodEndDate.setHours(18, 0, 0, 0);
        }
        
        console.log(`    → LOGGING: ${habit.title} ${completionStatus} (${finalPercentage}%) for ${periodEndDate.toDateString()}`);
        
        await new CompletionLog({
          itemType: 'habit',
          itemId: habit._id,
          itemTitle: habit.title,
          completionType: 'period_end',
          completedAt: periodEndDate,
          finalPercentage,
          completionStatus,
          notes: `Period: ${periodStart.toLocaleDateString()} - ${periodEndDate.toLocaleDateString()}`
        }).save();
        
        // Reset habit for new period
        habit.periodCompletions = 0;
        habit.currentValue = 0;
        habit.periodStartDate = new Date(mockTime.getFullYear(), mockTime.getMonth(), mockTime.getDate());
        habit.status = 'todo';
        await habit.save();
        console.log(`    → RESET: periodStartDate now ${habit.periodStartDate.toDateString()}`);
        
        const statusIcon = completionStatus === 'complete' ? '✅' : 
                          completionStatus === 'partial' ? '🔶' : '❌';
        actionsPerformed.push(`${statusIcon} ${habit.title}: Period ended (${completionStatus} ${finalPercentage}%) - Reset to todo`);
      }
    }
    
    // Process each action for this day
    for (const action of actions) {
      if (action.habit) {
        const habitId = simulationState.habits[action.habit];
        if (!habitId) continue;
        
        const habit = await Habit.findById(habitId);
        if (!habit) continue;
        
        switch (action.action) {
          case 'complete':
            if (habit.trackingType === 'count') {
              habit.periodCompletions = habit.target || 1;
            } else {
              habit.currentValue = habit.targetValue || 1;
            }
            habit.status = 'done';
            await habit.save();
            
            await new CompletionLog({
              itemType: 'habit',
              itemId: habitId,
              itemTitle: habit.title,
              completionType: 'regular',
              completedAt: mockTime,
              completionStatus: 'complete',
              finalPercentage: 100
            }).save();
            
            actionsPerformed.push(`✅ ${action.habit}: Completed`);
            break;
            
          case 'partial':
            habit.periodCompletions = action.value;
            habit.status = 'in-progress';
            await habit.save();
            actionsPerformed.push(`🔶 ${action.habit}: Partial (${action.value}/${habit.target})`);
            break;
            
          case 'log_value':
            habit.currentValue = (habit.currentValue || 0) + action.value;
            const percentage = Math.round((habit.currentValue / habit.targetValue) * 100);
            habit.status = percentage >= 100 ? 'done' : 'in-progress';
            await habit.save();
            
            // Determine status for this log entry
            const valueLogStatus = percentage >= 100 ? 'complete' : 'partial';
            
            await new CompletionLog({
              itemType: 'habit',
              itemId: habitId,
              itemTitle: habit.title,
              completionType: 'value_log',
              completedAt: mockTime,
              valueLogged: action.value,
              finalPercentage: Math.min(100, percentage),
              completionStatus: valueLogStatus
            }).save();
            
            actionsPerformed.push(`📊 ${action.habit}: Logged ${action.value} (total: ${habit.currentValue}, ${percentage}%)`);
            break;
            
          case 'increment':
            habit.periodCompletions = (habit.periodCompletions || 0) + 1;
            const pct = Math.round((habit.periodCompletions / habit.target) * 100);
            habit.status = pct >= 100 ? 'done' : 'in-progress';
            await habit.save();
            actionsPerformed.push(`➕ ${action.habit}: Incremented to ${habit.periodCompletions}/${habit.target}`);
            break;
            
          case 'archive':
            habit.isArchived = true;
            habit.archivedAt = mockTime;
            await habit.save();
            actionsPerformed.push(`📦 ${action.habit}: ARCHIVED`);
            break;
            
          case 'unarchive':
            habit.isArchived = false;
            habit.archivedAt = null;
            habit.periodStartDate = mockTime;
            habit.periodCompletions = 0;
            habit.currentValue = 0;
            habit.status = 'todo';
            await habit.save();
            actionsPerformed.push(`📤 ${action.habit}: UNARCHIVED (period reset to today)`);
            break;
        }
      }
      
      if (action.task) {
        if (action.action === 'create') {
          const task = new Task({
            title: action.task,
            status: 'todo',
            priority: 'medium',
            icon: '🎉',
            color: '#f59e0b'
          });
          await task.save();
          simulationState.tasks[action.task] = task._id;
          actionsPerformed.push(`📝 Task "${action.task}": Created`);
        } else {
          const taskId = simulationState.tasks[action.task];
          if (taskId) {
            const task = await Task.findById(taskId);
            if (task) {
              switch (action.action) {
                case 'start':
                  task.status = 'in-progress';
                  await task.save();
                  actionsPerformed.push(`▶️ Task "${action.task}": Started`);
                  break;
                case 'complete':
                  task.status = 'done';
                  task.completedAt = mockTime;
                  await task.save();
                  
                  await new CompletionLog({
                    itemType: 'task',
                    itemId: taskId,
                    itemTitle: task.title,
                    completionType: 'regular',
                    completedAt: mockTime,
                    completionStatus: 'complete'
                  }).save();
                  
                  actionsPerformed.push(`✅ Task "${action.task}": Completed`);
                  break;
              }
            }
          }
        }
      }
    }
    
    // Get current state of all habits
    const allHabits = await Habit.find({}).sort('title');
    const habitStates = allHabits.map(h => ({
      title: h.title,
      status: h.isArchived ? 'archived' : h.status,
      progress: h.trackingType === 'value' 
        ? `${h.currentValue || 0}/${h.targetValue}`
        : `${h.periodCompletions || 0}/${h.target || 1}`,
      frequency: h.frequency
    }));
    
    res.json({
      previousDate: new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0],
      currentDate: nextDateStr,
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(nextDateStr).getDay()],
      actionsPerformed: actionsPerformed.length > 0 ? actionsPerformed : ['No user actions - just day passing'],
      habitStates,
      isComplete: nextDateStr === '2025-12-15'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
