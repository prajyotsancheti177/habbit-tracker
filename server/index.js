import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import habitsRouter from './routes/habits.js';
import tasksRouter from './routes/tasks.js';
import analyticsRouter from './routes/analytics.js';
import rewardsRouter from './routes/rewards.js';
import uploadRouter from './routes/upload.js';
import tagsRouter from './routes/tags.js';
import chartsRouter from './routes/charts.js';
import historyRouter from './routes/history.js';
import simulationRouter from './routes/simulation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/habits', habitsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/charts', chartsRouter);
app.use('/api/history', historyRouter);
app.use('/api/simulation', simulationRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
