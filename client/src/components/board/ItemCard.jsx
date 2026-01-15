import { useState } from 'react';
import ProgressRing from '../ui/ProgressRing';
import './ItemCard.css';

const effortLabels = ['', 'Easy', 'Light', 'Medium', 'Hard', 'Intense'];
const feelingEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];

function ItemCard({
    item,
    type = 'habit',
    tags = [],
    onEdit,
    onComplete,
    onDelete,
    onToggleSubtask,
    onUpdateValue
}) {
    const [subtasksExpanded, setSubtasksExpanded] = useState(false);
    const [valueInput, setValueInput] = useState('');
    const [showValueInput, setShowValueInput] = useState(false);
    const [logFieldValues, setLogFieldValues] = useState({});
    const [showLogFieldsInput, setShowLogFieldsInput] = useState(false);
    const isHabit = type === 'habit';

    // Check if habit has custom log fields
    const hasLogFields = isHabit && item.logFields && item.logFields.length > 0;

    // Determine tracking type and calculate progress
    const isValueTracking = item.trackingType === 'value' && item.targetValue;
    const hasSubtasks = item.subtasks && item.subtasks.length > 0;

    // For recurring habits with count tracking, show period completions
    const habitCompletions = isHabit && item.type === 'recurring'
        ? (item.periodCompletions || 0)
        : item.completions;

    const completedSubtasks = hasSubtasks
        ? item.subtasks.filter(st => st.completed).length
        : 0;

    // Calculate progress based on tracking type
    let progress = 0;
    let progressLabel = '';

    if (isValueTracking) {
        progress = Math.min(100, ((item.currentValue || 0) / item.targetValue) * 100);
        progressLabel = `${item.currentValue || 0}/${item.targetValue} ${item.unit}`;
    } else if (hasSubtasks) {
        progress = Math.round((completedSubtasks / item.subtasks.length) * 100);
        progressLabel = `${completedSubtasks}/${item.subtasks.length}`;
    } else if (isHabit) {
        progress = Math.min(100, (habitCompletions / item.target) * 100);
        progressLabel = `${habitCompletions}/${item.target}`;
    } else {
        progress = item.progress || 0;
        progressLabel = `${progress}%`;
    }

    // Get tag objects for this item
    const itemTags = item.tags
        ? tags.filter(t => item.tags.includes(t._id))
        : [];

    const handleComplete = (e) => {
        e.stopPropagation();
        onComplete?.(item);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(item);
    };

    const handleSubtaskToggle = (e, subtaskId) => {
        e.stopPropagation();
        onToggleSubtask?.(item._id, subtaskId);
    };

    const toggleSubtasks = (e) => {
        e.stopPropagation();
        setSubtasksExpanded(!subtasksExpanded);
    };

    const handleValueSubmit = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const value = parseFloat(valueInput);
        if (!isNaN(value) && value > 0) {
            onUpdateValue?.(item._id, value);
            setValueInput('');
            setShowValueInput(false);
        }
    };

    const toggleValueInput = (e) => {
        e.stopPropagation();
        setShowValueInput(!showValueInput);
    };

    // Handle log field value changes
    const handleLogFieldChange = (fieldName, value) => {
        setLogFieldValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    // Submit log fields
    const handleLogFieldsSubmit = (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Check if at least one field has a value
        const hasValues = Object.values(logFieldValues).some(v => v !== '' && v !== null && v !== undefined);
        if (hasValues) {
            onUpdateValue?.(item._id, null, logFieldValues);
            setLogFieldValues({});
            setShowLogFieldsInput(false);
        }
    };

    const toggleLogFieldsInput = (e) => {
        e.stopPropagation();
        setShowLogFieldsInput(!showLogFieldsInput);
        // Initialize log field values
        if (!showLogFieldsInput && hasLogFields) {
            const initialValues = {};
            item.logFields.forEach(field => {
                initialValues[field.name] = '';
            });
            setLogFieldValues(initialValues);
        }
    };

    return (
        <div
            className="item-card"
            onClick={() => onEdit?.(item)}
            style={{ '--card-color': item.color || 'var(--color-accent-blue)' }}
        >
            <div className="item-card__header">
                <span className="item-card__icon">{item.icon || (isHabit ? '🎯' : '📋')}</span>
                <div className="item-card__badges">
                    <span className={`badge badge-${isHabit ? 'blue' : 'purple'}`}>
                        {item.type}
                    </span>
                    {isValueTracking && (
                        <span className="badge badge-cyan">
                            📊 {item.unit}
                        </span>
                    )}
                    {item.priority && (
                        <span className={`badge badge-${item.priority === 'urgent' ? 'red' :
                            item.priority === 'high' ? 'orange' :
                                item.priority === 'low' ? 'green' : 'blue'
                            }`}>
                            {item.priority}
                        </span>
                    )}
                </div>
            </div>

            <h4 className="item-card__title">{item.title}</h4>

            {/* Tags */}
            {itemTags.length > 0 && (
                <div className="item-card__tags">
                    {itemTags.map(tag => (
                        <span
                            key={tag._id}
                            className="item-card__tag"
                            style={{ '--tag-color': tag.color }}
                        >
                            {tag.icon} {tag.name}
                        </span>
                    ))}
                </div>
            )}

            {item.description && (
                <p className="item-card__description">{item.description}</p>
            )}

            {/* Progress Section with Apple Ring */}
            <div className="item-card__meta">
                <div className="item-card__progress">
                    <ProgressRing
                        progress={progress}
                        size={isValueTracking ? 50 : 40}
                        strokeWidth={isValueTracking ? 5 : 4}
                        color={item.color || 'var(--color-accent-blue)'}
                        showLabel={isValueTracking}
                    />
                    <div className="item-card__progress-info">
                        <span className="item-card__progress-label">{progressLabel}</span>
                        {isValueTracking && (
                            <span className="item-card__progress-percent">
                                {Math.round(progress)}%
                            </span>
                        )}
                    </div>
                </div>

                {isHabit && item.currentStreak > 0 && (
                    <span className="item-card__streak">🔥 {item.currentStreak}</span>
                )}

                {!isHabit && item.dueDate && (
                    <span className="item-card__due">
                        📅 {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* Value Input for value-based tracking */}
            {isValueTracking && (
                <div className="item-card__value-input">
                    {showValueInput ? (
                        <form onSubmit={handleValueSubmit} className="value-form">
                            <input
                                type="number"
                                value={valueInput}
                                onChange={(e) => setValueInput(e.target.value)}
                                placeholder={`Add ${item.unit}`}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                            <button type="submit" onClick={(e) => e.stopPropagation()}>+</button>
                            <button type="button" onClick={toggleValueInput}>✕</button>
                        </form>
                    ) : (
                        <button className="value-add-btn" onClick={toggleValueInput}>
                            + Log {item.unit}
                        </button>
                    )}
                </div>
            )}

            {/* Log Fields - Always visible inline */}
            {hasLogFields && (
                <div className="item-card__log-fields-inline" onClick={(e) => e.stopPropagation()}>
                    <div className="log-fields-grid">
                        {item.logFields.map((field, index) => {
                            // Get current value from habit's currentLogFieldValues
                            // MongoDB Map is serialized as object with field names as keys
                            const storedValues = item.currentLogFieldValues || {};
                            const currentValue = storedValues[field.name] ?? '';
                            const displayValue = currentValue !== undefined && currentValue !== null ? String(currentValue) : '';

                            return (
                                <div key={index} className="log-field-inline">
                                    <label className="log-field-inline__label">
                                        {field.name}
                                        {field.unit && <span className="log-field-inline__unit">{field.unit}</span>}
                                    </label>
                                    <input
                                        type={field.fieldType === 'number' ? 'number' : 'text'}
                                        value={logFieldValues[field.name] ?? displayValue}
                                        onChange={(e) => handleLogFieldChange(field.name, e.target.value)}
                                        placeholder="—"
                                        className={`log-field-inline__input ${displayValue ? 'log-field-inline__input--filled' : ''}`}
                                        onBlur={() => {
                                            // Auto-save on blur if value changed
                                            const newVal = logFieldValues[field.name];
                                            if (newVal !== undefined && newVal !== '' && newVal !== displayValue) {
                                                onUpdateValue?.(item._id, null, false, logFieldValues);
                                            }
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                onUpdateValue?.(item._id, null, false, logFieldValues);
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Subtasks Section */}
            {hasSubtasks && (
                <div className="item-card__subtasks" onClick={(e) => e.stopPropagation()}>
                    <div className="item-card__subtasks-header">
                        <span className="subtasks-label">Subtasks</span>
                        <span className="subtasks-count">{completedSubtasks}/{item.subtasks.length}</span>
                    </div>

                    <div className="item-card__subtasks-list">
                        {item.subtasks.map(subtask => (
                            <div
                                key={subtask._id}
                                className={`subtask-card ${subtask.completed ? 'subtask-card--done' : ''}`}
                                onClick={(e) => handleSubtaskToggle(e, subtask._id)}
                            >
                                <span className="subtask-card__checkbox">
                                    {subtask.completed ? '✅' : '⬜'}
                                </span>
                                <div className="subtask-card__info">
                                    <span className="subtask-card__title">{subtask.title}</span>
                                    {subtask.dueDate && (
                                        <span className="subtask-card__due">
                                            📅 {new Date(subtask.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="item-card__footer">
                <div className="item-card__info">
                    {item.effort && (
                        <span className="item-card__effort" title="Effort">
                            💪 {effortLabels[item.effort]}
                        </span>
                    )}
                    {item.feeling && (
                        <span className="item-card__feeling" title="Feeling">
                            {feelingEmojis[item.feeling]}
                        </span>
                    )}
                </div>

                <div className="item-card__actions">
                    <span className="item-card__coins">
                        🪙 {item.coinsReward}
                    </span>
                    {item.status !== 'done' && !isValueTracking && (
                        <button
                            className="item-card__action-btn item-card__action-btn--complete"
                            onClick={handleComplete}
                            title="Complete"
                        >
                            ✓
                        </button>
                    )}
                    <button
                        className="item-card__action-btn item-card__action-btn--delete"
                        onClick={handleDelete}
                        title="Delete"
                    >
                        🗑
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemCard;
