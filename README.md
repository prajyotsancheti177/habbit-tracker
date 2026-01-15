# 🎯 Habit & Task Tracker

A modern MERN stack application for tracking habits and tasks with a beautiful glassmorphism UI, Kanban-style drag-and-drop boards, comprehensive analytics, and a rewards system.

## ✨ Features

- **Kanban Boards**: Drag and drop habits/tasks between To Do, In Progress, and Done columns
- **Customizable Items**: Every habit and task can have custom icons, colors, effort levels, and coin rewards
- **Progress Tracking**: Apple Health-style ring indicators for progress visualization
- **Analytics Dashboard**: Multiple charts showing trends, completions, and insights
- **Coin Rewards**: Earn coins for completing habits and tasks
- **Modern UI**: Dark theme with glassmorphism, gradients, and micro-animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string

4. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)

2. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on http://localhost:5000

3. **Start the frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```
   The app will open at http://localhost:3000

## 📁 Project Structure

```
Habit Tracker/
├── server/                 # Backend (Express + MongoDB)
│   ├── index.js           # Server entry point
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── Habit.js
│   │   ├── Task.js
│   │   └── CompletionLog.js
│   └── routes/            # API routes
│       ├── habits.js
│       ├── tasks.js
│       ├── analytics.js
│       ├── rewards.js
│       └── upload.js
│
└── client/                 # Frontend (React + Vite)
    └── src/
        ├── api/           # API client
        ├── components/    # Reusable components
        │   ├── ui/        # GlassCard, Modal, ProgressRing
        │   ├── board/     # KanbanBoard, ItemCard
        │   └── modals/    # HabitModal, TaskModal
        ├── context/       # React Context (state)
        └── pages/         # Route pages
```

## 🎨 Customization

### Habit Fields
- Title, Description
- Type (Recurring / One-time)
- Target completions
- Frequency (Daily / Weekly / Monthly)
- Effort level (1-5)
- Time required & taken
- Notes, Images
- Icon & Color
- Coin reward

### Task Fields
- Title, Description
- Type (Short-term / Long-term)
- Priority (Low / Medium / High / Urgent)
- Due date
- Progress percentage
- Subtasks
- Effort, Notes, Images
- Icon & Color
- Coin reward

## 📊 Analytics

- Completions over time (area chart)
- Coins earned (bar chart)
- Habits by type (pie chart)
- Tasks by priority (pie chart)
- Top habits
- Current streaks
- Task progress rings

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router, Recharts, @hello-pangea/dnd
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Styling**: Custom CSS with CSS variables, Glassmorphism

## 📄 License

MIT
