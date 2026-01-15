import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import './HabitModal.css';

const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

const icons = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '💤', '🥗', '💊', '🎨', '✍️', '🎵', '💰', '🧹', '📱'];
const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
const difficulties = [
    { value: 'easy', label: 'Easy', color: '#10b981', icon: '🌱' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', icon: '⚡' },
    { value: 'hard', label: 'Hard', color: '#f59e0b', icon: '🔥' },
    { value: 'extreme', label: 'Extreme', color: '#ef4444', icon: '💎' }
];

function HabitModal({ isOpen, onClose, habit, onSave }) {
    const { tags } = useApp();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'recurring',
        trackingType: 'count', // 'count' or 'value'
        target: 1,
        targetValue: 10000,
        unit: 'steps',
        frequency: 'daily',
        effort: 3,
        timeRequired: '',
        coinsReward: 10,
        icon: '🎯',
        color: '#3b82f6',
        notes: '',
        tags: [],
        subtasks: [],
        logFields: [] // Custom structured logging fields
    });

    const [newSubtask, setNewSubtask] = useState('');
    const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
    const [newLogField, setNewLogField] = useState({ name: '', unit: '', fieldType: 'number' });

    useEffect(() => {
        if (habit) {
            setFormData({
                title: habit.title || '',
                description: habit.description || '',
                type: habit.type || 'recurring',
                trackingType: habit.trackingType || 'count',
                target: habit.target || 1,
                targetValue: habit.targetValue || 10000,
                unit: habit.unit || 'steps',
                frequency: habit.frequency || 'daily',
                effort: habit.effort || 3,
                timeRequired: habit.timeRequired || '',
                coinsReward: habit.coinsReward || 10,
                icon: habit.icon || '🎯',
                color: habit.color || '#3b82f6',
                notes: habit.notes || '',
                tags: habit.tags || [],
                subtasks: habit.subtasks || [],
                logFields: habit.logFields || []
            });
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'recurring',
                trackingType: 'count',
                target: 1,
                targetValue: 10000,
                unit: 'steps',
                frequency: 'daily',
                effort: 3,
                timeRequired: '',
                coinsReward: 10,
                icon: '🎯',
                color: '#3b82f6',
                notes: '',
                tags: [],
                subtasks: [],
                logFields: []
            });
        }
        setNewSubtask('');
        setNewLogField({ name: '', unit: '', fieldType: 'number' });
    }, [habit, isOpen]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const toggleTag = (tagId) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId)
                ? prev.tags.filter(id => id !== tagId)
                : [...prev.tags, tagId]
        }));
    };

    const addSubtask = () => {
        if (newSubtask.trim()) {
            setFormData(prev => ({
                ...prev,
                subtasks: [...prev.subtasks, {
                    title: newSubtask.trim(),
                    completed: false,
                    dueDate: newSubtaskDueDate || null
                }]
            }));
            setNewSubtask('');
            setNewSubtaskDueDate('');
        }
    };

    const removeSubtask = (index) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter((_, i) => i !== index)
        }));
    };

    // Log fields management
    const addLogField = () => {
        if (newLogField.name.trim()) {
            setFormData(prev => ({
                ...prev,
                logFields: [...prev.logFields, {
                    name: newLogField.name.trim(),
                    unit: newLogField.unit.trim(),
                    fieldType: newLogField.fieldType
                }]
            }));
            setNewLogField({ name: '', unit: '', fieldType: 'number' });
        }
    };

    const removeLogField = (index) => {
        setFormData(prev => ({
            ...prev,
            logFields: prev.logFields.filter((_, i) => i !== index)
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
            title={habit ? 'Edit Habit' : 'New Habit'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="habit-form">
                <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Morning Meditation"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your habit..."
                        rows={3}
                    />
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div className="tag-selector">
                            {tags.map(tag => (
                                <button
                                    key={tag._id}
                                    type="button"
                                    className={`tag-btn ${formData.tags.includes(tag._id) ? 'tag-btn--active' : ''}`}
                                    style={{ '--tag-color': tag.color }}
                                    onClick={() => toggleTag(tag._id)}
                                >
                                    {tag.icon} {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option value="recurring">Recurring</option>
                            <option value="one-time">One-time</option>
                        </select>
                    </div>

                    {formData.type === 'recurring' && (
                        <div className="form-group">
                            <label className="form-label">Frequency</label>
                            <select name="frequency" value={formData.frequency} onChange={handleChange}>
                                {frequencies.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Goal Style</label>
                        <div className="tracking-type-selector">
                            <button
                                type="button"
                                className={`type-btn ${formData.trackingType === 'count' ? 'type-btn--active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, trackingType: 'count' }))}
                            >
                                <span className="type-icon">☑️</span>
                                <div className="type-info">
                                    <span className="type-title">Simple</span>
                                    <span className="type-desc">Check off x times</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.trackingType === 'value' ? 'type-btn--active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, trackingType: 'value' }))}
                            >
                                <span className="type-icon">📊</span>
                                <div className="type-info">
                                    <span className="type-title">Numeric</span>
                                    <span className="type-desc">Track specific value</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            {formData.trackingType === 'value' ? 'Target Value' : 'Target Completions'}
                        </label>
                        {formData.trackingType === 'value' ? (
                            <div className="input-group">
                                <input
                                    type="number"
                                    name="targetValue"
                                    value={formData.targetValue}
                                    onChange={handleChange}
                                    min={1}
                                    placeholder="e.g. 10000"
                                />
                                <input
                                    type="text"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    placeholder="Unit (e.g. steps)"
                                    className="unit-input"
                                />
                            </div>
                        ) : (
                            <input
                                type="number"
                                name="target"
                                value={formData.target}
                                onChange={handleChange}
                                min={1}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Time Required (mins)</label>
                        <input
                            type="number"
                            name="timeRequired"
                            value={formData.timeRequired}
                            onChange={handleChange}
                            placeholder="Optional"
                            min={0}
                        />
                    </div>
                </div>

                {/* Subtasks */}
                <div className="form-group">
                    <label className="form-label">Subtasks</label>
                    <div className="subtasks-container">
                        {formData.subtasks.map((subtask, index) => (
                            <div key={index} className="subtask-item">
                                <div className="subtask-item__content">
                                    <span className="subtask-item__title">{subtask.title}</span>
                                    {subtask.dueDate && (
                                        <span className="subtask-item__due">📅 {new Date(subtask.dueDate).toLocaleDateString()}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="subtask-remove"
                                    onClick={() => removeSubtask(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <div className="subtask-add">
                            <input
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                placeholder="Add a subtask"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                            />
                            <input
                                type="date"
                                value={newSubtaskDueDate}
                                onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                                className="subtask-date-input"
                            />
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtask}>
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log Fields - Custom structured logging metrics */}
                <div className="form-group">
                    <label className="form-label">Log Fields (Optional)</label>
                    <p className="form-hint" style={{ marginBottom: 'var(--space-sm)' }}>
                        Define custom metrics to log each time (e.g., Speed Test: Download, Upload, Ping)
                    </p>
                    <div className="log-fields-container">
                        {formData.logFields.map((field, index) => (
                            <div key={index} className="log-field-item">
                                <div className="log-field-item__content">
                                    <span className="log-field-item__name">{field.name}</span>
                                    {field.unit && (
                                        <span className="log-field-item__unit">({field.unit})</span>
                                    )}
                                    <span className={`log-field-item__type badge badge-${field.fieldType === 'number' ? 'blue' : 'purple'}`}>
                                        {field.fieldType === 'number' ? '123' : 'abc'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="subtask-remove"
                                    onClick={() => removeLogField(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <div className="log-field-add">
                            <input
                                type="text"
                                value={newLogField.name}
                                onChange={(e) => setNewLogField(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Field name (e.g., Download Speed)"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLogField())}
                            />
                            <input
                                type="text"
                                value={newLogField.unit}
                                onChange={(e) => setNewLogField(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="Unit (e.g., Mbps)"
                                className="log-field-unit-input"
                            />
                            <select
                                value={newLogField.fieldType}
                                onChange={(e) => setNewLogField(prev => ({ ...prev, fieldType: e.target.value }))}
                                className="log-field-type-select"
                            >
                                <option value="number">Number</option>
                                <option value="text">Text</option>
                            </select>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addLogField}>
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Effort Level (1-5)</label>
                    <div className="effort-selector">
                        {[1, 2, 3, 4, 5].map(level => (
                            <button
                                key={level}
                                type="button"
                                className={`effort-btn ${formData.effort === level ? 'effort-btn--active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, effort: level }))}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <span className="form-hint">
                        {['', 'Easy', 'Light', 'Medium', 'Hard', 'Intense'][formData.effort]}
                    </span>
                </div>

                <div className="form-group">
                    <label className="form-label">Difficulty (Reward Multiplier)</label>
                    <div className="difficulty-selector">
                        {difficulties.map(d => (
                            <button
                                key={d.value}
                                type="button"
                                className={`difficulty-btn ${formData.difficulty === d.value ? 'difficulty-btn--active' : ''}`}
                                style={{ '--difficulty-color': d.color }}
                                onClick={() => setFormData(prev => ({ ...prev, difficulty: d.value }))}
                            >
                                <span className="difficulty-icon">{d.icon}</span>
                                <span className="difficulty-label">{d.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Icon</label>
                        <div className="icon-selector">
                            {icons.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    className={`icon-btn ${formData.icon === icon ? 'icon-btn--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-selector">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-btn ${formData.color === color ? 'color-btn--active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Coin Reward 🪙</label>
                    <input
                        type="number"
                        name="coinsReward"
                        value={formData.coinsReward}
                        onChange={handleChange}
                        min={0}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any additional notes..."
                        rows={2}
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {habit ? 'Save Changes' : 'Create Habit'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default HabitModal;
