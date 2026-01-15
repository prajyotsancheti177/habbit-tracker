import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import KanbanBoard from '../components/board/KanbanBoard';
import ItemCard from '../components/board/ItemCard';
import TaskModal from '../components/modals/TaskModal';
import TagModal from '../components/modals/TagModal';
import GlassCard from '../components/ui/GlassCard';
import './TasksPage.css';

function TasksPage() {
    const {
        tasks,
        tags,
        setTasks,
        fetchTasks,
        fetchTags,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        toggleTaskSubtask,
        reorderTasks
    } = useApp();

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([fetchTasks(), fetchTags()]);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchTasks, fetchTags]);

    // Filter tasks by type, priority, and tag
    const filteredTasks = tasks.filter(t => {
        const typeMatch = typeFilter === 'all' || t.type === typeFilter;
        const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
        const tagMatch = tagFilter === 'all' || (t.tags && t.tags.includes(tagFilter));
        return typeMatch && priorityMatch && tagMatch;
    });

    const handleDragEnd = async (updates) => {
        // Optimistic update
        setTasks(prev => prev.map(t => {
            const update = updates.find(u => u.id === t._id);
            return update ? { ...t, order: update.order, status: update.status } : t;
        }));

        try {
            await reorderTasks(updates);
        } catch (error) {
            console.error('Failed to reorder:', error);
            fetchTasks(); // Revert on error
        }
    };

    const handleEdit = (task) => {
        setSelectedTask(task);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedTask(null);
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (selectedTask) {
                await updateTask(selectedTask._id, data);
            } else {
                await createTask(data);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save task:', error);
        }
    };

    const handleComplete = async (task) => {
        try {
            await completeTask(task._id, {});
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const handleDelete = async (task) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(task._id);
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const handleToggleSubtask = async (taskId, subtaskId) => {
        try {
            await toggleTaskSubtask(taskId, subtaskId);
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
                            📋 <span className="text-gradient">Tasks</span>
                        </h1>
                        <p className="page-subtitle">
                            Manage your tasks and projects
                        </p>
                    </div>
                    <div className="page-header__actions">
                        <button className="btn btn-secondary" onClick={() => setTagModalOpen(true)}>
                            🏷️ Manage Tags
                        </button>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            + New Task
                        </button>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">Type:</span>
                        <button
                            className={`filter-btn ${typeFilter === 'all' ? 'filter-btn--active' : ''}`}
                            onClick={() => setTypeFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${typeFilter === 'short-term' ? 'filter-btn--active' : ''}`}
                            onClick={() => setTypeFilter('short-term')}
                        >
                            Short-term
                        </button>
                        <button
                            className={`filter-btn ${typeFilter === 'long-term' ? 'filter-btn--active' : ''}`}
                            onClick={() => setTypeFilter('long-term')}
                        >
                            Long-term
                        </button>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">Priority:</span>
                        <button
                            className={`filter-btn ${priorityFilter === 'all' ? 'filter-btn--active' : ''}`}
                            onClick={() => setPriorityFilter('all')}
                        >
                            All
                        </button>
                        {['urgent', 'high', 'medium', 'low'].map(p => (
                            <button
                                key={p}
                                className={`filter-btn ${priorityFilter === p ? 'filter-btn--active' : ''}`}
                                onClick={() => setPriorityFilter(p)}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
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

            {filteredTasks.length > 0 ? (
                <KanbanBoard
                    items={filteredTasks}
                    onDragEnd={handleDragEnd}
                    renderCard={(task) => (
                        <ItemCard
                            item={task}
                            type="task"
                            tags={tags}
                            onEdit={handleEdit}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            onToggleSubtask={handleToggleSubtask}
                        />
                    )}
                    emptyMessage="No tasks in this column"
                />
            ) : (
                <GlassCard className="empty-state-card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 className="empty-state-title">No tasks yet</h3>
                        <p className="empty-state-text">
                            Create your first task to get started
                        </p>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            + Create Task
                        </button>
                    </div>
                </GlassCard>
            )}

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                task={selectedTask}
                onSave={handleSave}
            />

            <TagModal
                isOpen={tagModalOpen}
                onClose={() => setTagModalOpen(false)}
            />
        </div>
    );
}

export default TasksPage;
