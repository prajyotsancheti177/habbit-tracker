/**
 * RingCalendar Component
 * 
 * Apple Health-style monthly calendar with daily progress rings.
 * Each day shows a circular ring indicating completion percentage.
 */

import { useMemo, useState, useEffect } from 'react';
import ProgressRing from '../ui/ProgressRing';
import './RingCalendar.css';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function RingCalendar({
    data = [],
    color = '#3b82f6',
    ringSize = 'medium',
    title = '',
    onMonthChange = null // Callback when month changes
}) {
    // Current displayed month (defaults to current month)
    const [viewDate, setViewDate] = useState(() => new Date());

    // Notify parent when month changes
    useEffect(() => {
        if (onMonthChange) {
            onMonthChange(viewDate.getFullYear(), viewDate.getMonth());
        }
    }, [viewDate, onMonthChange]);

    // Navigate to previous month
    const goToPrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    // Navigate to next month
    const goToNextMonth = () => {
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        // Don't go beyond current month
        if (next <= new Date()) {
            setViewDate(next);
        }
    };

    // Go to current month
    const goToToday = () => {
        setViewDate(new Date());
    };

    // Check if we're viewing current month
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return viewDate.getMonth() === now.getMonth() &&
            viewDate.getFullYear() === now.getFullYear();
    }, [viewDate]);

    // Build calendar grid for the view month
    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const monthName = viewDate.toLocaleString('default', { month: 'long' });

        // Create data lookup map
        const dataMap = {};
        data.forEach(day => {
            dataMap[day.date] = day;
        });

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // Build weeks array
        const weeks = [];
        let currentWeek = Array(7).fill(null);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();

            // Start new week on Sunday (except first week)
            if (dayOfWeek === 0 && day > 1) {
                weeks.push(currentWeek);
                currentWeek = Array(7).fill(null);
            }

            currentWeek[dayOfWeek] = {
                day,
                date: dateKey,
                dayOfWeek,
                ...(dataMap[dateKey] || { count: 0, progress: 0 })
            };
        }

        // Push last week
        if (currentWeek.some(d => d !== null)) {
            weeks.push(currentWeek);
        }

        return { weeks, month: monthName, year };
    }, [viewDate, data]);

    const sizeMap = {
        small: { ring: 36, stroke: 4 },
        medium: { ring: 44, stroke: 5 },
        large: { ring: 56, stroke: 6 }
    };

    const sizes = sizeMap[ringSize] || sizeMap.medium;

    return (
        <div className="ring-calendar">
            {title && <h4 className="ring-calendar__title">{title}</h4>}

            <div className="ring-calendar__header">
                <button
                    className="ring-calendar__nav-btn"
                    onClick={goToPrevMonth}
                    title="Previous month"
                >
                    ◀
                </button>

                <span className="ring-calendar__month">
                    {calendarData.month} {calendarData.year}
                </span>

                <button
                    className="ring-calendar__nav-btn"
                    onClick={goToNextMonth}
                    disabled={isCurrentMonth}
                    title="Next month"
                >
                    ▶
                </button>

                {!isCurrentMonth && (
                    <button
                        className="ring-calendar__today-btn"
                        onClick={goToToday}
                        title="Go to today"
                    >
                        Today
                    </button>
                )}
            </div>

            <div className="ring-calendar__days">
                {DAYS_OF_WEEK.map((day, i) => (
                    <div key={i} className="ring-calendar__day-label">
                        {day}
                    </div>
                ))}
            </div>

            <div className="ring-calendar__grid">
                {calendarData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="ring-calendar__week">
                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`ring-calendar__cell ${day ? '' : 'ring-calendar__cell--empty'}`}
                            >
                                {day && (
                                    <div className="ring-calendar__ring-wrapper" title={`${day.date}: ${day.count} completions`}>
                                        <ProgressRing
                                            progress={day.progress || 0}
                                            size={sizes.ring}
                                            strokeWidth={sizes.stroke}
                                            color={color}
                                            showLabel={false}
                                        />
                                        <span className="ring-calendar__day-number">{day.day}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="ring-calendar__legend">
                <div className="ring-calendar__legend-item">
                    <div className="ring-calendar__legend-ring ring-calendar__legend-ring--empty"></div>
                    <span>0%</span>
                </div>
                <div className="ring-calendar__legend-item">
                    <div className="ring-calendar__legend-ring ring-calendar__legend-ring--partial" style={{ borderColor: color }}></div>
                    <span>50%</span>
                </div>
                <div className="ring-calendar__legend-item">
                    <div className="ring-calendar__legend-ring ring-calendar__legend-ring--full" style={{ backgroundColor: color }}></div>
                    <span>100%</span>
                </div>
            </div>
        </div>
    );
}

export default RingCalendar;
