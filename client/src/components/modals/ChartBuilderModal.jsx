/**
 * ChartBuilderModal
 * 
 * Modal for creating and editing custom charts.
 * Allows selecting activity, chart type, and style options.
 */

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import './ChartBuilderModal.css';

const chartTypes = [
    { value: 'ring-calendar', label: 'Ring Calendar', icon: '📅', description: 'Apple Health style daily rings' },
    { value: 'line', label: 'Line Chart', icon: '📈', description: 'Trend over time' },
    { value: 'bar', label: 'Bar Chart', icon: '📊', description: 'Compare values' },
    { value: 'heatmap', label: 'Heatmap', icon: '🔥', description: 'Color intensity grid' }
];

const timeRanges = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' }
];

const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function ChartBuilderModal({ isOpen, onClose, chart, onSave, habits = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'ring-calendar',
        dataSource: {
            sourceType: 'habit',
            itemId: null,
            itemTitle: ''
        },
        style: {
            color: '#3b82f6',
            useRings: true,
            ringSize: 'medium'
        },
        timeRange: 'month',
        size: 'wide'
    });

    useEffect(() => {
        if (chart) {
            setFormData({
                name: chart.name || '',
                type: chart.type || 'ring-calendar',
                dataSource: chart.dataSource || {
                    sourceType: 'habit',
                    itemId: null,
                    itemTitle: ''
                },
                style: chart.style || {
                    color: '#3b82f6',
                    useRings: true,
                    ringSize: 'medium'
                },
                timeRange: chart.timeRange || 'month',
                size: chart.size || 'wide'
            });
        } else {
            setFormData({
                name: '',
                type: 'ring-calendar',
                dataSource: {
                    sourceType: 'habit',
                    itemId: null,
                    itemTitle: ''
                },
                style: {
                    color: '#3b82f6',
                    useRings: true,
                    ringSize: 'medium'
                },
                timeRange: 'month',
                size: 'wide'
            });
        }
    }, [chart, isOpen]);

    const handleHabitSelect = (habitId) => {
        const habit = habits.find(h => h._id === habitId);
        setFormData(prev => ({
            ...prev,
            name: prev.name || habit?.title || '',
            dataSource: {
                ...prev.dataSource,
                sourceType: 'habit',
                itemId: habitId,
                itemTitle: habit?.title || ''
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={chart ? 'Edit Chart' : 'Add New Chart'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="chart-builder-form">
                {/* Step 1: Select Activity */}
                <div className="form-section">
                    <h4 className="form-section__title">1. Select Activity</h4>
                    <div className="activity-grid">
                        <button
                            type="button"
                            className={`activity-btn ${formData.dataSource.sourceType === 'all-habits' ? 'activity-btn--active' : ''}`}
                            onClick={() => setFormData(prev => ({
                                ...prev,
                                name: prev.name || 'All Habits',
                                dataSource: { sourceType: 'all-habits', itemId: null, itemTitle: 'All Habits' }
                            }))}
                        >
                            <span className="activity-icon">📋</span>
                            <span className="activity-label">All Habits</span>
                        </button>

                        {habits.map(habit => (
                            <button
                                key={habit._id}
                                type="button"
                                className={`activity-btn ${formData.dataSource.itemId === habit._id ? 'activity-btn--active' : ''}`}
                                onClick={() => handleHabitSelect(habit._id)}
                                style={{ '--activity-color': habit.color }}
                            >
                                <span className="activity-icon">{habit.icon}</span>
                                <span className="activity-label">{habit.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Chart Type */}
                <div className="form-section">
                    <h4 className="form-section__title">2. Chart Type</h4>
                    <div className="chart-type-grid">
                        {chartTypes.map(ct => (
                            <button
                                key={ct.value}
                                type="button"
                                className={`chart-type-btn ${formData.type === ct.value ? 'chart-type-btn--active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, type: ct.value }))}
                            >
                                <span className="chart-type-icon">{ct.icon}</span>
                                <span className="chart-type-label">{ct.label}</span>
                                <span className="chart-type-desc">{ct.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 3: Style Options */}
                <div className="form-section">
                    <h4 className="form-section__title">3. Style & Options</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Chart Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Running Progress"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Time Range</label>
                            <div className="time-range-btns">
                                {timeRanges.map(tr => (
                                    <button
                                        key={tr.value}
                                        type="button"
                                        className={`time-range-btn ${formData.timeRange === tr.value ? 'time-range-btn--active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, timeRange: tr.value }))}
                                    >
                                        {tr.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-selector">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-btn ${formData.style.color === color ? 'color-btn--active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        style: { ...prev.style, color }
                                    }))}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {chart ? 'Save Changes' : 'Create Chart'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default ChartBuilderModal;
