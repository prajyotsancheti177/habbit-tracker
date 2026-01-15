import { useEffect, useState } from 'react';
import { analyticsApi, chartsApi, habitsApi } from '../api';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
import RingCalendar from '../components/charts/RingCalendar';
import ChartBuilderModal from '../components/modals/ChartBuilderModal';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, Legend
} from 'recharts';
import './AnalyticsPage.css';

const periodOptions = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function AnalyticsPage() {
    const [period, setPeriod] = useState('monthly');
    const [summary, setSummary] = useState(null);
    const [habitData, setHabitData] = useState(null);
    const [taskData, setTaskData] = useState(null);
    const [coinData, setCoinData] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom charts state
    const [customCharts, setCustomCharts] = useState([]);
    const [chartDataMap, setChartDataMap] = useState({});
    const [habits, setHabits] = useState([]);
    const [showChartBuilder, setShowChartBuilder] = useState(false);
    const [editingChart, setEditingChart] = useState(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                const [summaryRes, habitsRes, tasksRes, coinsRes, heatmapRes] = await Promise.all([
                    analyticsApi.getSummary(),
                    analyticsApi.getHabits(period),
                    analyticsApi.getTasks(period),
                    analyticsApi.getCoins(period),
                    analyticsApi.getHeatmap(new Date().getFullYear())
                ]);

                setSummary(summaryRes.data);
                setHabitData(habitsRes.data);
                setTaskData(tasksRes.data);
                setCoinData(coinsRes.data);
                setHeatmapData(heatmapRes.data);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [period]);

    // Load custom charts
    useEffect(() => {
        const loadCustomCharts = async () => {
            try {
                const [chartsRes, habitsRes] = await Promise.all([
                    chartsApi.getAll(),
                    habitsApi.getAll()
                ]);
                setCustomCharts(chartsRes.data);
                setHabits(habitsRes.data);

                // Load data for each chart
                const dataPromises = chartsRes.data.map(chart =>
                    chartsApi.getData(chart._id).then(res => ({ id: chart._id, data: res.data }))
                );
                const chartData = await Promise.all(dataPromises);
                const dataMap = {};
                chartData.forEach(({ id, data }) => { dataMap[id] = data; });
                setChartDataMap(dataMap);
            } catch (error) {
                console.error('Failed to load custom charts:', error);
            }
        };
        loadCustomCharts();
    }, []);

    const handleSaveChart = async (formData) => {
        try {
            if (editingChart) {
                await chartsApi.update(editingChart._id, formData);
            } else {
                const res = await chartsApi.create(formData);
                setCustomCharts(prev => [...prev, res.data]);
                // Load data for new chart
                const dataRes = await chartsApi.getData(res.data._id);
                setChartDataMap(prev => ({ ...prev, [res.data._id]: dataRes.data }));
            }
            setShowChartBuilder(false);
            setEditingChart(null);
        } catch (error) {
            console.error('Failed to save chart:', error);
        }
    };

    const handleDeleteChart = async (chartId) => {
        try {
            await chartsApi.delete(chartId);
            setCustomCharts(prev => prev.filter(c => c._id !== chartId));
        } catch (error) {
            console.error('Failed to delete chart:', error);
        }
    };

    const customTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton" style={{ height: '60px', marginBottom: '24px' }} />
                <div className="analytics-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '300px' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-header__main">
                    <div>
                        <h1 className="page-title">
                            📊 <span className="text-gradient">Analytics</span>
                        </h1>
                        <p className="page-subtitle">
                            Track your progress and trends
                        </p>
                    </div>

                    <div className="period-selector">
                        {periodOptions.map(opt => (
                            <button
                                key={opt.value}
                                className={`period-btn ${period === opt.value ? 'period-btn--active' : ''}`}
                                onClick={() => setPeriod(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn btn-primary add-chart-btn"
                        onClick={() => setShowChartBuilder(true)}
                    >
                        ➕ Add Chart
                    </button>
                </div>
            </header>

            {/* Overview Stats */}
            <div className="stats-row">
                <GlassCard className="stat-ring-card">
                    <h3>Habits Progress</h3>
                    <div className="ring-container">
                        <ProgressRing
                            progress={summary?.habits?.total > 0
                                ? (summary.habits.completed / summary.habits.total) * 100
                                : 0}
                            size={120}
                            strokeWidth={10}
                            color="var(--color-accent-blue)"
                            label="Complete"
                        />
                    </div>
                    <div className="stat-details">
                        <span>{summary?.habits?.completed || 0} / {summary?.habits?.total || 0}</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-ring-card">
                    <h3>Tasks Progress</h3>
                    <div className="ring-container">
                        <ProgressRing
                            progress={summary?.tasks?.total > 0
                                ? (summary.tasks.completed / summary.tasks.total) * 100
                                : 0}
                            size={120}
                            strokeWidth={10}
                            color="var(--color-accent-purple)"
                            label="Complete"
                        />
                    </div>
                    <div className="stat-details">
                        <span>{summary?.tasks?.completed || 0} / {summary?.tasks?.total || 0}</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-ring-card stat-ring-card--coins">
                    <h3>Coins Earned</h3>
                    <div className="coins-display">
                        <span className="coins-icon">🪙</span>
                        <span className="coins-value">{summary?.totalCoinsEarned?.toLocaleString() || 0}</span>
                    </div>
                    <div className="stat-details">
                        <span>Current Balance: {summary?.coins?.toLocaleString() || 0}</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-ring-card">
                    <h3>Longest Streak</h3>
                    <div className="streak-display">
                        <span className="streak-icon">🔥</span>
                        <span className="streak-value">{summary?.longestStreak || 0}</span>
                    </div>
                    <div className="stat-details">
                        <span>days in a row</span>
                    </div>
                </GlassCard>
            </div>

            {/* Charts Grid */}
            <div className="analytics-grid">
                {/* Completions Over Time */}
                <GlassCard className="chart-card chart-card--wide">
                    <h3>Completions Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={habitData?.completions || []}>
                            <defs>
                                <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="_id" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip content={customTooltip} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorCompletions)"
                                name="Completions"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Coins Earned Chart */}
                <GlassCard className="chart-card chart-card--wide">
                    <h3>Coins Earned Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={coinData?.earnings || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip content={customTooltip} />
                            <Legend />
                            <Bar dataKey="habit" fill="#3b82f6" name="Habits" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="task" fill="#8b5cf6" name="Tasks" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Habits by Type */}
                <GlassCard className="chart-card">
                    <h3>Habits by Type</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={habitData?.byType || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="_id"
                            >
                                {(habitData?.byType || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={customTooltip} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Tasks by Priority */}
                <GlassCard className="chart-card">
                    <h3>Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={taskData?.byPriority || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="_id"
                            >
                                {(taskData?.byPriority || []).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry._id === 'urgent' ? '#ef4444' :
                                                entry._id === 'high' ? '#f59e0b' :
                                                    entry._id === 'medium' ? '#3b82f6' :
                                                        '#10b981'
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={customTooltip} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Top Habits */}
                <GlassCard className="chart-card">
                    <h3>Top Habits</h3>
                    <div className="top-list">
                        {(habitData?.topHabits || []).map((habit, index) => (
                            <div key={habit._id} className="top-item">
                                <span className="top-rank">{index + 1}</span>
                                <span className="top-icon">{habit.icon}</span>
                                <span className="top-title">{habit.title}</span>
                                <span className="top-value">{habit.completions}x</span>
                            </div>
                        ))}
                        {(!habitData?.topHabits || habitData.topHabits.length === 0) && (
                            <p className="empty-text">No habits yet</p>
                        )}
                    </div>
                </GlassCard>

                {/* Current Streaks */}
                <GlassCard className="chart-card">
                    <h3>Current Streaks 🔥</h3>
                    <div className="top-list">
                        {(habitData?.streaks || []).map((habit, index) => (
                            <div key={habit._id} className="top-item">
                                <span className="top-rank">{index + 1}</span>
                                <span className="top-icon">{habit.icon}</span>
                                <span className="top-title">{habit.title}</span>
                                <span className="top-value streak-value">{habit.currentStreak} days</span>
                            </div>
                        ))}
                        {(!habitData?.streaks || habitData.streaks.length === 0) && (
                            <p className="empty-text">No active streaks</p>
                        )}
                    </div>
                </GlassCard>

                {/* In-Progress Tasks with Progress Rings */}
                <GlassCard className="chart-card chart-card--wide">
                    <h3>Task Progress</h3>
                    <div className="progress-rings-grid">
                        {(taskData?.inProgressTasks || []).slice(0, 6).map(task => (
                            <div key={task._id} className="task-ring-item">
                                <ProgressRing
                                    progress={task.progress}
                                    size={80}
                                    strokeWidth={6}
                                    color={task.color || 'var(--color-accent-purple)'}
                                />
                                <span className="task-ring-title">{task.title}</span>
                            </div>
                        ))}
                        {(!taskData?.inProgressTasks || taskData.inProgressTasks.length === 0) && (
                            <p className="empty-text">No tasks in progress</p>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Custom Charts Section */}
            {customCharts.length > 0 && (
                <div className="custom-charts-section">
                    <h2 className="section-title">📅 My Charts</h2>
                    <div className="custom-charts-grid">
                        {customCharts.map(chart => (
                            <GlassCard key={chart._id} className={`chart-card chart-card--${chart.size}`}>
                                <div className="chart-header">
                                    <h3>{chart.name}</h3>
                                    <button
                                        className="chart-delete-btn"
                                        onClick={() => handleDeleteChart(chart._id)}
                                        title="Delete chart"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {chart.type === 'ring-calendar' && chartDataMap[chart._id] && (
                                    <RingCalendar
                                        data={chartDataMap[chart._id].data || []}
                                        color={chart.style?.color || '#3b82f6'}
                                        ringSize={chart.style?.ringSize || 'medium'}
                                    />
                                )}

                                {chart.type === 'bar' && chartDataMap[chart._id] && (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={chartDataMap[chart._id].data || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                            <Tooltip content={customTooltip} />
                                            <Bar dataKey="count" fill={chart.style?.color || '#3b82f6'} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}

                                {chart.type === 'line' && chartDataMap[chart._id] && (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={chartDataMap[chart._id].data || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                            <Tooltip content={customTooltip} />
                                            <Line type="monotone" dataKey="count" stroke={chart.style?.color || '#3b82f6'} strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Chart Builder Modal */}
            <ChartBuilderModal
                isOpen={showChartBuilder}
                onClose={() => { setShowChartBuilder(false); setEditingChart(null); }}
                chart={editingChart}
                onSave={handleSaveChart}
                habits={habits}
            />
        </div>
    );
}

export default AnalyticsPage;
