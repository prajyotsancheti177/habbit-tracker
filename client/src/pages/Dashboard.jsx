import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
import { analyticsApi } from '../api';
import './Dashboard.css';

function Dashboard() {
    const { habits, tasks, coins, fetchHabits, fetchTasks, fetchSummary, summary } = useApp();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchHabits(),
                    fetchTasks(),
                    fetchSummary()
                ]);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchHabits, fetchTasks, fetchSummary]);

    const todayHabits = habits.filter(h => h.status !== 'done').slice(0, 5);
    const todayTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);

    const habitsProgress = summary?.habits?.total > 0
        ? Math.round((summary.habits.completed / summary.habits.total) * 100)
        : 0;
    const tasksProgress = summary?.tasks?.total > 0
        ? Math.round((summary.tasks.completed / summary.tasks.total) * 100)
        : 0;

    if (loading) {
        return (
            <div className="page-container">
                <div className="dashboard-skeleton">
                    <div className="skeleton" style={{ height: '100px', marginBottom: '24px' }} />
                    <div className="skeleton" style={{ height: '200px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">
                    Welcome back<span className="text-gradient">!</span>
                </h1>
                <p className="page-subtitle">
                    Here's your progress overview
                </p>
            </header>

            {/* Stats Cards */}
            <div className="dashboard-stats">
                <GlassCard className="stat-card" glow glowColor="blue">
                    <div className="stat-card__content">
                        <div className="stat-card__info">
                            <span className="stat-card__label">Total Habits</span>
                            <span className="stat-card__value">{summary?.habits?.total || 0}</span>
                            <span className="stat-card__detail">
                                {summary?.habits?.completed || 0} completed
                            </span>
                        </div>
                        <ProgressRing
                            progress={habitsProgress}
                            size={80}
                            strokeWidth={6}
                            color="var(--color-accent-blue)"
                        />
                    </div>
                </GlassCard>

                <GlassCard className="stat-card" glow glowColor="purple">
                    <div className="stat-card__content">
                        <div className="stat-card__info">
                            <span className="stat-card__label">Total Tasks</span>
                            <span className="stat-card__value">{summary?.tasks?.total || 0}</span>
                            <span className="stat-card__detail">
                                {summary?.tasks?.completed || 0} completed
                            </span>
                        </div>
                        <ProgressRing
                            progress={tasksProgress}
                            size={80}
                            strokeWidth={6}
                            color="var(--color-accent-purple)"
                        />
                    </div>
                </GlassCard>

                <GlassCard className="stat-card" glow glowColor="green">
                    <div className="stat-card__content">
                        <div className="stat-card__info">
                            <span className="stat-card__label">Today's Completions</span>
                            <span className="stat-card__value">{summary?.todayCompletions || 0}</span>
                            <span className="stat-card__detail">items done</span>
                        </div>
                        <div className="stat-card__icon">✅</div>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card stat-card--coins" glow glowColor="orange">
                    <div className="stat-card__content">
                        <div className="stat-card__info">
                            <span className="stat-card__label">Total Coins</span>
                            <span className="stat-card__value stat-card__value--coins">
                                🪙 {coins.toLocaleString()}
                            </span>
                            <span className="stat-card__detail">
                                {summary?.totalCoinsEarned?.toLocaleString() || 0} total earned
                            </span>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Streaks */}
            {summary?.longestStreak > 0 && (
                <GlassCard className="streak-card">
                    <div className="streak-card__content">
                        <span className="streak-card__icon">🔥</span>
                        <div className="streak-card__info">
                            <span className="streak-card__label">Longest Streak</span>
                            <span className="streak-card__value">{summary.longestStreak} days</span>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Active Items */}
            <div className="dashboard-sections">
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">🎯 Active Habits</h2>
                        <Link to="/habits" className="section-link">View All →</Link>
                    </div>
                    {todayHabits.length > 0 ? (
                        <div className="items-list">
                            {todayHabits.map(habit => (
                                <GlassCard key={habit._id} className="quick-item" hover>
                                    <span className="quick-item__icon">{habit.icon || '🎯'}</span>
                                    <div className="quick-item__info">
                                        <span className="quick-item__title">{habit.title}</span>
                                        <span className="quick-item__meta">
                                            {habit.completions}/{habit.target} • {habit.type}
                                        </span>
                                    </div>
                                    <ProgressRing
                                        progress={(habit.completions / habit.target) * 100}
                                        size={40}
                                        strokeWidth={4}
                                        color={habit.color}
                                        showLabel={false}
                                    />
                                </GlassCard>
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="empty-card">
                            <p>No active habits. <Link to="/habits">Create one!</Link></p>
                        </GlassCard>
                    )}
                </section>

                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">📋 Active Tasks</h2>
                        <Link to="/tasks" className="section-link">View All →</Link>
                    </div>
                    {todayTasks.length > 0 ? (
                        <div className="items-list">
                            {todayTasks.map(task => (
                                <GlassCard key={task._id} className="quick-item" hover>
                                    <span className="quick-item__icon">{task.icon || '📋'}</span>
                                    <div className="quick-item__info">
                                        <span className="quick-item__title">{task.title}</span>
                                        <span className="quick-item__meta">
                                            {task.progress}% • {task.priority}
                                        </span>
                                    </div>
                                    <ProgressRing
                                        progress={task.progress}
                                        size={40}
                                        strokeWidth={4}
                                        color={task.color}
                                        showLabel={false}
                                    />
                                </GlassCard>
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="empty-card">
                            <p>No active tasks. <Link to="/tasks">Create one!</Link></p>
                        </GlassCard>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
