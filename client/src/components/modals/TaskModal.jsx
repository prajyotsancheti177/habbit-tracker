import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import './TaskModal.css';

const priorities = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#3b82f6' },
    { value: 'high', label: 'High', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const icons = ['📋', '💻', '📞', '✉️', '📊', '🎯', '🔧', '📝', '🏠', '🛒', '💡', '🎓', '💼', '🚀', '⭐'];
const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
const difficulties = [
    { value: 'easy', label: 'Easy', color: '#10b981', icon: '🌱' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', icon: '⚡' },
    { value: 'hard', label: 'Hard', color: '#f59e0b', icon: '🔥' },
    { value: 'extreme', label: 'Extreme', color: '#ef4444', icon: '💎' }
];

function TaskModal({ isOpen, onClose, task, onSave }) {
    const { tags } = useApp();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'short-term',
        priority: 'medium',
        dueDate: '',
        effort: 3,
        timeRequired: '',
        coinsReward: 20,
        icon: '📋',
        color: '#8b5cf6',
        notes: '',
        tags: [],
        subtasks: []
    });

    const [newSubtask, setNewSubtask] = useState('');
    const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                type: task.type || 'short-term',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                effort: task.effort || 3,
                timeRequired: task.timeRequired || '',
                coinsReward: task.coinsReward || 20,
                icon: task.icon || '📋',
                color: task.color || '#8b5cf6',
                notes: task.notes || '',
                tags: task.tags || [],
                subtasks: task.subtasks || []
            });
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'short-term',
                priority: 'medium',
                dueDate: '',
                effort: 3,
                timeRequired: '',
                coinsReward: 20,
                icon: '📋',
                color: '#8b5cf6',
                notes: '',
                tags: [],
                subtasks: []
            });
        }
        setNewSubtask('');
    }, [task, isOpen]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? 'Edit Task' : 'New Task'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Complete project report"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your task..."
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
                            <option value="short-term">Short-term</option>
                            <option value="long-term">Long-term</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Priority</label>
                    <div className="priority-selector">
                        {priorities.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                className={`priority-btn ${formData.priority === p.value ? 'priority-btn--active' : ''}`}
                                style={{ '--priority-color': p.color }}
                                onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

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

                <div className="form-row">
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
                        {task ? 'Save Changes' : 'Create Task'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default TaskModal;
