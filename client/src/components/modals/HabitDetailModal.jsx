import Modal from '../ui/Modal';
import './HabitDetailModal.css';

const effortLabels = ['', 'Easy', 'Light', 'Medium', 'Hard', 'Intense'];
const feelingEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];
const difficultyLabels = {
    easy: { label: 'Easy', color: '#10b981', icon: '🌱' },
    medium: { label: 'Medium', color: '#3b82f6', icon: '⚡' },
    hard: { label: 'Hard', color: '#f59e0b', icon: '🔥' },
    extreme: { label: 'Extreme', color: '#ef4444', icon: '💎' }
};

function HabitDetailModal({ isOpen, onClose, habit, tags = [], onEdit, onComplete, onDelete, onUncomplete }) {
    if (!habit) return null;

    // Get tag objects for this habit
    const habitTags = habit.tags
        ? tags.filter(t => habit.tags.includes(t._id))
        : [];

    const isValueTracking = habit.trackingType === 'value' && habit.targetValue;
    const hasSubtasks = habit.subtasks && habit.subtasks.length > 0;
    const hasLogFields = habit.logFields && habit.logFields.length > 0;
    const difficulty = difficultyLabels[habit.difficulty] || difficultyLabels.medium;

    // Calculate progress
    let progress = 0;
    let progressLabel = '';

    if (isValueTracking) {
        progress = Math.min(100, ((habit.currentValue || 0) / habit.targetValue) * 100);
        progressLabel = `${habit.currentValue || 0}/${habit.targetValue} ${habit.unit}`;
    } else {
        const completions = habit.type === 'recurring' ? (habit.periodCompletions || 0) : habit.completions;
        progress = Math.min(100, (completions / habit.target) * 100);
        progressLabel = `${completions}/${habit.target}`;
    }

    const completedSubtasks = hasSubtasks
        ? habit.subtasks.filter(st => st.completed).length
        : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Habit Details" size="md">
            <div className="habit-detail">
                {/* Header with icon and title */}
                <div className="habit-detail__header">
                    <span className="habit-detail__icon" style={{ background: habit.color }}>
                        {habit.icon || '🎯'}
                    </span>
                    <div className="habit-detail__title-section">
                        <h3 className="habit-detail__title">{habit.title}</h3>
                        <div className="habit-detail__badges">
                            <span className="badge badge-blue">{habit.type}</span>
                            <span className="badge" style={{
                                background: `${difficulty.color}20`,
                                borderColor: difficulty.color,
                                color: difficulty.color
                            }}>
                                {difficulty.icon} {difficulty.label}
                            </span>
                            <span className={`badge badge-${habit.status === 'done' ? 'green' : habit.status === 'in-progress' ? 'orange' : 'blue'}`}>
                                {habit.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {habit.description && (
                    <div className="habit-detail__section">
                        <p className="habit-detail__description">{habit.description}</p>
                    </div>
                )}

                {/* Tags */}
                {habitTags.length > 0 && (
                    <div className="habit-detail__section">
                        <label className="habit-detail__label">Tags</label>
                        <div className="habit-detail__tags">
                            {habitTags.map(tag => (
                                <span
                                    key={tag._id}
                                    className="habit-detail__tag"
                                    style={{ '--tag-color': tag.color }}
                                >
                                    {tag.icon} {tag.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Progress */}
                <div className="habit-detail__section">
                    <label className="habit-detail__label">Progress</label>
                    <div className="habit-detail__progress">
                        <div className="habit-detail__progress-bar">
                            <div
                                className="habit-detail__progress-fill"
                                style={{ width: `${progress}%`, background: habit.color }}
                            />
                        </div>
                        <span className="habit-detail__progress-text">
                            {progressLabel} ({Math.round(progress)}%)
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="habit-detail__stats">
                    <div className="habit-detail__stat">
                        <span className="habit-detail__stat-icon">🔥</span>
                        <span className="habit-detail__stat-value">{habit.currentStreak || 0}</span>
                        <span className="habit-detail__stat-label">Current Streak</span>
                    </div>
                    <div className="habit-detail__stat">
                        <span className="habit-detail__stat-icon">🏆</span>
                        <span className="habit-detail__stat-value">{habit.longestStreak || 0}</span>
                        <span className="habit-detail__stat-label">Best Streak</span>
                    </div>
                    <div className="habit-detail__stat">
                        <span className="habit-detail__stat-icon">✅</span>
                        <span className="habit-detail__stat-value">{habit.completions || 0}</span>
                        <span className="habit-detail__stat-label">Total</span>
                    </div>
                    <div className="habit-detail__stat">
                        <span className="habit-detail__stat-icon">🪙</span>
                        <span className="habit-detail__stat-value">{habit.coinsReward}</span>
                        <span className="habit-detail__stat-label">Coins</span>
                    </div>
                </div>

                {/* Completion Controls */}
                <div className="habit-detail__completion-controls">
                    <label className="habit-detail__label">Period Completions</label>
                    <div className="habit-detail__completion-buttons">
                        <button
                            className="completion-control-btn completion-control-btn--minus"
                            onClick={() => onUncomplete?.(habit)}
                            disabled={(habit.type === 'recurring' ? (habit.periodCompletions || 0) : habit.completions) <= 0}
                            title="Undo last completion"
                        >
                            −
                        </button>
                        <span className="completion-control-value">
                            {habit.type === 'recurring' ? (habit.periodCompletions || 0) : habit.completions} / {habit.target}
                        </span>
                        <button
                            className="completion-control-btn completion-control-btn--plus"
                            onClick={() => { onComplete?.(habit); onClose(); }}
                            title="Complete habit"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="habit-detail__info-grid">
                    {habit.type === 'recurring' && (
                        <div className="habit-detail__info-item">
                            <span className="habit-detail__info-label">Frequency</span>
                            <span className="habit-detail__info-value">{habit.frequency}</span>
                        </div>
                    )}
                    {habit.effort && (
                        <div className="habit-detail__info-item">
                            <span className="habit-detail__info-label">Effort</span>
                            <span className="habit-detail__info-value">💪 {effortLabels[habit.effort]}</span>
                        </div>
                    )}
                    {habit.timeRequired && (
                        <div className="habit-detail__info-item">
                            <span className="habit-detail__info-label">Time Required</span>
                            <span className="habit-detail__info-value">⏱️ {habit.timeRequired} mins</span>
                        </div>
                    )}
                    {habit.feeling && (
                        <div className="habit-detail__info-item">
                            <span className="habit-detail__info-label">Feeling</span>
                            <span className="habit-detail__info-value">{feelingEmojis[habit.feeling]}</span>
                        </div>
                    )}
                </div>

                {/* Subtasks */}
                {hasSubtasks && (
                    <div className="habit-detail__section">
                        <label className="habit-detail__label">
                            Subtasks ({completedSubtasks}/{habit.subtasks.length})
                        </label>
                        <div className="habit-detail__subtasks">
                            {habit.subtasks.map((subtask, index) => (
                                <div
                                    key={index}
                                    className={`habit-detail__subtask ${subtask.completed ? 'habit-detail__subtask--done' : ''}`}
                                >
                                    <span>{subtask.completed ? '✅' : '⬜'}</span>
                                    <span>{subtask.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Log Fields */}
                {hasLogFields && (
                    <div className="habit-detail__section">
                        <label className="habit-detail__label">Log Fields</label>
                        <div className="habit-detail__log-fields">
                            {habit.logFields.map((field, index) => (
                                <div key={index} className="habit-detail__log-field">
                                    <span className="habit-detail__log-field-name">{field.name}</span>
                                    {field.unit && (
                                        <span className="habit-detail__log-field-unit">({field.unit})</span>
                                    )}
                                    <span className={`badge badge-${field.fieldType === 'number' ? 'blue' : 'purple'}`}>
                                        {field.fieldType}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {habit.notes && (
                    <div className="habit-detail__section">
                        <label className="habit-detail__label">Notes</label>
                        <p className="habit-detail__notes">{habit.notes}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="habit-detail__actions">
                    {habit.status !== 'done' && (
                        <button
                            className="btn btn-primary"
                            onClick={() => { onComplete?.(habit); onClose(); }}
                        >
                            ✓ Complete
                        </button>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={() => onEdit?.(habit)}
                    >
                        ✏️ Edit Habit
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => { onDelete?.(habit); onClose(); }}
                        style={{ color: 'var(--color-accent-red)' }}
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default HabitDetailModal;
