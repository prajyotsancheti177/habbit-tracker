/**
 * History Page
 * 
 * Calendar view showing completion history for habits and tasks.
 * Includes filtering by specific habit/task or all items.
 * Toggle between calendar and detailed list view.
 */

import { useEffect, useState, useMemo } from 'react';
import { historyApi, habitsApi } from '../api';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import './HistoryPage.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function HistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [filters, setFilters] = useState({ habits: [], tasks: [] });
    const [selectedFilter, setSelectedFilter] = useState({ type: 'all', itemId: null });
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDetails, setDayDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Fetch history data
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const params = {
                    year,
                    month,
                    itemType: selectedFilter.type === 'all' ? 'all' :
                        selectedFilter.type === 'habits' ? 'habit' : 'task'
                };
                if (selectedFilter.itemId) {
                    params.itemId = selectedFilter.itemId;
                }

                const response = await historyApi.getAll(params);
                setHistory(response.data.history || []);
                setFilters(response.data.filters || { habits: [], tasks: [] });
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [year, month, selectedFilter]);

    // Build calendar data
    const calendarData = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // Create history lookup
        const historyMap = {};
        history.forEach(h => {
            historyMap[h.date] = h;
        });

        // Build weeks
        const weeks = [];
        let currentWeek = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            currentWeek.push(null);
        }

        // Add days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(Date.UTC(year, month, day));
            const dateKey = date.toISOString().split('T')[0];
            const dayData = historyMap[dateKey];

            currentWeek.push({
                day,
                date: dateKey,
                items: dayData?.items || [],
                totalCount: dayData?.totalCount || 0,
                totalCoins: dayData?.totalCoins || 0,
                isToday: dateKey === new Date().toISOString().split('T')[0]
            });

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill remaining cells in last week
        while (currentWeek.length > 0 && currentWeek.length < 7) {
            currentWeek.push(null);
        }
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    }, [year, month, history]);

    // Sort history for list view (most recent first)
    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [history]);

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Handle day click
    const handleDayClick = async (dayData) => {
        if (!dayData || dayData.totalCount === 0) return;

        setSelectedDay(dayData);
        setShowDetailsModal(true);

        try {
            const response = await historyApi.getByDate(dayData.date);
            setDayDetails(response.data);
        } catch (error) {
            console.error('Failed to fetch day details:', error);
        }
    };

    // Get intensity class based on completion count
    const getIntensityClass = (count) => {
        if (count === 0) return '';
        if (count <= 2) return 'history-day--low';
        if (count <= 5) return 'history-day--medium';
        return 'history-day--high';
    };

    // Format date for list view
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="history-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>📅 History</h1>
                    <p className="subtitle">View your completion history</p>
                </div>
            </div>

            {/* Filters and View Toggle */}
            <GlassCard className="history-filters">
                <div className="filter-group">
                    <label>Filter by:</label>
                    <select
                        value={selectedFilter.type}
                        onChange={(e) => setSelectedFilter({ type: e.target.value, itemId: null })}
                        className="filter-select"
                    >
                        <option value="all">All Items</option>
                        <option value="habits">All Habits</option>
                        <option value="tasks">All Tasks</option>
                    </select>
                </div>

                {selectedFilter.type !== 'all' && (
                    <div className="filter-group">
                        <label>Specific {selectedFilter.type === 'habits' ? 'Habit' : 'Task'}:</label>
                        <select
                            value={selectedFilter.itemId || ''}
                            onChange={(e) => setSelectedFilter(prev => ({ ...prev, itemId: e.target.value || null }))}
                            className="filter-select"
                        >
                            <option value="">All {selectedFilter.type}</option>
                            {(selectedFilter.type === 'habits' ? filters.habits : filters.tasks).map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.icon} {item.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* View Toggle */}
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'calendar' ? 'toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('calendar')}
                        title="Calendar View"
                    >
                        📅 Calendar
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'list' ? 'toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        📋 List
                    </button>
                </div>
            </GlassCard>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <GlassCard className="history-calendar">
                    <div className="calendar-header">
                        <button className="nav-btn" onClick={goToPrevMonth}>◀</button>
                        <h2>{MONTHS[month]} {year}</h2>
                        <button className="nav-btn" onClick={goToNextMonth}>▶</button>
                        <button className="today-btn" onClick={goToToday}>Today</button>
                    </div>

                    <div className="calendar-days-header">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="day-header">{day}</div>
                        ))}
                    </div>

                    <div className="calendar-grid">
                        {calendarData.map((week, weekIdx) => (
                            <div key={weekIdx} className="calendar-week">
                                {week.map((day, dayIdx) => (
                                    <div
                                        key={dayIdx}
                                        className={`calendar-day ${day ? '' : 'calendar-day--empty'} ${day?.isToday ? 'calendar-day--today' : ''} ${day ? getIntensityClass(day.totalCount) : ''}`}
                                        onClick={() => day && handleDayClick(day)}
                                    >
                                        {day && (
                                            <>
                                                <span className="day-number">{day.day}</span>
                                                {day.totalCount > 0 && (
                                                    <div className="day-indicators">
                                                        <span className="completion-count">{day.totalCount}</span>
                                                        {day.totalCoins > 0 && (
                                                            <span className="coins-indicator">🪙 {day.totalCoins}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-box"></div>
                            <span>0</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box history-day--low"></div>
                            <span>1-2</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box history-day--medium"></div>
                            <span>3-5</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box history-day--high"></div>
                            <span>6+</span>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="history-list-view">
                    <div className="list-header">
                        <button className="nav-btn" onClick={goToPrevMonth}>◀</button>
                        <h2>{MONTHS[month]} {year}</h2>
                        <button className="nav-btn" onClick={goToNextMonth}>▶</button>
                        <button className="today-btn" onClick={goToToday}>Today</button>
                    </div>

                    {loading ? (
                        <GlassCard className="loading-card">Loading...</GlassCard>
                    ) : sortedHistory.length === 0 ? (
                        <GlassCard className="empty-card">
                            <p>No completions this month</p>
                        </GlassCard>
                    ) : (
                        <div className="day-cards">
                            {sortedHistory.map(dayData => (
                                <GlassCard key={dayData.date} className="day-card">
                                    <div className="day-card-header">
                                        <div className="day-card-date">
                                            <span className="date-day">{new Date(dayData.date + 'T00:00:00').getDate()}</span>
                                            <div className="date-info">
                                                <span className="date-weekday">
                                                    {new Date(dayData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                                                </span>
                                                <span className="date-month">
                                                    {new Date(dayData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="day-card-stats">
                                            <span className="stat-badge">{dayData.totalCount} items</span>
                                            {dayData.totalCoins > 0 && (
                                                <span className="coins-badge">🪙 {dayData.totalCoins}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="day-card-items">
                                        {dayData.items.map((item, idx) => (
                                            <div key={idx} className={`list-item ${item.completionStatus ? `list-item--${item.completionStatus}` : ''}`}>
                                                <div className="list-item-info">
                                                    <span className={`type-badge type-badge--${item.itemType}`}>
                                                        {item.itemType}
                                                    </span>
                                                    {item.completionStatus && (
                                                        <span className={`status-badge status-badge--${item.completionStatus}`}>
                                                            {item.completionStatus === 'complete' && '✓ Complete'}
                                                            {item.completionStatus === 'partial' && `◐ Partial (${item.finalPercentage}%)`}
                                                            {item.completionStatus === 'missed' && '✗ Missed'}
                                                        </span>
                                                    )}
                                                    <span className="item-title">{item.itemTitle}</span>
                                                </div>
                                                <div className="list-item-meta">
                                                    {item.valueLogged && (
                                                        <span className="value-badge">+{item.valueLogged}</span>
                                                    )}
                                                    {item.coinsEarned > 0 && (
                                                        <span className="coins-small">🪙 {item.coinsEarned}</span>
                                                    )}
                                                    <span className="item-time">
                                                        {new Date(item.completedAt).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Day Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setDayDetails(null);
                }}
                title={selectedDay ? `📅 ${new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : 'Details'}
            >
                {dayDetails ? (
                    <div className="day-details">
                        <div className="day-summary">
                            <div className="summary-stat">
                                <span className="stat-value">{dayDetails.totalCount}</span>
                                <span className="stat-label">Completions</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-value">🪙 {dayDetails.totalCoins}</span>
                                <span className="stat-label">Coins Earned</span>
                            </div>
                        </div>

                        <div className="completions-list">
                            {dayDetails.completions.map((c, idx) => (
                                <div key={idx} className={`completion-item ${c.completionStatus ? `completion-item--${c.completionStatus}` : ''}`}>
                                    <div className="completion-info">
                                        <span className="completion-type-badge">{c.itemType}</span>
                                        {c.completionStatus && (
                                            <span className={`status-badge status-badge--${c.completionStatus}`}>
                                                {c.completionStatus === 'complete' && '✓'}
                                                {c.completionStatus === 'partial' && `◐ ${c.finalPercentage}%`}
                                                {c.completionStatus === 'missed' && '✗'}
                                            </span>
                                        )}
                                        <span className="completion-title">{c.itemTitle}</span>
                                    </div>
                                    <div className="completion-meta">
                                        {c.valueLogged && (
                                            <span className="value-badge">+{c.valueLogged}</span>
                                        )}
                                        {c.coinsEarned > 0 && (
                                            <span className="coins-badge">🪙 {c.coinsEarned}</span>
                                        )}
                                        <span className="time">
                                            {new Date(c.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="loading-details">Loading...</div>
                )}
            </Modal>
        </div>
    );
}

export default HistoryPage;
