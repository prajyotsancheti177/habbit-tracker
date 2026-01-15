import { createContext, useContext, useState, useCallback } from 'react';
import { habitsApi, tasksApi, analyticsApi, tagsApi } from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [habits, setHabits] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [tags, setTags] = useState([]);
    const [summary, setSummary] = useState(null);
    const [coins, setCoins] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all habits
    const fetchHabits = useCallback(async (params) => {
        try {
            setLoading(true);
            const { data } = await habitsApi.getAll(params);
            setHabits(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all tasks
    const fetchTasks = useCallback(async (params) => {
        try {
            setLoading(true);
            const { data } = await tasksApi.getAll(params);
            setTasks(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all tags
    const fetchTags = useCallback(async () => {
        try {
            const { data } = await tagsApi.getAll();
            setTags(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Fetch summary
    const fetchSummary = useCallback(async () => {
        try {
            const { data } = await analyticsApi.getSummary();
            setSummary(data);
            setCoins(data.coins);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Create habit
    const createHabit = useCallback(async (habitData) => {
        try {
            const { data } = await habitsApi.create(habitData);
            setHabits(prev => [...prev, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Update habit
    const updateHabit = useCallback(async (id, habitData) => {
        try {
            const { data } = await habitsApi.update(id, habitData);
            setHabits(prev => prev.map(h => h._id === id ? data : h));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Delete habit
    const deleteHabit = useCallback(async (id) => {
        try {
            await habitsApi.delete(id);
            setHabits(prev => prev.filter(h => h._id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Complete habit
    const completeHabit = useCallback(async (id, data) => {
        try {
            const response = await habitsApi.complete(id, data);
            setHabits(prev => prev.map(h => h._id === id ? response.data.habit : h));
            setCoins(response.data.totalCoins);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Uncomplete habit (undo last completion)
    const uncompleteHabit = useCallback(async (id) => {
        try {
            const response = await habitsApi.uncomplete(id);
            setHabits(prev => prev.map(h => h._id === id ? response.data.habit : h));
            // Update coins by deducting refunded amount
            if (response.data.coinsRefunded) {
                setCoins(prev => Math.max(0, prev - response.data.coinsRefunded));
            }
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Toggle habit subtask
    const toggleHabitSubtask = useCallback(async (habitId, subtaskId) => {
        try {
            const { data } = await habitsApi.toggleSubtask(habitId, subtaskId);
            setHabits(prev => prev.map(h => h._id === habitId ? data : h));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Update habit value (for value-based tracking or structured log fields)
    const updateHabitValue = useCallback(async (habitId, value, increment = false, logFieldValues = null) => {
        try {
            const { data } = await habitsApi.updateValue(habitId, value, increment, logFieldValues);
            // Handle both habit response and logged response
            const habitData = data.habit || data;
            setHabits(prev => prev.map(h => h._id === habitId ? habitData : h));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Create task
    const createTask = useCallback(async (taskData) => {
        try {
            const { data } = await tasksApi.create(taskData);
            setTasks(prev => [...prev, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Update task
    const updateTask = useCallback(async (id, taskData) => {
        try {
            const { data } = await tasksApi.update(id, taskData);
            setTasks(prev => prev.map(t => t._id === id ? data : t));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Delete task
    const deleteTask = useCallback(async (id) => {
        try {
            await tasksApi.delete(id);
            setTasks(prev => prev.filter(t => t._id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Complete task
    const completeTask = useCallback(async (id, data) => {
        try {
            const response = await tasksApi.complete(id, data);
            setTasks(prev => prev.map(t => t._id === id ? response.data.task : t));
            setCoins(response.data.totalCoins);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Toggle task subtask
    const toggleTaskSubtask = useCallback(async (taskId, subtaskId) => {
        try {
            const { data } = await tasksApi.toggleSubtask(taskId, subtaskId);
            setTasks(prev => prev.map(t => t._id === taskId ? data : t));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Reorder habits
    const reorderHabits = useCallback(async (habitsData) => {
        try {
            await habitsApi.reorder(habitsData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Reorder tasks
    const reorderTasks = useCallback(async (tasksData) => {
        try {
            await tasksApi.reorder(tasksData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Tag operations
    const createTag = useCallback(async (tagData) => {
        try {
            const { data } = await tagsApi.create(tagData);
            setTags(prev => [...prev, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const updateTag = useCallback(async (id, tagData) => {
        try {
            const { data } = await tagsApi.update(id, tagData);
            setTags(prev => prev.map(t => t._id === id ? data : t));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const deleteTag = useCallback(async (id) => {
        try {
            await tagsApi.delete(id);
            setTags(prev => prev.filter(t => t._id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const value = {
        habits,
        tasks,
        tags,
        summary,
        coins,
        loading,
        error,
        setHabits,
        setTasks,
        fetchHabits,
        fetchTasks,
        fetchTags,
        fetchSummary,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        uncompleteHabit,
        toggleHabitSubtask,
        updateHabitValue,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        toggleTaskSubtask,
        reorderHabits,
        reorderTasks,
        createTag,
        updateTag,
        deleteTag,
        setError
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
