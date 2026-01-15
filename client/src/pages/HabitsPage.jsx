import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import KanbanBoard from '../components/board/KanbanBoard';
import ItemCard from '../components/board/ItemCard';
import HabitModal from '../components/modals/HabitModal';
import HabitDetailModal from '../components/modals/HabitDetailModal';
import TagModal from '../components/modals/TagModal';
import GlassCard from '../components/ui/GlassCard';
import { ToastContainer } from '../components/ui/Toast';
import './HabitsPage.css';

function HabitsPage() {
    const {
        habits,
        tags,
        setHabits,
        fetchHabits,
        fetchTags,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        uncompleteHabit,
        toggleHabitSubtask,
        updateHabitValue,
        reorderHabits
    } = useApp();

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [filter, setFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [toasts, setToasts] = useState([]);

    // Toast management
    const addToast = useCallback((toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([fetchHabits(), fetchTags()]);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchHabits, fetchTags]);

    // Filter habits by type and tag
    const filteredHabits = habits.filter(h => {
        const typeMatch = filter === 'all' || h.type === filter;
        const tagMatch = tagFilter === 'all' || (h.tags && h.tags.includes(tagFilter));
        return typeMatch && tagMatch;
    });

    const handleDragEnd = async (updates) => {
        // Check for habits being moved to 'done' that weren't already done
        const completedHabits = updates.filter(update => {
            const habit = habits.find(h => h._id === update.id);
            return habit && habit.status !== 'done' && update.status === 'done';
        });

        // Optimistic update
        setHabits(prev => prev.map(h => {
            const update = updates.find(u => u.id === h._id);
            return update ? { ...h, order: update.order, status: update.status } : h;
        }));

        try {
            // If any habits were moved to done, properly complete them
            for (const update of completedHabits) {
                const habit = habits.find(h => h._id === update.id);
                if (habit) {
                    try {
                        const result = await completeHabit(habit._id, {});
                        // Show undo toast
                        addToast({
                            message: `✅ Completed "${habit.title}" (+${result.coinsEarned} coins)`,
                            type: 'success',
                            actionLabel: 'Undo',
                            action: async () => {
                                try {
                                    await uncompleteHabit(habit._id);
                                } catch (error) {
                                    console.error('Failed to undo completion:', error);
                                }
                            },
                            duration: 5000
                        });
                    } catch (error) {
                        console.error('Failed to complete habit:', error);
                    }
                }
            }

            // Reorder all items (saves order for everything, including completed items)
            await reorderHabits(updates);
        } catch (error) {
            console.error('Failed to reorder:', error);
            fetchHabits(); // Revert on error
        }
    };

    const handleView = (habit) => {
        setSelectedHabit(habit);
        setDetailModalOpen(true);
    };

    const handleEdit = (habit) => {
        setSelectedHabit(habit);
        setDetailModalOpen(false);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedHabit(null);
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (selectedHabit) {
                await updateHabit(selectedHabit._id, data);
            } else {
                await createHabit(data);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save habit:', error);
        }
    };

    const handleComplete = async (habit) => {
        try {
            const result = await completeHabit(habit._id, {});
            // Show undo toast
            addToast({
                message: `✅ Completed "${habit.title}" (+${result.coinsEarned} coins)`,
                type: 'success',
                actionLabel: 'Undo',
                action: async () => {
                    try {
                        await uncompleteHabit(habit._id);
                    } catch (error) {
                        console.error('Failed to undo completion:', error);
                    }
                },
                duration: 5000
            });
        } catch (error) {
            console.error('Failed to complete habit:', error);
        }
    };

    const handleDelete = async (habit) => {
        if (window.confirm('Are you sure you want to delete this habit?')) {
            try {
                await deleteHabit(habit._id);
            } catch (error) {
                console.error('Failed to delete habit:', error);
            }
        }
    };

    const handleToggleSubtask = async (habitId, subtaskId) => {
        try {
            await toggleHabitSubtask(habitId, subtaskId);
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton" style={{ height: '60px', marginBottom: '24px' }} />
                <div className="skeleton" style={{ height: '400px' }} />
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-header__main">
                    <div>
                        <h1 className="page-title">
                            🎯 <span className="text-gradient">Habits</span>
                        </h1>
                        <p className="page-subtitle">
                            Track and manage your daily habits
                        </p>
                    </div>
                    <div className="page-header__actions">
                        <button className="btn btn-secondary" onClick={() => setTagModalOpen(true)}>
                            🏷️ Manage Tags
                        </button>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            + New Habit
                        </button>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">Type:</span>
                        <button
                            className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'recurring' ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter('recurring')}
                        >
                            Recurring
                        </button>
                        <button
                            className={`filter-btn ${filter === 'one-time' ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter('one-time')}
                        >
                            One-time
                        </button>
                    </div>

                    {tags.length > 0 && (
                        <div className="filter-group">
                            <span className="filter-label">Tag:</span>
                            <button
                                className={`filter-btn ${tagFilter === 'all' ? 'filter-btn--active' : ''}`}
                                onClick={() => setTagFilter('all')}
                            >
                                All Tags
                            </button>
                            {tags.map(tag => (
                                <button
                                    key={tag._id}
                                    className={`filter-btn ${tagFilter === tag._id ? 'filter-btn--active' : ''}`}
                                    style={{ '--filter-color': tag.color }}
                                    onClick={() => setTagFilter(tag._id)}
                                >
                                    {tag.icon} {tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {filteredHabits.length > 0 ? (
                <KanbanBoard
                    items={filteredHabits}
                    onDragEnd={handleDragEnd}
                    renderCard={(habit) => (
                        <ItemCard
                            item={habit}
                            type="habit"
                            tags={tags}
                            onEdit={handleView}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            onToggleSubtask={handleToggleSubtask}
                            onUpdateValue={updateHabitValue}
                        />
                    )}
                    emptyMessage="No habits in this column"
                />
            ) : (
                <GlassCard className="empty-state-card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <h3 className="empty-state-title">No habits yet</h3>
                        <p className="empty-state-text">
                            Create your first habit to start tracking your progress
                        </p>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            + Create Habit
                        </button>
                    </div>
                </GlassCard>
            )}

            <HabitDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                habit={selectedHabit}
                tags={tags}
                onEdit={handleEdit}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onUncomplete={async (habit) => {
                    try {
                        await uncompleteHabit(habit._id);
                    } catch (error) {
                        console.error('Failed to undo completion:', error);
                    }
                }}
            />

            <HabitModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                habit={selectedHabit}
                onSave={handleSave}
            />

            <TagModal
                isOpen={tagModalOpen}
                onClose={() => setTagModalOpen(false)}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default HabitsPage;
